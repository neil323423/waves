import { createBareServer } from '@tomphttp/bare-server-node';
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import express from "express";
import { createServer } from "node:http";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { join } from "node:path";
import wisp from "wisp-server-node";
import { hostname } from "node:os";
import { fileURLToPath } from "url";
import chalk from "chalk"; 

const publicPath = fileURLToPath(new URL("./public/", import.meta.url));

const bare = createBareServer("/bare/");
const app = express();
app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/", express.static(epoxyPath));

app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));

app.use((req, res) => {
  console.log("404 error for:", req.url);
  res.status(404);
  res.sendFile(join(publicPath, "404.html"));
});

let port = parseInt(process.env.PORT || "");

if (isNaN(port)) {
  port = 3000;
}

const server = createServer();

server.on("request", (req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else if (req.url.endsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head); 
  } else {
    socket.end();
  }
});

server.on("listening", () => {
  const address = server.address();
  
  console.log(chalk.bold.green(`🚀 Server starting...`));
  console.log(
    chalk.bold.yellow(
      `🌐 Server started and listening on:\n` +
      `   🔗 Local:     http://localhost:${address.port}\n` +
      `   🔗 Hostname:  http://${hostname()}:${address.port}\n` +
      `   🔗 Network:   http://${address.family === "IPv6" ? `[${address.address}]` : address.address}:${address.port}`
    )
  );

  console.log(chalk.bold.gray("\n─────────────\n"));
});

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function shutdown(signal) {
  console.log(chalk.bold.red(`🛑 ${signal} received. Shutting down...`));

  try {
    await closeServer(server, "HTTP server");

    await closeBareServer(bare);

    if (wisp.isActive) {
      await closeWispServer();
    }

    console.log(chalk.bold.green("✅ All servers shut down successfully."));
    process.exit(0);
  } catch (err) {
    console.error(chalk.bold.red("⚠️ Error during shutdown:"), err);
    process.exit(1);
  }
}

function closeServer(server, name) {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        console.error(chalk.bold.red(`❌ Error closing ${name}:`), err);
        reject(err);
      } else {
        console.log(chalk.bold.blue(`🛑 ${name} closed.`));
        resolve();
      }
    });
  });
}

function closeBareServer(bare) {
  return new Promise((resolve, reject) => {
    bare.close((err) => {
      if (err) {
        console.error(chalk.bold.red("❌ Error closing Bare Server:"), err);
        reject(err);
      } else {
        console.log(chalk.bold.blue("🛑 Bare Server closed."));
        resolve();
      }
    });
  });
}

function closeWispServer() {
  return new Promise((resolve, reject) => {
    wisp.close((err) => {
      if (err) {
        console.error(chalk.bold.red("❌ Error closing Wisp:"), err);
        reject(err);
      } else {
        console.log(chalk.bold.blue("🛑 Wisp server closed."));
        resolve();
      }
    });
  });
}

server.listen({ port });