/* © 2026 ZARCONT — Servidor estático de pruebas (Agente 8). */
import { spawn } from "node:child_process";
import { waitForPort } from "./cdp.mjs";

export class StaticServer {
  constructor({ root, port = 8790, python = "C:\\Python313\\python.exe", logFile = null }) {
    this.root = root;
    this.port = port;
    this.python = python;
    this.logFile = logFile;
    this.proc = null;
  }

  get baseURL() {
    return `http://127.0.0.1:${this.port}`;
  }

  async start() {
    // Si ya hay un servidor en el puerto, se reutiliza solo si responde al marcador.
    try {
      const res = await fetch(`${this.baseURL}/AUDIT/COORDINATION.md`, { method: "HEAD" });
      if (res.ok) return { reused: true };
    } catch {}
    this.proc = spawn(this.python, ["-m", "http.server", String(this.port), "--bind", "127.0.0.1"], {
      cwd: this.root,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    this.proc.stdout.on("data", () => {});
    this.proc.stderr.on("data", () => {});
    await waitForPort(this.port, { timeout: 20000, path: "/AUDIT/COORDINATION.md" });
    return { reused: false };
  }

  async stop() {
    if (!this.proc) return;
    const pid = this.proc.pid;
    this.proc = null;
    await new Promise((resolve) => {
      try {
        const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
        killer.on("exit", resolve);
        killer.on("error", resolve);
      } catch {
        resolve();
      }
      setTimeout(resolve, 5000);
    });
  }
}
