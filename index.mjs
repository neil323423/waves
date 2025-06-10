import cluster from "cluster";
import os from "os";
import net from "net";
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
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
    } catch {}
    return;
  }
  const result = spawnSync("node", ["./others/surge.mjs"], { stdio: "inherit" });
  if (result.error) process.exit(1);
  const config = JSON.parse(fs.readFileSync(surgeConfigPath, "utf-8"));
  const nodeArgs = [...config.nodeFlags, path.resolve("index.mjs"), "--surged"];
  const env = {
    ...process.env,
    UV_THREADPOOL_SIZE: String(config.uvThreadpoolSize),
    ALREADY_SURGED: "true"
  };
  const relaunch = spawnSync(process.execPath, nodeArgs, { stdio: "inherit", env });
  process.exit(relaunch.status || 0);
}

applySurgeAndRestartIfNeeded();

if (global.gc) {
  setInterval(() => {
    const { heapUsed, heapTotal } = process.memoryUsage();
    if (heapTotal > 0 && heapUsed / heapTotal > 0.8) global.gc();
  }, 120000);
}

import "./others/scaler.mjs";
import "./others/warmup.mjs";

const port = parseInt(process.env.PORT || "3000", 10);

function logInfo(msg) {
  console.info(`[~] ${msg}`);
}

function logSuccess(msg) {
  console.info(`[+] ${msg}`);
}

function logError(err) {
  console.error(`[!] ${err instanceof Error ? err.message : err}`);
}

process.on("uncaughtException", err => logError(`Unhandled Exception: ${err}`));
process.on("unhandledRejection", reason => logError(`Unhandled Rejection: ${reason}`));

if (cluster.isPrimary) {
  const workers = Math.max(1, os.cpus().length - 1);
  logInfo(`Master: forking ${workers} workers`);
  for (let i = 0; i < workers; i++) {
    cluster.fork();
  }
  cluster.on("exit", worker => {
    logError(`Worker ${worker.process.pid} exited. Restarting...`);
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
  server.listen(port, () => logSuccess(`Server listening on ${port}`));
} else {
  const startTime = Date.now();
  const __dirname = process.cwd();
  const publicPath = path.join(__dirname, "public");
  const app = express();
  const cache = new LRUCache({ max: 500, ttl: 60000, allowStale: false });
  const latencySamples = new Array(200);

  app.use(compression({ level: 4, memLevel: 4, threshold: 1024 }));

  app.use((req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    const key = req.originalUrl;
    const val = cache.get(key);
    if (val) {
      res.setHeader("X-Cache", "HIT");
      return res.send(val);
    }
    res.sendResponse = res.send;
    res.send = body => {
      cache.set(key, body);
      res.setHeader("X-Cache", "MISS");
      res.sendResponse(body);
    };
    next();
  });

  const staticOpts = { maxAge: "7d", immutable: true, etag: false };
  app.use("/baremux/", express.static(baremuxPath, staticOpts));
  app.use("/epoxy/", express.static(epoxyPath, staticOpts));
  app.use("/libcurl/", express.static(libcurlPath, staticOpts));
  app.use(express.static(publicPath, staticOpts));
  app.use("/wah/", express.static(uvPath, staticOpts));

  const sendHtml = file => (_req, res) => res.sendFile(path.join(publicPath, file));
  app.get("/", sendHtml("$.html"));
  app.get("/g", sendHtml("!.html"));
  app.get("/s", sendHtml("!!.html"));
  app.get("/resent", (_req, res) => res.sendFile(path.join(publicPath, "resent", "index.html")));

  app.get("/api/info", (_req, res) => {
    try {
      const average = latencySamples.length
        ? latencySamples.reduce((a, b) => a + b, 0) / latencySamples.length
        : 0;
      let speed = "Medium";
      if (average < 200) speed = "Fast";
      else if (average > 500) speed = "Slow";
      const cpus = os.cpus();
      const totalMem = os.totalmem() / 1024 / 1024 / 1024;
      res.json({
        speed,
        averageLatency: average.toFixed(2),
        specs: `${cpus[0].model} + ${cpus.length} CPU Cores + ${totalMem.toFixed(1)}GB of RAM`,
        startTime,
        samples: latencySamples.length,
        timestamp: Date.now()
      });
    } catch {
      res.status(500).json({ error: "Internal error" });
    }
  });

  app.use((_req, res) => res.status(404).sendFile(path.join(publicPath, "404.html")));

  const server = createServer(app);
  server.keepAliveTimeout = 5000;
  server.headersTimeout = 10000;

  const pingWSS = new WebSocket.Server({ noServer: true, maxPayload: 16384, perMessageDeflate: false });

  pingWSS.on("connection", (ws, req) => {
    const remote = req.socket.remoteAddress || "unknown";
    const lat = [];
    let sampleIndex = 0;
    const sendPing = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping", timestamp: Date.now() }));
      }
    };
    const pingInterval = setInterval(sendPing, 500);
    sendPing();
    ws.on("message", msg => {
      try {
        const data = JSON.parse(msg);
        if (data.type === "pong" && data.timestamp) {
          const d = Date.now() - data.timestamp;
          lat.push(d);
          if (lat.length > 10) lat.shift();
          latencySamples[sampleIndex % latencySamples.length] = d;
          sampleIndex = (sampleIndex + 1) % latencySamples.length;
          ws.send(JSON.stringify({ type: "latency", latency: d }), { compress: false });
        }
      } catch {}
    });
    ws.on("close", () => {
      clearInterval(pingInterval);
      const avg = lat.length ? (lat.reduce((a, b) => a + b) / lat.length).toFixed(2) : 0;
      logInfo(`WS ${remote} closed. Avg: ${avg}ms`);
    });
  });

  server.on("upgrade", (req, sock, head) => {
    if (req.url === "/w/ping") {
      pingWSS.handleUpgrade(req, sock, head, ws => pingWSS.emit("connection", ws, req));
    } else if (req.url.startsWith("/w/")) {
      wisp.routeRequest(req, sock, head);
    } else {
      sock.destroy();
    }
  });

  server.on("error", err => logError(`Worker error: ${err}`));
  server.listen(0, () => logSuccess(`Worker ${process.pid} ready`));

  process.on("message", (msg, conn) => {
    if (msg === "sticky-session:connection" && conn) {
      server.emit("connection", conn);
      conn.resume();
    }
  });
}