import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { Run } from "../src/contracts.mjs";
import { approvalBlock, buildReview } from "./reviews.mjs";

const url = (path) => new URL(path, import.meta.url);
const SAMPLE = url("../data/fixtures/run.sample.json");
const VENDORS = url("../data/erp/vendors.json");
const RUNS_DIR = url("../runs/");
const LOCAL_DIR = url("./.local/");
const REVIEWS = url("./.local/reviews.json");
const PUBLIC_DIR = fileURLToPath(url("./public/"));
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };
const PORT = Number(process.env.PORT ?? 4173);

const readRun = (file) => Run.parse(JSON.parse(readFileSync(file, "utf8")));

// Real runs come first. The sample only appears when there are none.
function loadRuns() {
  let names = [];
  try {
    names = readdirSync(RUNS_DIR).filter((name) => name.endsWith(".json"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const runs = [];
  const invalid = [];
  for (const name of names) {
    try {
      runs.push({ run: readRun(new URL(name, RUNS_DIR)), sample: false });
    } catch {
      invalid.push(name);
    }
  }
  runs.sort((a, b) => b.run.createdAt.localeCompare(a.run.createdAt));
  if (runs.length === 0) runs.push({ run: readRun(SAMPLE), sample: true });
  return { runs, invalid };
}

// A missing or unreadable vendor master means nothing can be approved.
function readVendors() {
  try {
    return JSON.parse(readFileSync(VENDORS, "utf8"));
  } catch {
    return [];
  }
}

// Tells the page which invoices are locked, so its buttons match what the server will accept.
function approvalLocks(runs, vendors) {
  const locks = {};
  for (const { run } of runs) {
    locks[run.runId] = {};
    for (const invoice of run.invoices) {
      const blocked = approvalBlock(invoice, vendors);
      if (blocked) locks[run.runId][invoice.decision.invoiceKey] = blocked;
    }
  }
  return locks;
}

function readReviews() {
  try {
    return JSON.parse(readFileSync(REVIEWS, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

// A review only records a person's decision. Nothing here can send a payment.
function saveReview({ runId, invoiceKey, action }) {
  if (action !== "APPROVED" && action !== "REJECTED") return "Unknown action";
  const entry = loadRuns().runs.find(({ run }) => run.runId === runId);
  const invoice = entry?.run.invoices.find((i) => i.decision.invoiceKey === invoiceKey);
  if (!invoice) return "Unknown invoice";
  if (invoice.payment.status !== "HELD") return "Only held invoices can be reviewed";
  const vendors = readVendors();
  if (action === "APPROVED") {
    const blocked = approvalBlock(invoice, vendors);
    if (blocked) return blocked;
  }
  const reviews = readReviews();
  reviews[runId] = {
    ...reviews[runId],
    [invoiceKey]: buildReview(invoice, action, vendors),
  };
  mkdirSync(LOCAL_DIR, { recursive: true });
  writeFileSync(REVIEWS, JSON.stringify(reviews, null, 2));
  return null;
}

const sendJson = (res, status, body) => {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
};

async function handleReview(req, res) {
  // Blocks other websites from posting reviews to this local server.
  const origin = req.headers.origin;
  if (origin && origin !== `http://${req.headers.host}`) {
    return sendJson(res, 403, { error: "Wrong origin" });
  }
  if (req.headers["content-type"] !== "application/json") {
    return sendJson(res, 415, { error: "Expected JSON" });
  }
  let raw = "";
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) return sendJson(res, 413, { error: "Too large" });
  }
  let body;
  try {
    body = JSON.parse(raw);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON" });
  }
  const error = saveReview(body ?? {});
  return error ? sendJson(res, 400, { error }) : sendJson(res, 200, { ok: true });
}

function sendStatic(res, pathname) {
  const file = resolve(PUBLIC_DIR, `.${pathname === "/" ? "/index.html" : decodeURIComponent(pathname)}`);
  const type = TYPES[extname(file)];
  if (!file.startsWith(PUBLIC_DIR.endsWith(sep) ? PUBLIC_DIR : PUBLIC_DIR + sep) || !type) {
    return sendJson(res, 404, { error: "Not found" });
  }
  try {
    const body = readFileSync(file);
    res.writeHead(200, { "content-type": type, "cache-control": "no-cache", "x-content-type-options": "nosniff" });
    return res.end(body);
  } catch {
    return sendJson(res, 404, { error: "Not found" });
  }
}

const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");
    if (req.method === "GET" && pathname === "/api/runs") {
      const loaded = loadRuns();
      return sendJson(res, 200, { ...loaded, reviews: readReviews(), locks: approvalLocks(loaded.runs, readVendors()) });
    }
    if (req.method === "POST" && pathname === "/api/reviews") {
      return await handleReview(req, res);
    }
    if (req.method === "GET") return sendStatic(res, pathname);
    return sendJson(res, 404, { error: "Not found" });
  } catch (error) {
    console.error(error);
    return sendJson(res, 500, { error: "Server error" });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Dashboard: http://localhost:${PORT}`);
});
