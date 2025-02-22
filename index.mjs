import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import { hostname } from "os";
import chalk from "chalk";
import compression from "compression";
import WebSocket from "ws";
import morgan from "morgan";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { libcurlPath } from "@mercuryworkshop/libcurl-transport";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import wisp from "wisp-server-node";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "public");

const app = express();
app.use(compression({ level: 6, threshold: 0 }));
const oneYear = 365 * 24 * 60 * 60 * 1000;
app.use("/baremux/", express.static(baremuxPath, { maxAge: oneYear }));
app.use("/epoxy/", express.static(epoxyPath, { maxAge: oneYear }));
app.use("/libcurl/", express.static(libcurlPath, { maxAge: oneYear }));
app.use("/uv/", express.static(uvPath, { maxAge: oneYear }));
app.use(express.static(publicPath, { maxAge: oneYear }));
app.use(morgan("combined"));
app.get("/", (req, res) => res.sendFile(path.join(publicPath, "index.html")));
app.use((req, res) => res.status(404).sendFile(path.join(publicPath, "404.html")));

const port = parseInt(process.env.PORT || "3000", 10);
const server = createServer(app);

const pingWSS = new WebSocket.Server({ noServer: true });
pingWSS.on("connection", (ws, req) => {
  ws.isAlive = true;
  ws.on("pong", () => {
    const latency = Date.now() - ws.lastPing;
    ws.send(JSON.stringify({ type: "latency", latency }));
    ws.isAlive = true;
  });
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.lastPing = Date.now();
      ws.ping();
    }
  }, 10000);
  ws.on("close", () => clearInterval(pingInterval));
});

server.on("upgrade", (req, socket, head) => {
  if (req.url === "/w/ping") {
    pingWSS.handleUpgrade(req, socket, head, (ws) => pingWSS.emit("connection", ws, req));
  } else if (req.url.startsWith("/w/")) {
    wisp.routeRequest(req, socket, head);
  } else {
    socket.destroy();
  }
});

server.on("listening", () => {
  const address = server.address();
  if (address && typeof address === "object") {
    const host = hostname();
    console.log(chalk.green("Server is running:"));
    console.log(chalk.cyan(`Local: http://localhost:${address.port}`));
    console.log(chalk.cyan(`Host: http://${host}:${address.port}`));
    console.log(chalk.magenta(`Platform: ${process.platform}`));
    console.log(chalk.yellow("Press Ctrl + C to shut down the server."));
  } else {
    console.error(chalk.red("Error: Could not determine server address."));
  }
});

const shutdown = async (signal) => {
  console.log(chalk.red(`Received ${signal}. Initiating graceful shutdown...`));
  try {
    await closeServer(server, "HTTP server");
    console.log(chalk.green("All servers have shut down gracefully."));
    process.exit(0);
  } catch (err) {
    console.error(chalk.red("Error during shutdown:"), err);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

function closeServer(server, name) {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        console.error(chalk.red(`Error closing ${name}: ${err.message}`));
        reject(err);
      } else {
        console.log(chalk.blue(`${name} closed successfully.`));
        resolve();
      }
    });
  });
}

server.listen(port, () => {
  console.log(chalk.green(`Server listening on port ${port}`));
});
