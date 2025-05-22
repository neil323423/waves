import cluster from "cluster";
import os from "os";
import net from "net";
import fs from "fs";
import { spawnSync } from "child_process";
import path from "path";
import express from "express";
import { createServer } from "http";
import compression from "compression";
import WebSocket from "ws";
import { LRUCache } from "lru-cache";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import wisp from "wisp-server-node";

const surgeConfigPath = path.resolve("surge.config.json");
const isSurgedRun = process.argv.includes("--surged");

function applySurgeAndRestartIfNeeded() {
  if (isSurgedRun) {
    try {
      const config = JSON.parse(fs.readFileSync(surgeConfigPath, "utf-8"));
      process.env.UV_THREADPOOL_SIZE = String(config.uvThreadpoolSize);
    } catch {
    }
    return;
  }

  console.log('[~] Running Surge...');
  const result = spawnSync("node", ["./others/surge.mjs"], { stdio: "inherit" });
  if (result.error) {
    console.error('[!] Surger failed:', result.error);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(surgeConfigPath, "utf-8"));
  const nodeArgs = config.nodeFlags.concat([path.resolve("index.mjs"), "--surged"]);
  const env = {
    ...process.env,
    UV_THREADPOOL_SIZE: String(config.uvThreadpoolSize),
    ALREADY_SURGED: "true"
  };

  console.log(`[~] Relaunching with Node flags: ${config.nodeFlags.join(' ')}`);
  const relaunch = spawnSync(process.execPath, nodeArgs, { stdio: 'inherit', env });
  process.exit(relaunch.status || 0);
}

applySurgeAndRestartIfNeeded();

if (global.gc) {
  setInterval(() => {
    const { heapUsed, heapTotal } = process.memoryUsage();
    if (heapTotal > 0 && heapUsed / heapTotal > 0.7) {
      global.gc();
      console.info('[~] Performed GC due to high heap usage');
    }
  }, 60_000);
}

import './others/scaler.mjs';
import './others/warmup.mjs';

const cache = new LRUCache({
  maxSize: 1000,
  ttl: 4 * 24 * 60 * 60 * 1000,
  allowStale: false,
});

const port = parseInt(process.env.PORT || "3000", 10);

function logInfo(msg)    { console.info(`[~] ${msg}`); }
function logSuccess(msg) { console.info(`[+] ${msg}`); }
function logError(err)   { console.error(`[!] ${err instanceof Error ? err.message : err}`); }

process.on("uncaughtException", err => logError(`Unhandled Exception: ${err}`));
process.on("unhandledRejection", reason => logError(`Unhandled Rejection: ${reason}`));

if (cluster.isPrimary) {
  const cpus = os.cpus().length;
  const workers = Math.max(1, cpus - 1);
  logInfo(`Master: forking ${workers} of ${cpus} cores`);
  for (let i = 0; i < workers; i++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    logError(`Worker ${worker.process.pid} exited (code=${code}, signal=${signal}). Restarting...`);
    cluster.fork();
  });

  let current = 0;
  const server = net.createServer({ pauseOnConnect: true }, conn => {
    const workersArr = Object.values(cluster.workers);
    if (!workersArr.length) return conn.destroy();
    const worker = workersArr[current++ % workersArr.length];
    worker.send("sticky-session:connection", conn);
  });

  server.on("error", err => logError(`Server error: ${err}`));
  server.listen(port, () => logSuccess(`Server listening on port ${port}`));

} else {
  const __dirname = process.cwd();
  const publicPath = path.join(__dirname, "public");
  const app = express();

  app.use(compression({ level: 4, memLevel: 4, threshold: 1024 }));

  app.use((req, res, next) => {
    const key = req.originalUrl;
    const val = cache.get(key);
    if (val) {
      res.setHeader("X-Cache", "HIT");
      return res.send(val);
    }
    res.sendResponse = res.send.bind(res);
    res.send = body => {
      cache.set(key, body);
      res.setHeader("X-Cache", "MISS");
      res.sendResponse(body);
    };
    next();
  });

  const staticOpts = { maxAge: "7d", immutable: true };
  app.use("/baremux/", express.static(baremuxPath, staticOpts));
  app.use("/epoxy/", express.static(epoxyPath, staticOpts));
  app.use("/libcurl/", express.static(libcurlPath, staticOpts));
  app.use(express.static(publicPath, staticOpts));
  app.use("/wah/", express.static(uvPath, staticOpts));

  app.use(express.json());

  const sendHtml = file => (req, res) => res.sendFile(path.join(publicPath, file));
  app.get('/', sendHtml('$.html'));
  app.get('/g', sendHtml('!.html'));
  app.get('/a', sendHtml('!!.html'));
  app.get('/resent', (req, res) => res.sendFile(path.join(publicPath, 'resent', 'index.html')));
  app.use((req, res) => res.status(404).sendFile(path.join(publicPath, '404.html')));

  const server = createServer(app);
  server.keepAliveTimeout = 0;
  server.headersTimeout = 0;

  const pingWSS = new WebSocket.Server({ noServer: true, maxPayload: 4 * 1024 * 1024, perMessageDeflate: false });
  pingWSS.on("connection", (ws, req) => {
    const remote = req.socket.remoteAddress || 'unknown';
    let lat = [];
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    }, 1000);
    ws.on('message', msg => {
      try {
        const data = JSON.parse(msg);
        if (data.type === 'pong' && data.timestamp) {
          const d = Date.now() - data.timestamp;
          lat.push(d);
          if (lat.length > 5) lat.shift();
          ws.send(JSON.stringify({ type: 'latency', latency: d }));
        }
      } catch(e) { logError(`Ping error: ${e}`); }
    });
    ws.on('close', () => {
      clearInterval(interval);
      const avg = lat.length ? (lat.reduce((a,b)=>a+b)/lat.length).toFixed(2) : 0;
      logInfo(`WS ${remote} closed. Avg latency ${avg}ms`);
    });
  });

  server.on('upgrade', (req, sock, head) => {
    if (req.url === '/w/ping') {
      pingWSS.handleUpgrade(req, sock, head, ws => pingWSS.emit('connection', ws, req));
    } else if (req.url.startsWith('/w/')) {
      wisp.routeRequest(req, sock, head);
    } else {
      sock.end();
    }
  });

  server.on('error', err => logError(`Worker server error: ${err}`));
  server.listen(0, () => logSuccess(`Worker ${process.pid} ready`));

  process.on('message', (msg, conn) => {
    if (msg === 'sticky-session:connection' && conn) {
      server.emit('connection', conn);
      conn.resume();
    }
  });
}