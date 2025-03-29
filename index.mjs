import * as cluster from "cluster";
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

const port = parseInt(process.env.PORT || "3000");

if (cluster.isPrimary) {
  const numWorkers = os.cpus().length * 2; 
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  const server = net.createServer({ pauseOnConnect: true }, (connection) => {
    const worker = Object.values(cluster.workers)[Math.floor(Math.random() * numWorkers)];
    if (worker) worker.send("sticky-session:connection", connection);
  });
  server.on("error", (err) => console.error(err));
  server.listen(port, () => console.log(`Running at http://0.0.0.0:${port}`));
} else {
  const __dirname = process.cwd();
  const publicPath = path.join(__dirname, "public");
  const app = express();
  const cache = new NodeCache({ stdTTL: 3600, checkperiod: 120 });

  app.use((req, res, next) => {
    const key = req.originalUrl;
    if (cache.has(key)) {
      res.send(cache.get(key));
    } else {
      res.sendResponse = res.send;
      res.send = (body) => {
        cache.set(key, body);
        res.sendResponse(body);
      };
      next();
    }
  });

  app.use("/baremux/", express.static(baremuxPath));
  app.use("/epoxy/", express.static(epoxyPath));
  app.use("/libcurl/", express.static(libcurlPath));
  app.use(express.static(publicPath));
  app.use("/wah/", express.static(uvPath));

  app.use(express.json());
  app.get("/", (req, res) => res.sendFile(path.join(publicPath, "$.html")));
  app.get("/g", (req, res) => res.sendFile(path.join(publicPath, "!.html")));
  app.get("/a", (req, res) => res.sendFile(path.join(publicPath, "!!.html")));
  app.get("/ai", (req, res) => res.sendFile(path.join(publicPath, "!!!.html")));
  app.use((req, res) => res.status(404).sendFile(path.join(publicPath, "404.html")));
  app.use(compression({ level: 9, threshold: 512, memLevel: 9, strategy: 3 }));

  const server = createServer(app);
  const pingWSS = new WebSocket.Server({ noServer: true, maxPayload: 1048576 });

  pingWSS.on("connection", (ws, req) => {
    const remoteAddress = req.socket.remoteAddress || "unknown";
    let latencies = [];
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const timestamp = Date.now();
        ws.send(JSON.stringify({ type: "ping", timestamp }));
      }
    }, 3000);
    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        if (data.type === "pong" && data.timestamp) {
          const latency = Date.now() - data.timestamp;
          latencies.push(latency);
          ws.send(JSON.stringify({ type: "latency", latency }));
        }
      } catch (e) {}
    });
    ws.on("close", () => {
      clearInterval(pingInterval);
      const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b) / latencies.length : 0;
      console.log(`${new Date().toISOString()} - ${remoteAddress} disconnected. Avg latency: ${avgLatency.toFixed(2)}ms.`);
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
  server.on("error", (err) => console.error(err));
  server.listen(0);

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