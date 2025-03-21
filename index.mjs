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
import rateLimit from "express-rate-limit";
import chatRoute from "./routes/chat.js";

const port = parseInt(process.env.PORT || "3000");

if (cluster.isPrimary) {
  const numCPUs = os.cpus().length;
  const workers = [];
  for (let i = 0; i < numCPUs; i++) {
    const worker = cluster.fork();
    workers.push(worker);
  }
  const server = net.createServer({ pauseOnConnect: true }, (connection) => {
    const worker = workers[Math.abs(hash(connection.remoteAddress)) % workers.length];
    worker.send("sticky-session:connection", connection);
  });
  server.listen(port, () => {
    console.log(`[SERVER] Running at http://localhost:${port}`);
  });
} else {
  const __dirname = process.cwd();
  const publicPath = path.join(__dirname, "public");
  const app = express();
  app.use("/baremux/", express.static(baremuxPath));
  app.use("/epoxy/", express.static(epoxyPath));
  app.use("/libcurl/", express.static(libcurlPath));
  app.use(express.static(publicPath, { maxAge: "30d" }));
  app.use("/s/", express.static(uvPath));

  const limiter = rateLimit({
    windowMs: 300000,
    max: 200,
    message: "Too many requests, please try again later."
  });
  app.use("/api/", limiter);

  app.use(express.json());
  app.get("/", (req, res) => res.sendFile(path.join(publicPath, "$.html")));
  app.get("/g", (req, res) => res.sendFile(path.join(publicPath, "!.html")));
  app.get("/a", (req, res) => res.sendFile(path.join(publicPath, "!!.html")));
  app.get("/ai", (req, res) => res.sendFile(path.join(publicPath, "!!!.html")));
  app.use(chatRoute);
  app.use((req, res) => res.status(404).sendFile(path.join(publicPath, "404.html")));
  app.use(compression({ level: 1, threshold: 1024, memLevel: 8, strategy: 1 }));

  const server = createServer(app);
  const pingWSS = new WebSocket.Server({ noServer: true });

  pingWSS.on("connection", (ws, req) => {
    const remoteAddress = req.socket.remoteAddress || "unknown";
    let latencies = [];

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const timestamp = Date.now();
        ws.send(JSON.stringify({ type: "ping", timestamp }));
      }
    }, 5000);

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "pong" && data.timestamp) {
          const latency = Date.now() - data.timestamp;
          latencies.push(latency);
          ws.send(JSON.stringify({ type: "latency", latency }));
        }
      } catch (error) {}
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b) / latencies.length : 0;
      console.log(`[WS] ${new Date().toISOString()} - ${remoteAddress} disconnected. Avg latency: ${avgLatency.toFixed(2)}ms.`);
    });
  });

  server.on("upgrade", (req, socket, head) => {
    if (req.url === "/w/ping") {
      pingWSS.handleUpgrade(req, socket, head, (ws) => {
        pingWSS.emit("connection", ws, req);
      });
    } else if (req.url.startsWith("/w/")) {
      wisp.routeRequest(req, socket, head);
    } else {
      socket.end();
    }
  });

  server.listen(0, () => {});
  process.on("message", (message, connection) => {
    if (message === "sticky-session:connection") {
      server.emit("connection", connection);
      connection.resume();
    }
  });
}

function hash(str) {
  let h = 0;
  if (!str) return h;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return h;
}