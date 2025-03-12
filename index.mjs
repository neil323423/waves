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
import aiRoute from './routes/ai.js';

const __dirname = process.cwd();
const publicPath = path.join(__dirname, "public");
const app = express();
const port = parseInt(process.env.PORT || "3000");

app.use("/baremux/", express.static(baremuxPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/libcurl/", express.static(libcurlPath));
app.use(express.static(publicPath, { maxAge: "30d" }));
app.use("/s/", express.static(uvPath));

const limiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 200,
    message: "Too many requests, please try again later."
});
app.use("/api/", limiter);

app.use(express.json());
app.use(aiRoute);

app.get("/", (req, res) => res.sendFile(path.join(publicPath, "$.html")));
app.get("/g", (req, res) => res.sendFile(path.join(publicPath, "!.html")));
app.get("/a", (req, res) => res.sendFile(path.join(publicPath, "!!.html")));
app.get("/ai", (req, res) => res.sendFile(path.join(publicPath, "!!!.html")));
app.use((req, res) => res.status(404).sendFile(path.join(publicPath, "404.html")));

app.use(compression({
    level: 1,
    threshold: 1024,
    memLevel: 8,
    strategy: 1
}));

const server = createServer(app);
const pingWSS = new WebSocket.Server({ noServer: true });

pingWSS.on("connection", async (ws, req) => {
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

server.listen(port, () => {
    console.log(`[SERVER] Running at http://localhost:${port}`);
});