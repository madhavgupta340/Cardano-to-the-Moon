// The app's only data layer. Pages read from here, so a real backend can replace it later.
// Local state lives in this browser. Real runs come from the server's /api/runs.
import { DEFAULT_LIMITS, DEFAULT_PERMS, GRS, HISTORY, INVOICES, POS, SUPPLIERS, TODAY } from "./data.js";
import { evaluate, total } from "./rules.js";

const KEY = "veridano-state-v1";

const fresh = () => ({
  limits: { ...DEFAULT_LIMITS },
  perms: { ...DEFAULT_PERMS },
  decisions: {},
  confirmedAddresses: {},
  audit: [],
  documents: [],
  drafts: {},
  read: [],
});

function restore() {
  try {
    return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) ?? "{}") };
  } catch {
    return fresh();
  }
}

export const state = restore();
export const runtime = { runs: [], rawRuns: [], reviews: {}, locks: {}, invalidRuns: [], runError: null, loaded: false };

const listeners = new Set();
export const subscribe = (fn) => listeners.add(fn);

export function commit() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Private windows can block storage. Changes then last until reload.
  }
  listeners.forEach((fn) => fn());
}

export function resetDemo() {
  Object.assign(state, fresh());
  commit();
}

export function log(action, detail, actor = "Mara Keller", invoice = null) {
  state.audit.unshift({ at: new Date().toISOString(), action, detail, actor, invoice });
}

const HASH = /^[0-9a-f]{64}$/i;
export const isRealHash = (hash) => typeof hash === "string" && HASH.test(hash) && !/^0+$/.test(hash);

// Maps a contract Run from runs/*.json into the app's invoice shape.
function fromRun({ run, reviews, locks }) {
  return run.invoices.map(({ candidate: c, decision: d, payment: p }) => {
    const item = c.lineItems[0];
    const amount = (p.amount ?? c.total ?? 0) / 1e6;
    return {
      id: d.invoiceKey,
      number: c.invoiceNumber ?? "No number",
      supplier: null,
      vendorName: c.vendorName ?? "Unknown vendor",
      po: c.poNumber,
      date: run.createdAt.slice(0, 10),
      due: null,
      item: item?.description ?? "Not extracted",
      qty: item?.quantity ?? 1,
      unit: item ? item.unitPrice / 1e6 : amount,
      signals: c.bodySignals,
      hidden: null,
      replyTo: c.headers.replyTo,
      from: c.headers.from,
      statedAddress: c.statedPayoutAddress,
      source: "run",
      runId: run.runId,
      contract: { decision: d, payment: p, amount, sourceFile: c.sourceFile },
      review: reviews?.[d.invoiceKey] ?? null,
      lockReason: locks?.[d.invoiceKey] ?? null,
    };
  });
}

export async function loadRuns() {
  try {
    const res = await fetch("/api/runs");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { runs, invalid, reviews, locks } = await res.json();
    // The run overview shows everything. The sample file stays out of the demo company's numbers.
    runtime.rawRuns = runs;
    runtime.reviews = reviews;
    runtime.locks = locks;
    runtime.runs = runs.filter((r) => !r.sample).flatMap(({ run }) => fromRun({ run, reviews: reviews[run.runId], locks: locks[run.runId] }));
    runtime.invalidRuns = invalid;
    runtime.runError = null;
  } catch (error) {
    runtime.runError = error.message;
  }
  runtime.loaded = true;
  listeners.forEach((fn) => fn());
}

const VERIFICATION_FROM_RUN = (p, d) => (d.result === "PASS" ? "Verified" : "Blocked");

function viewOfRun(inv) {
  const { decision: d, payment: p, amount } = inv.contract;
  const verification = VERIFICATION_FROM_RUN(p, d);
  const review = inv.review;
  const paymentStatus = p.status === "PAID" ? "Paid"
    : p.status === "FAILED" ? "Failed"
    : p.status === "ATTEMPTED" ? "Unclear"
    : review?.action === "APPROVED" ? "Approved, not paid"
    : review?.action === "REJECTED" ? "Rejected"
    : "Held";
  return {
    ...inv,
    amount,
    supplierName: inv.vendorName,
    verification,
    reasons: d.reasons,
    checks: d.reasons.map((code) => ({ name: code, ok: false, detail: "Reported by the checker" })),
    explanation: d.result === "PASS" ? "The checker passed this invoice." : "The checker flagged this invoice for a person.",
    canApprove: !inv.lockReason,
    paymentStatus,
    txHash: p.txHash,
    decision: review ? { action: review.action === "APPROVED" ? "Approved" : "Rejected", at: review.reviewedAt } : null,
    needsPerson: p.status !== "PAID" && !review,
    po: null, gr: null, poId: inv.po, supplierObj: null,
    approvedAddress: null,
  };
}

// Paid invoices keep the policy they were paid under, so changing limits can't rewrite history.
function evaluationContext(inv) {
  const paid = !!inv.paidAt;
  return {
    suppliers: SUPPLIERS, pos: POS, grs: GRS, invoices: INVOICES,
    limits: paid ? DEFAULT_LIMITS : state.limits,
    perms: paid ? DEFAULT_PERMS : state.perms,
    confirmedAddresses: paid ? {} : state.confirmedAddresses,
  };
}

function viewOfDemo(inv) {
  const result = evaluate(inv, evaluationContext(inv));
  const decision = state.decisions[inv.id] ?? null;
  let paymentStatus;
  if (inv.paidAt) paymentStatus = "Paid (demo)";
  else if (decision?.action === "Rejected") paymentStatus = "Rejected";
  else if (decision?.action === "Hold") paymentStatus = "On hold";
  else if (decision?.action === "Queued") paymentStatus = "Queued, not sent";
  else if (decision?.action === "Clarification") paymentStatus = "Waiting on supplier";
  else if (result.verification === "Pending") paymentStatus = "Not started";
  else if (result.verification === "Verified" || decision?.action === "Approved") paymentStatus = "Ready";
  else if (result.verification === "Blocked") paymentStatus = "Held";
  else paymentStatus = "Awaiting approval";
  const unresolved = !decision || decision.action === "Hold";
  return {
    ...inv,
    ...result,
    supplierName: result.supplierObj?.name ?? inv.vendorName,
    category: result.supplierObj?.category ?? "Uncategorised",
    decision,
    paymentStatus,
    poId: inv.po,
    txHash: null,
    needsPerson: !inv.paidAt && unresolved && (result.verification === "Blocked" || result.verification === "Requires approval"),
  };
}

export const invoices = () => [...INVOICES.map(viewOfDemo), ...runtime.runs.map(viewOfRun)];
export const invoice = (id) => invoices().find((i) => i.id === id);
export const supplier = (id) => SUPPLIERS.find((s) => s.id === id);

export const isPaid = (i) => i.paymentStatus === "Paid" || i.paymentStatus === "Paid (demo)";

export function decide(id, action, note) {
  const inv = invoice(id);
  if (!inv) return { error: "Invoice not found" };
  if (isPaid(inv)) return { error: "This invoice is already paid" };
  if (action === "Approved" && !inv.canApprove) {
    return { error: "This invoice can't be approved until the underlying problem is fixed." };
  }
  state.decisions[id] = { action, at: new Date().toISOString(), note };
  log(`${action}: ${inv.number}`, note ?? `${inv.supplierName}, ${inv.amount.toLocaleString("en")} tUSDM`, undefined, id);
  commit();
  return {};
}

export async function reviewRunInvoice(runId, invoiceKey, action) {
  const res = await fetch("/api/reviews", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ runId, invoiceKey, action }),
  });
  if (!res.ok) return { error: (await res.json().catch(() => ({}))).error ?? "Could not save the review" };
  log(`${action}: ${invoiceKey}`, `Run ${runId}`, undefined, invoiceKey);
  await loadRuns();
  commit();
  return {};
}

export const reviewRun = (id, action) => reviewRunInvoice(invoice(id).runId, id, action);

export function confirmAddress(supplierId) {
  const s = supplier(supplierId);
  state.confirmedAddresses[supplierId] = true;
  log("Payout address confirmed", `${s.name}: new address verified by a person`);
  commit();
}

export function setLimit(key, value) {
  state.limits[key] = value;
  log("Agent limit changed", `${key} set to ${value}`);
  commit();
}

export function setPerm(key, value) {
  state.perms[key] = value;
  log("Agent permission changed", `${key} ${value ? "on" : "off"}`);
  commit();
}

export function addDocuments(files, kind) {
  for (const file of files) {
    state.documents.unshift({ name: file.name, size: file.size, kind, at: new Date().toISOString() });
    log("Document added", `${file.name} (${kind}). Name and size only, the file wasn't uploaded.`);
  }
  commit();
}

export function saveDraft(id, text, status) {
  state.drafts[id] = { text, status, at: new Date().toISOString() };
  if (status === "Approved") log("Supplier message approved", `${id}. Not sent, because no email service is connected.`, undefined, id);
  commit();
}

export const month = (date) => date.slice(0, 7);
export const thisMonth = () => month(TODAY);

// All paid amounts: earlier months plus this month's demo payments.
export function payments() {
  const current = INVOICES.filter((i) => i.paidAt).map((i) => ({
    month: month(i.paidAt), supplier: i.supplier, amount: total(i),
  }));
  return [...HISTORY, ...current];
}

export function isDueSoon(inv, days) {
  if (!inv.due) return false;
  const diff = (new Date(inv.due) - new Date(TODAY)) / 86400000;
  return diff <= days;
}

// A readable timeline built from the rule results. Demo payments never claim an on-chain result.
export function timeline(inv) {
  const at = (hour) => `${inv.date}T${hour}`;
  const events = [{ at: at("08:02:00"), title: `Invoice ${inv.number} received`, detail: `From ${inv.from ?? inv.supplierObj?.email ?? "unknown sender"}. Source document stored.`, kind: "info" }];
  if (inv.verification === "Pending") {
    events.push({ at: at("08:03:00"), title: inv.pending, detail: "The AI reads the document. It can't influence payment.", kind: "info" });
    return events;
  }
  events.push({ at: at("08:04:00"), title: "Fields extracted by AI", detail: `${inv.item}, ${inv.qty} at ${inv.unit} tUSDM. Treated as untrusted until the rules run.`, kind: "info" });
  inv.checks.forEach((c, n) => events.push({
    at: at(`08:05:${String(n).padStart(2, "0")}`),
    title: `${c.name}: ${c.ok ? "passed" : "failed"}`,
    detail: c.detail,
    kind: c.ok ? "good" : "bad",
  }));
  events.push({
    at: at("08:06:00"),
    title: `Rule result: ${inv.verification}`,
    detail: inv.explanation,
    kind: inv.verification === "Verified" ? "good" : inv.verification === "Blocked" ? "bad" : "warn",
  });
  if (inv.paidAt) {
    events.push({ at: inv.paidAt, title: "Demo payment recorded", detail: "Sample data only: nothing was submitted to Cardano Preprod, and there's no transaction hash.", kind: "info" });
  }
  if (inv.decision) {
    events.push({ at: inv.decision.at, title: `${inv.decision.action} by a person`, detail: inv.decision.note ?? "Recorded in the audit trail.", kind: "info" });
  }
  return events;
}

export function activity() {
  return invoices()
    .filter((i) => i.source !== "run")
    .flatMap((i) => timeline(i).map((e) => ({ ...e, invoice: i })))
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function auditEntries() {
  const generated = activity().map((e) => ({
    at: e.at, action: e.title, detail: e.detail, actor: "Agent", invoice: e.invoice.id,
  }));
  return [...state.audit, ...generated].sort((a, b) => b.at.localeCompare(a.at));
}

export function attention() {
  const all = invoices();
  const items = [];
  const add = (count, one, many, href, tone) => {
    if (count > 0) items.push({ text: count === 1 ? one : `${count} ${many}`, href, tone });
  };
  add(all.filter((i) => i.needsPerson && i.verification === "Requires approval").length,
    "1 invoice requires manual approval", "invoices require manual approval", "#/approvals", "warn");
  const changed = SUPPLIERS.filter((s) => s.pendingAddress && !state.confirmedAddresses[s.id]);
  add(changed.length, "1 supplier has changed its payout address", "suppliers have changed their payout address",
    changed.length === 1 ? `#/supplier/${changed[0].id}` : "#/suppliers/risk", "bad");
  const open = all.filter((i) => i.needsPerson);
  const price = open.filter((i) => i.reasons.includes("AMOUNT_MISMATCH"));
  add(price.length, "1 invoice has a price discrepancy", "invoices have a price discrepancy",
    price.length === 1 ? `#/invoice/${price[0].id}` : "#/invoices?view=blocked", "bad");
  const dup = open.filter((i) => i.reasons.includes("DUPLICATE_INVOICE"));
  add(dup.length, "1 duplicate invoice was caught", "duplicate invoices were caught",
    dup.length === 1 ? `#/invoice/${dup[0].id}` : "#/invoices?view=blocked", "bad");
  const missing = open.filter((i) => i.reasons.includes("GOODS_RECEIPT_MISSING"));
  add(missing.length, "1 goods receipt is missing", "goods receipts are missing",
    missing.length === 1 ? `#/invoice/${missing[0].id}` : "#/grs", "warn");
  const hidden = open.filter((i) => i.reasons.includes("HIDDEN_INSTRUCTIONS"));
  add(hidden.length, "1 invoice tried to instruct the agent", "invoices tried to instruct the agent",
    hidden.length === 1 ? `#/invoice/${hidden[0].id}` : "#/invoices?view=blocked", "bad");
  return items;
}

export function notifications() {
  const all = invoices();
  const items = attention().map((a) => ({ ...a, id: a.text }));
  all.filter((i) => !isPaid(i) && i.paymentStatus !== "Rejected" && isDueSoon(i, 5)).forEach((i) => {
    items.push({ id: `due-${i.id}`, text: `${i.number} is due ${i.due}`, href: `#/invoice/${i.id}`, tone: "warn" });
  });
  all.filter((i) => i.date === TODAY).forEach((i) => {
    items.push({ id: `new-${i.id}`, text: `New invoice ${i.number} from ${i.supplierName}`, href: `#/invoice/${i.id}`, tone: "info" });
  });
  return items;
}

export function riskOf(s) {
  const mine = invoices().filter((i) => i.supplier === s.id);
  const risks = [];
  if (s.pendingAddress && !state.confirmedAddresses[s.id]) risks.push({ text: "Payout address changed, needs verification", level: "High" });
  if (mine.some((i) => i.reasons.includes("SENDER_DOMAIN_MISMATCH"))) risks.push({ text: "Lookalike sender domain seen", level: "High" });
  if (mine.some((i) => i.reasons.includes("HIDDEN_INSTRUCTIONS"))) risks.push({ text: "Hidden instructions in a document", level: "High" });
  if (mine.some((i) => i.reasons.includes("DUPLICATE_INVOICE"))) risks.push({ text: "Duplicate invoice received", level: "Medium" });
  if (mine.some((i) => i.reasons.includes("AMOUNT_MISMATCH"))) risks.push({ text: "Invoice above the purchase order", level: "Medium" });
  if (s.status !== "Verified") risks.push({ text: "Supplier still under review", level: "Medium" });
  const level = risks.some((r) => r.level === "High") ? "High" : risks.length ? "Medium" : "Low";
  return { level, risks };
}
