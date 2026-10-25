/* © 2026 ZARCONT — Utilidades del arnés de pruebas (Agente 8). */
import path from "node:path";
import { writeFile, mkdir } from "node:fs/promises";

export class SkipError extends Error {}

export function skip(reason) {
  throw new SkipError(reason);
}

export function assert(condition, message) {
  if (!condition) throw new Error(`ASSERT: ${message}`);
}

export function assertEq(actual, expected, label = "valor") {
  if (actual !== expected) throw new Error(`ASSERT: ${label} = ${JSON.stringify(actual)}; esperado ${JSON.stringify(expected)}`);
}

export function assertIncludes(haystack, needle, label = "valor") {
  if (!String(haystack || "").includes(needle)) {
    throw new Error(`ASSERT: ${label} no incluye ${JSON.stringify(needle)} — valor: ${JSON.stringify(haystack)}`);
  }
}

export function fmt(value, max = 240) {
  if (typeof value === "string") return value.length > max ? value.slice(0, max) + "…" : value;
  const text = JSON.stringify(value);
  return text && text.length > max ? text.slice(0, max) + "…" : text;
}

export class Harness {
  constructor({ evidenceDir, baseURL, evidenceName = "agent8-baseline" }) {
    this.evidenceDir = evidenceDir;
    this.evidenceName = evidenceName;
    this.baseURL = baseURL;
    this.results = [];
    this.startedAt = new Date().toISOString();
    this.state = { suite: "", app: "" };
  }

  suite(name) {
    this.state.suite = name;
  }

  async shot(page, name) {
    const rel = path.posix.join("AUDIT", "evidencias", this.evidenceName, "img", `${name}.png`);
    const file = path.join(this.evidenceDir, "img", `${name}.png`);
    try {
      await page.screenshot(file);
      return rel;
    } catch (err) {
      return `ERROR captura: ${err.message}`;
    }
  }

  /** Ejecuta una prueba. fn debe devolver observaciones serializables. */
  async test(id, description, fn, { app = this.state.app, severity = "media", timeout = 60000, page = null } = {}) {
    const started = Date.now();
    const result = {
      id,
      app,
      suite: this.state.suite,
      description,
      severity,
      status: "PASS",
      durationMs: 0,
      observations: null,
      error: null,
      evidence: [],
      at: new Date().toISOString(),
    };
    try {
      const observations = await Promise.race([
        Promise.resolve().then(fn),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`TIMEOUT de prueba (${timeout} ms)`)), timeout)),
      ]);
      result.observations = observations === undefined ? null : observations;
    } catch (err) {
      if (err instanceof SkipError) {
        result.status = "SKIP";
        result.error = err.message;
      } else {
        result.status = "FAIL";
        result.error = err && err.stack ? err.stack.split("\n").slice(0, 6).join(" | ") : String(err);
        if (page) {
          try {
            result.evidence.push(await this.shot(page, `fail-${slug(id)}`));
          } catch {}
        }
      }
    }
    result.durationMs = Date.now() - started;
    this.results.push(result);
    const mark = result.status === "PASS" ? "PASS" : result.status;
    console.log(`[${mark}] ${id} — ${description}${result.error ? ` :: ${fmt(result.error, 300)}` : ""}`);
    return result;
  }

  summary() {
    const counts = { PASS: 0, FAIL: 0, SKIP: 0 };
    for (const r of this.results) counts[r.status] += 1;
    return {
      startedAt: this.startedAt,
      finishedAt: new Date().toISOString(),
      total: this.results.length,
      counts,
      results: this.results,
    };
  }

  async write(fileName) {
    const data = this.summary();
    await mkdir(this.evidenceDir, { recursive: true });
    const file = path.join(this.evidenceDir, fileName);
    await writeFile(file, JSON.stringify(data, null, 2));
    return { file, data };
  }
}

export function relPath(fromDir, toFile) {
  return path.relative(fromDir, toFile).replace(/\\/g, "/");
}

export function slug(text) {
  return String(text)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
