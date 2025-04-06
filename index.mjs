import cluster from "cluster";
import os from "os";
import net from "net";
import express from "express";
import { createServer } from "http";
import path from "path";
import compression from "compression";
import WebSocket from "ws";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import wisp from "wisp-server-node";
import NodeCache from "node-cache";

const port = parseInt(process.env.PORT || "3000", 10);
cluster.schedulingPolicy = cluster.SCHED_RR;

function logInfo(message) {
  console.info(`[INFO] ${message}`);
}
function logError(error) {
  const msg = error instanceof Error ? error.message : error;
  console.error(`[ERROR] ${msg}`);
}

process.on("uncaughtException", (err) => logError(`Unhandled Exception: ${err}`));
process.on("unhandledRejection", (reason) => logError(`Unhandled Promise Rejection: ${reason}`));

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  logInfo(`Master started. Forking ${numCPUs} workers.`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  cluster.on("exit", (worker, code, signal) => {
    logError(`Worker ${worker.process.pid} terminated (code: ${code}, signal: ${signal}). Restarting...`);
    cluster.fork();
  });
  let currentWorker = 0;
  const server = net.createServer({ pauseOnConnect: true }, (connection) => {
    const workerIds = Object.keys(cluster.workers);
    if (workerIds.length === 0) {
      connection.destroy();
      return;
    }
    const worker = cluster.workers[workerIds[currentWorker % workerIds.length]];
    currentWorker++;
    if (worker) worker.send("sticky-session:connection", connection);
  });
  server.on("error", (err) => logError(`Server error: ${err}`));
  server.listen(port, () => logInfo(`Server running at http://localhost:${port}`));
} else {

  process.env.UV_THREADPOOL_SIZE = os.cpus().length * 2;

  const __dirname = process.cwd();
  const publicPath = path.join(__dirname, "public");
  const app = express();

  app.use(compression({ level: 9, threshold: 128, memLevel: 9 }));

  const cache = new NodeCache({ stdTTL: 1, checkperiod: 1 });
  app.use((req, res, next) => {
    const key = req.originalUrl;
    if (cache.has(key)) {
      res.setHeader("X-Cache", "HIT");
      return res.send(cache.get(key));
    }
    res.sendResponse = res.send;
    res.send = (body) => {
      cache.set(key, body);
      res.setHeader("X-Cache", "MISS");
      res.sendResponse(body);
    };
    next();
  });

  const staticOpts = { maxAge: "1s" };
  app.use("/baremux/", express.static(baremuxPath, staticOpts));
  app.use("/epoxy/", express.static(epoxyPath, staticOpts));
  app.use("/libcurl/", express.static(libcurlPath, staticOpts));
  app.use(express.static(publicPath, staticOpts));
  app.use("/wah/", express.static(uvPath, staticOpts));
  app.use(express.json());

  app.get("/", (req, res) => res.sendFile(path.join(publicPath, "$.html")));
  app.get("/g", (req, res) => res.sendFile(path.join(publicPath, "!.html")));
  app.get("/a", (req, res) => res.sendFile(path.join(publicPath, "!!.html")));
  app.get("/ai", (req, res) => res.sendFile(path.join(publicPath, "!!!.html")));
  app.use((req, res) => res.status(404).sendFile(path.join(publicPath, "404.html")));

  const server = createServer(app);
  server.keepAliveTimeout = 0;
  server.headersTimeout = 0;

  const pingWSS = new WebSocket.Server({ noServer: true, maxPayload: 1048576 });
  pingWSS.on("connection", (ws, req) => {
    const remoteAddress = req.socket.remoteAddress || "unknown";
    let latencies = [];
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const timestamp = Date.now();
        ws.send(JSON.stringify({ type: "ping", timestamp }));
      }
    }, 1000);
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "pong" && data.timestamp) {
          const latency = Date.now() - data.timestamp;
          latencies.push(latency);
          if (latencies.length > 5) latencies.shift();
          ws.send(JSON.stringify({ type: "latency", latency }));
        }
      } catch (e) {
        logError(`Ping error: ${e}`);
      }
    });
    ws.on("close", () => {
      clearInterval(pingInterval);
      const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b) / latencies.length : 0;
      logInfo(`Connection from ${remoteAddress} closed. Average Latency: ${avgLatency.toFixed(2)}ms.`);
    });
  });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/w/ping") {
      pingWSS.handleUpgrade(req, socket, head, (ws) => pingWSS.emit("connection", ws, req));
    } else if (req.url.startsWith("/w/")) {
      wisp.routeRequest(req, socket, head);
    } else {
      socket.end();
    }
  });
  server.on("error", (err) => logError(`Worker server error: ${err}`));
  server.listen(0, () => logInfo(`Worker ${process.pid} ready.`));
  process.on("message", (message, connection) => {
    if (message === "sticky-session:connection") {
      server.emit("connection", connection);
      connection.resume();
    }
  });
}
