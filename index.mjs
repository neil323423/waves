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

const __dirname = process.cwd();
const publicPath = path.join(__dirname, "public");
const app = express();

app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));

app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});
app.get("/gs", (req, res) => {
  res.sendFile(path.join(publicPath, "gs.html"));
});
app.get("/as", (req, res) => {
  res.sendFile(path.join(publicPath, "as.html"));
});
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, "404.html"));
});

app.use(compression({ level: 1, threshold: 0, filter: () => true, memLevel: 1, strategy: 1, windowBits: 9 }));

const port = parseInt(process.env.PORT || "3000");
const server = createServer(app);

const pingWSS = new WebSocket.Server({ noServer: true });
pingWSS.on("connection", (ws, req) => {
  const remoteAddress = (req.socket && req.socket.remoteAddress) || "unknown";
  let latencies = [];
  const pingInterval = setInterval(() => {
    const timestamp = Date.now();
    ws.send(JSON.stringify({ type: "ping", timestamp }));
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
    const avgLatency = latencies.length ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0;
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

server.on("listening", () => {
  const address = server.address();
  if (address && typeof address === "object") {
    console.log(`[SERVER] Running at http://localhost:${address.port}`);
  } else {
    console.error("[SERVER] Failed to start.");
  }
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function shutdown(signal) {
  console.log(`[SHUTDOWN] ${new Date().toISOString()} - ${signal} received. Shutting down...`);
  try {
    await closeServer(server, "HTTP server");
    console.log("[SHUTDOWN] Servers shut down successfully.");
    process.exit(0);
  } catch (err) {
    console.error(`[SHUTDOWN ERROR] ${err.message}`);
    process.exit(1);
  }
}

function closeServer(server, name) {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        console.error(`[CLOSE ERROR] ${name}: ${err.message}`);
        reject(err);
      } else {
        console.log(`[CLOSE] ${name} closed.`);
        resolve();
      }
    });
  });
}

server.listen(port);
