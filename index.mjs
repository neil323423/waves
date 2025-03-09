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
import os from "os";
import cluster from "cluster";

const __dirname = process.cwd();
const publicPath = path.join(__dirname, "public");
const indexPath = path.join(publicPath, "$.html");
const gPath = path.join(publicPath, "!.html");
const aPath = path.join(publicPath, "!!.html");
const notFoundPath = path.join(publicPath, "404.html");
const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

app.use(
	compression({
		level: 9,
		threshold: 1024,
		memLevel: 9,
		strategy: 0
	})
);

app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use("/s/", express.static(uvPath));
app.use(express.static(publicPath, { maxAge: "30d" }));

const limiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 200,
	message: "Too many requests, please try again later."
});
app.use("/api/", limiter);

app.get("/", (req, res) => res.sendFile(indexPath));
app.get("/g", (req, res) => res.sendFile(gPath));
app.get("/a", (req, res) => res.sendFile(aPath));
app.use((req, res) => res.status(404).sendFile(notFoundPath));

const port = parseInt(process.env.PORT || "3000", 10);
const numCPUs = os.cpus().length;

if (cluster.isMaster) {
	for (let i = 0; i < numCPUs; i++) {
		cluster.fork();
	}
	cluster.on("exit", (worker, code, signal) => {
		console.log(`Worker ${worker.process.pid} died. Spawning a new worker.`);
		cluster.fork();
	});
	console.log(`[SERVER] Running at http://localhost:${port}`);
} else {
	const server = createServer(app);
	const pingWSS = new WebSocket.Server({ noServer: true });
	pingWSS.on("connection", (ws, req) => {
		const remoteAddress = req.socket.remoteAddress || "unknown";
		let lastPing = 0;
		let totalLatency = 0;
		let countLatency = 0;
		const pingInterval = setInterval(() => {
			if (ws.readyState === WebSocket.OPEN) {
				lastPing = Date.now();
				ws.ping();
			}
		}, 5000);
		ws.on("pong", () => {
			const latency = Date.now() - lastPing;
			totalLatency += latency;
			countLatency++;
			ws.send(JSON.stringify({ type: "latency", latency }));
		});
		ws.on("close", () => {
			clearInterval(pingInterval);
			const avgLatency = countLatency ? totalLatency / countLatency : 0;
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
	server.listen(port);
}