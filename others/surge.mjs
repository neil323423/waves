import { execSync } from "child_process";
import os from "os";
import fs from "fs";
import path from "path";

const log = (msg) => console.log(`[SURGE] ${msg}`);
const surgePath = path.resolve("surge.config.json");

function generateSurgeFlags() {
  const cpus = os.cpus().length;
  const flags = [
    "--max-old-space-size=4096",
    "--optimize_for_size",
    "--gc-global",
    "--max-semi-space-size=256",
    "--no-warnings",
    "--expose-gc"
  ];

  if (process.platform !== "win32") {
    flags.push("--use-largepages=on");
  }

  return {
    uvThreadpoolSize: cpus * 2,
    nodeFlags: flags
  };
}

function writeSurgeFile(flags) {
  fs.writeFileSync(surgePath, JSON.stringify(flags, null, 2));
  log("Surge config saved.");
}

function launchSurgedBackend(flags) {
  const args = [
    ...flags.nodeFlags,
    "index.mjs",
    "--surged"
  ];
  log(`Launching backend: node ${args.join(" ")}`);
  execSync(`node ${args.join(" ")}`, { stdio: "inherit" });
}

function isSurgedRun() {
  return process.argv.includes("--surged");
}

(async () => {
  if (isSurgedRun()) return;

  log("Detecting best settings...");
  const flags = generateSurgeFlags();
  writeSurgeFile(flags);
  launchSurgedBackend(flags);
  process.exit(0);
})();