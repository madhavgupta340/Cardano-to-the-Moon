// Suppliers, procurement, agent control, finance and settings pages.
import { ACCOUNTS, CASH_BALANCE, COMPANY, GRS, INTEGRATIONS, POS, SUPPLIERS, TEAM, TODAY } from "./data.js";
import { REASONS } from "./rules.js";
import {
  activity, auditEntries, confirmAddress, invoice, invoices, isPaid, isRealHash, notifications, payments, resetDemo,
  riskOf, setLimit, setPerm, state, supplier, thisMonth,
} from "./store.js";
import { columns, hbars } from "./charts.js";
import { activityFeed, lastMonths, monthlyVolume, rangePicker, spendByCategory, spendBySupplier } from "./pages-payables.js";
import { badge, button, card, cardHead, date, empty, h, icon, kv, link, modal, money, notice, pageHead, table, toast, tusdm, when } from "./ui.js";

const sum = (list, pick = (i) => i.amount) => list.reduce((n, i) => n + pick(i), 0);
const invLink = (i) => link(`#/invoice/${encodeURIComponent(i.id)}`, i.number);
const stat = (label, value) => h("div", { class: "stat" }, h("span", { class: "muted small" }, label), h("strong", { class: "num" }, value));

export function insightsPage() {
  const all = invoices();
  const findings = [];
  all.filter((i) => i.needsPerson && i.reasons.includes("DUPLICATE_INVOICE")).forEach((i) => findings.push({
    title: "Possible duplicate payment", text: `${i.number} from ${i.supplierName} matches an invoice already paid. Paying it would cost ${tusdm(i.amount)} twice.`, href: `#/invoice/${i.id}`, tone: "High",
  }));
  SUPPLIERS.filter((s) => s.pendingAddress && !state.confirmedAddresses[s.id]).forEach((s) => findings.push({
    title: "Changed payout details", text: `${s.name} asked to be paid at a new address, in an email using urgent language. Verify it through a known contact.`, href: `#/supplier/${s.id}`, tone: "High",
  }));
  all.filter((i) => i.needsPerson && i.reasons.includes("HIDDEN_INSTRUCTIONS")).forEach((i) => findings.push({
    title: "Attempted agent manipulation", text: `${i.number} hides an instruction to approve and pay. It came from a lookalike domain, and the rules ignored the instruction.`, href: `#/invoice/${i.id}`, tone: "High",
  }));
  all.filter((i) => i.needsPerson && i.reasons.includes("UNKNOWN_VENDOR")).forEach((i) => findings.push({
    title: "Unknown supplier", text: `${i.supplierName} sent an invoice for ${tusdm(i.amount)} with a very short deadline, and isn't in the vendor master.`, href: `#/invoice/${i.id}`, tone: "High",
  }));
  all.filter((i) => i.needsPerson && i.reasons.includes("AMOUNT_MISMATCH")).forEach((i) => findings.push({
    title: "Unusual invoice amount", text: `${i.number} is ${tusdm(i.amount - i.po.qty * i.po.unit)} above its purchase order.`, href: `#/invoice/${i.id}`, tone: "Medium",
  }));
  const range = lastMonths(12);
  const top = spendBySupplier(range)[0];
  const allSpend = sum(spendBySupplier(range), (d) => d.value);
  if (top) findings.push({ title: "Supplier concentration", text: `${top.label} accounts for ${Math.round((top.value / allSpend) * 100)}% of the last 12 months' spending.`, href: `#/supplier/${top.id}`, tone: "Low" });
  return h("div", { class: "page" },
    pageHead("AI insights", "Risk patterns found across invoices, suppliers and payments. These are calculated from the data with fixed rules."),
    h("div", { class: "insights" }, findings.map((f) => h("a", { class: "card insight", href: f.href },
      h("div", { class: "row between" }, h("strong", {}, f.title), badge(f.tone)), h("p", { class: "small muted" }, f.text)))));
}

export const activityPage = (title = "Financial activity", sub = "Everything recorded across invoices, newest first.") => () =>
  h("div", { class: "page" }, pageHead(title, sub), card({}, activityFeed(activity().slice(0, 80))));

const supplierColumns = [
  { key: "name", label: "Supplier", sort: (s) => s.name, render: (s) => link(`#/supplier/${s.id}`, h("strong", {}, s.name)) },
  { key: "category", label: "Category", sort: (s) => s.category, render: (s) => s.category },
  { key: "paid", label: "Paid, 12 months", align: "right", sort: (s) => paidTo(s), render: (s) => money(paidTo(s)) },
  { key: "open", label: "Outstanding", align: "right", sort: (s) => openFor(s).length, render: (s) => String(openFor(s).length) },
  { key: "status", label: "Status", sort: (s) => s.status, render: (s) => badge(s.status) },
  { key: "risk", label: "Risk", sort: (s) => ({ High: 0, Medium: 1, Low: 2 })[riskOf(s).level], render: (s) => badge(riskOf(s).level) },
];
const paidTo = (s) => sum(payments().filter((p) => p.supplier === s.id), (p) => p.amount);
const openFor = (s) => invoices().filter((i) => i.supplier === s.id && !isPaid(i) && i.paymentStatus !== "Rejected");

export const suppliersPage = (title, sub, filter = () => true) => () =>
  h("div", { class: "page" }, pageHead(title, sub), card({}, table({
    label: title, rows: SUPPLIERS.filter(filter), columns: supplierColumns, initialSort: { key: "name", dir: "asc" }, emptyText: "No suppliers match",
    onRow: (s) => { location.hash = `#/supplier/${s.id}`; },
  })));

export function riskPage() {
  const rows = SUPPLIERS.map((s) => ({ s, ...riskOf(s) })).sort((a, b) => a.risks.length < b.risks.length ? 1 : -1);
  return h("div", { class: "page" }, pageHead("Supplier risk indicators", "Why each supplier is rated the way it is."),
    h("div", { class: "insights" }, rows.map((r) => h("a", { class: "card insight", href: `#/supplier/${r.s.id}` },
      h("div", { class: "row between" }, h("strong", {}, r.s.name), badge(r.level)),
      r.risks.length ? h("ul", { class: "plain small" }, r.risks.map((x) => h("li", {}, x.text))) : h("p", { class: "small muted" }, "No risk indicators.")))));
}

export function supplierDetail(id) {
  const s = supplier(id);
  if (!s) return h("div", { class: "page" }, pageHead("Supplier not found"), link("#/suppliers", "Back to suppliers"));
  const mine = invoices().filter((i) => i.supplier === id);
  const paid = mine.filter(isPaid);
  const { level, risks } = riskOf(s);
  const changed = s.pendingAddress && !state.confirmedAddresses[id];
  const confirmed = s.pendingAddress && state.confirmedAddresses[id];
  const months = lastMonths(12);
  const history = months.map((m) => ({ label: new Date(`${m}-15`).toLocaleDateString("en-GB", { month: "short" }), value: sum(payments().filter((p) => p.supplier === id && p.month === m), (p) => p.amount) }));
  const askConfirm = () => modal("Verify the new payout address", h("div", {},
    notice("Only confirm after speaking to the supplier through a contact you already trust, not one from the email asking for the change.", "bad"),
    kv([["Current", h("span", { class: "mono" }, s.address)], ["Requested", h("span", { class: "mono" }, s.pendingAddress)], ["Known contact", `${s.contact}, ${s.phone}`]])),
  (close) => [button("Cancel", close, "ghost"), button("I verified this address", () => { confirmAddress(id); close(); toast("Address verified and logged", "good"); }, "primary")]);

  return h("div", { class: "page" },
    h("a", { class: "back", href: "#/suppliers" }, "← Suppliers"),
    pageHead(s.name, `${s.category} · ${s.city} · supplier since ${date(s.since)}`, h("div", { class: "row gap" }, badge(s.status), badge(level))),
    changed ? h("div", { class: "verdict bad" },
      h("div", { class: "verdict-head" }, icon("alert", 18), h("strong", {}, "Payout address changed")),
      h("p", {}, "A recent invoice asks for payment to a different address. Payments to this supplier stay blocked until a person verifies it."),
      kv([["On file", h("span", { class: "mono" }, s.address)], ["Requested", h("span", { class: "mono" }, s.pendingAddress)]]),
      button("Verify new address", askConfirm, "danger")) : null,
    confirmed ? notice("The new payout address was verified by a person and is now on file.", "info") : null,
    h("div", { class: "grid kpis" },
      card({ class: "stat-card" }, stat("Total paid, 12 months", money(paidTo(s)))),
      card({ class: "stat-card" }, stat("Outstanding invoices", String(openFor(s).length))),
      card({ class: "stat-card" }, stat("Outstanding amount", money(sum(openFor(s))))),
      card({ class: "stat-card" }, stat("Paid invoices this month", String(paid.length)))),
    h("div", { class: "grid two" },
      card({}, cardHead("Company and contact"), kv([
        ["Contact", s.contact], ["Email", s.email], ["Phone", s.phone], ["Domain on file", s.domain],
        ["Approved payout address", h("span", { class: "mono" }, confirmed ? s.pendingAddress : s.address)],
      ])),
      card({}, cardHead("Risk indicators"), risks.length ? h("ul", { class: "plain" }, risks.map((r) => h("li", { class: "row between" }, h("span", {}, r.text), badge(r.level)))) : empty("No risk indicators"))),
    card({}, cardHead("Payment history", "tUSDM per month, demo data"), columns(history, { height: 180 })),
    card({}, cardHead("Invoices"), table({
      label: "Supplier invoices", rows: mine, emptyText: "No invoices from this supplier", initialSort: { key: "date", dir: "desc" },
      columns: [
        { key: "number", label: "Invoice", sort: (i) => i.number, render: invLink },
        { key: "date", label: "Date", sort: (i) => i.date, render: (i) => date(i.date) },
        { key: "amount", label: "Amount", align: "right", sort: (i) => i.amount, render: (i) => money(i.amount) },
        { key: "v", label: "Verification", render: (i) => badge(i.verification) },
        { key: "p", label: "Payment", render: (i) => badge(i.paymentStatus) },
      ],
    })));
}

const invoicesFor = (poId) => invoices().filter((i) => i.poId === poId);

export function posPage() {
  return h("div", { class: "page" }, pageHead("Purchase orders", "What the company agreed to buy."), card({}, table({
    label: "Purchase orders", rows: POS, initialSort: { key: "id", dir: "desc" },
    columns: [
      { key: "id", label: "PO", sort: (p) => p.id, render: (p) => h("strong", {}, p.id) },
      { key: "supplier", label: "Supplier", sort: (p) => supplier(p.supplier).name, render: (p) => link(`#/supplier/${p.supplier}`, supplier(p.supplier).name) },
      { key: "item", label: "Item", render: (p) => p.item },
      { key: "qty", label: "Qty", align: "right", render: (p) => String(p.qty) },
      { key: "total", label: "Total", align: "right", sort: (p) => p.qty * p.unit, render: (p) => money(p.qty * p.unit) },
      { key: "date", label: "Ordered", sort: (p) => p.date, render: (p) => date(p.date) },
      { key: "inv", label: "Invoices", render: (p) => { const list = invoicesFor(p.id); return list.length ? h("span", { class: "row gap" }, list.map(invLink)) : "None"; } },
    ],
  })));
}

export function grsPage() {
  const missing = POS.filter((p) => !GRS.some((g) => g.po === p.id));
  return h("div", { class: "page" }, pageHead("Goods received", "What actually arrived."),
    missing.length ? notice(`No receipt yet for ${missing.map((p) => `${p.id} (${p.item})`).join(", ")}.`) : null,
    card({}, table({
      label: "Goods receipts", rows: GRS, initialSort: { key: "date", dir: "desc" },
      columns: [
        { key: "id", label: "Receipt", sort: (g) => g.id, render: (g) => h("strong", {}, g.id) },
        { key: "po", label: "PO", sort: (g) => g.po, render: (g) => g.po },
        { key: "item", label: "Item", render: (g) => POS.find((p) => p.id === g.po).item },
        { key: "qty", label: "Received", align: "right", render: (g) => String(g.qty) },
        { key: "date", label: "Date", sort: (g) => g.date, render: (g) => date(g.date) },
        { key: "by", label: "Received by", render: (g) => g.by },
      ],
    })));
}

export function matchingPage() {
  const rows = invoices().filter((i) => i.verification !== "Pending" && i.source !== "run");
  const mark = (ok, text) => h("span", { class: `match-mark ${ok ? "good" : "bad"}` }, icon(ok ? "check" : "x", 13), text);
  return h("div", { class: "page" }, pageHead("Three-way matching", "Each invoice checked against its purchase order and goods receipt."), card({}, table({
    label: "Three-way matching", rows, initialSort: { key: "v", dir: "asc" },
    onRow: (i) => { location.hash = `#/invoice/${encodeURIComponent(i.id)}`; },
    columns: [
      { key: "n", label: "Invoice", sort: (i) => i.number, render: invLink },
      { key: "s", label: "Supplier", sort: (i) => i.supplierName, render: (i) => i.supplierName },
      { key: "po", label: "Purchase order", render: (i) => mark(!!i.po, i.po?.id ?? "None") },
      { key: "price", label: "Price", render: (i) => (i.po ? mark(i.unit === i.po.unit, i.unit === i.po.unit ? "Match" : "Differs") : "—") },
      { key: "gr", label: "Goods receipt", render: (i) => (i.po ? mark(!!i.gr, i.gr?.id ?? "Missing") : "—") },
      { key: "v", label: "Result", sort: (i) => i.verification, render: (i) => badge(i.verification) },
    ],
  })));
}

export function decisionsPage() {
  const rows = invoices().filter((i) => i.verification !== "Pending");
  return h("div", { class: "page" }, pageHead("Decisions and explanations", "What was checked, what was decided, why, and whether a person or payment was involved."),
    h("div", { class: "stack-col" }, rows.map((i) => h("details", { class: "card decision" },
      h("summary", {}, h("span", { class: "grow" }, h("strong", {}, i.number), h("span", { class: "muted small" }, ` ${i.supplierName}`)), badge(i.verification)),
      h("div", { class: "decision-body" },
        kv([
          ["Decided", i.explanation],
          ["Person needed", i.verification === "Verified" ? "No" : i.decision ? `Yes: ${i.decision.action}` : "Yes, waiting"],
          ["Payment executed", i.paidAt ? "Demo only, not on chain" : i.txHash ? "Yes, see transaction" : "No"],
        ]),
        h("h4", {}, "Checks"),
        h("ul", { class: "checks" }, i.checks.map((c) => h("li", {}, h("span", { class: `match-mark ${c.ok ? "good" : "bad"}` }, icon(c.ok ? "check" : "x", 13)), h("span", {}, h("strong", {}, c.name), ` ${c.detail}`)))),
        link(`#/invoice/${encodeURIComponent(i.id)}`, "Open invoice"))))));
}

const LOCKED_RULES = [
  ["Payout address", "Always read from the vendor master, never from the invoice."],
  ["AI and payment", "The LLM reads documents. It has no part in the payment decision."],
  ["Missing data", "Anything missing or unreadable becomes a flag."],
  ["Double payment", "Each attempt is recorded before sending. An unclear attempt stays held for a person."],
  ["Changed address", "A new payout address needs a person to verify it first."],
  ["Soft signals", "Urgency language can add a flag. Its absence never helps an invoice pass."],
];

export function rulesPage() {
  return h("div", { class: "page" }, pageHead("Automation rules", "How an invoice moves from received to payable."),
    card({}, cardHead("Fixed safety rules", "These can't be switched off, by the agent or by a setting."), h("ul", { class: "rules" }, LOCKED_RULES.map(([t, d]) =>
      h("li", {}, icon("shield", 16), h("div", {}, h("strong", {}, t), h("p", { class: "small muted" }, d)))))),
    card({}, cardHead("What each reason means"), table({
      label: "Reason codes", rows: Object.entries(REASONS),
      columns: [
        { key: "code", label: "Code", render: ([c]) => h("code", {}, c) },
        { key: "text", label: "Meaning", render: ([, t]) => t },
      ],
    })));
}

const PERMS = [
  ["extract", "Extract invoice information", "The AI reads emails and PDFs into structured fields.", false],
  ["match", "Match invoices against purchase orders", "Runs the purchase order rules.", false],
  ["receipts", "Verify goods receipts", "Compares invoices with what was received.", false],
  ["duplicates", "Detect duplicates", "Compares against every earlier invoice.", false],
  ["autoApprove", "Approve invoices within limits", "If off, every verified invoice waits for a person.", true],
  ["autoPay", "Execute authorised payments", "Recorded only. The payment connector isn't connected, so nothing can be sent.", false],
];

export function permissionsPage() {
  const toggle = ([key, title, detail, wired]) => h("label", { class: "toggle-row" },
    h("div", { class: "grow" }, h("strong", {}, title), h("p", { class: "small muted" }, detail), !wired ? h("p", { class: "tiny muted" }, "Setting saved. It doesn't change the demo results yet.") : null),
    h("input", { type: "checkbox", class: "switch", role: "switch", checked: state.perms[key], onchange: (e) => setPerm(key, e.target.checked) }));
  const limit = (key, title, detail, suffix) => h("label", { class: "limit-row" },
    h("div", { class: "grow" }, h("strong", {}, title), h("p", { class: "small muted" }, detail)),
    h("span", { class: "limit-input" }, h("input", { type: "number", min: 0, value: state.limits[key], "aria-label": title, onchange: (e) => {
      const value = Number(e.target.value);
      if (!Number.isFinite(value) || value < 0) { e.target.value = state.limits[key]; toast("Enter a positive number", "bad"); return; }
      setLimit(key, value);
      toast("Limit saved. Unpaid invoices were rechecked.", "good");
    } }), h("span", { class: "muted small" }, suffix)));
  const verified = invoices().filter((i) => i.verification === "Verified" && !i.paidAt).length;
  return h("div", { class: "page" }, pageHead("Permissions and spending limits", "You decide what the agent may do alone. Unpaid invoices are rechecked as soon as a limit changes."),
    h("div", { class: "grid two" },
      card({}, cardHead("Automation permissions"), h("div", { class: "rows" }, PERMS.map(toggle))),
      h("div", { class: "stack-col" },
        card({}, cardHead("Financial limits", `${verified} unpaid invoices currently pass these limits`), h("div", { class: "rows" },
          limit("maxAuto", "Maximum automatic payment", "Anything above this needs a person.", "tUSDM"),
          limit("maxDaily", "Maximum daily payment volume", "Saved here. The payer has to enforce it.", "tUSDM"),
          limit("deviation", "Allowed price deviation", "Difference from the purchase order price.", "%"))),
        card({}, cardHead("Approval requirements"), h("div", { class: "rows" },
          h("label", { class: "toggle-row" }, h("div", { class: "grow" }, h("strong", {}, "Approved supplier list only"), h("p", { class: "small muted" }, "Suppliers under review need a person.")),
            h("input", { type: "checkbox", class: "switch", role: "switch", checked: state.limits.approvedOnly, onchange: (e) => setLimit("approvedOnly", e.target.checked) })))),
        card({}, cardHead("Always a person"), h("ul", { class: "plain small" }, ["A changed payout address", "Any invoice with no purchase order", "Amounts over the automatic limit", "Any unclear payment attempt"].map((t) => h("li", {}, t)))))));
}

export function configPage() {
  return h("div", { class: "page" }, pageHead("Agent configuration", "How the agent is set up in this prototype."),
    h("div", { class: "grid two" },
      card({}, cardHead("Separation of duties"), h("ol", { class: "pipeline" },
        h("li", {}, h("strong", {}, "AI extraction"), h("p", { class: "small muted" }, "Reads untrusted emails and PDFs into fields.")),
        h("li", {}, h("strong", {}, "Deterministic rules"), h("p", { class: "small muted" }, "Decide Verified, Requires approval or Blocked.")),
        h("li", {}, h("strong", {}, "Human approval"), h("p", { class: "small muted" }, "Handles what the rules won't pass.")),
        h("li", {}, h("strong", {}, "Payment"), h("p", { class: "small muted" }, "Pays verified invoices to vendor master addresses.")))),
      card({}, cardHead("Environment"), kv([
        ["Network", "Cardano Preprod (test only)"], ["Payment rail", "x402, not connected"], ["Job payments", "Masumi, not connected"],
        ["Data", "Fictional demo data"], ["Assistant", "Answers from dashboard data, no LLM connected"],
      ]), h("div", { class: "actions top" }, button("Reset demo data", () => modal("Reset demo data?", h("p", {}, "This clears your approvals, limits, drafts and audit entries in this browser."), (close) => [button("Cancel", close, "ghost"), button("Reset", () => { resetDemo(); close(); toast("Demo data reset"); }, "danger")]), "ghost")))));
}

export function auditPage() {
  const entries = auditEntries().slice(0, 150);
  return h("div", { class: "page" }, pageHead("Audit trail", "Every action, decision and approval, newest first."), card({}, table({
    label: "Audit trail", rows: entries, emptyText: "No entries yet",
    columns: [
      { key: "at", label: "Time", render: (e) => when(e.at) },
      { key: "actor", label: "Actor", render: (e) => e.actor },
      { key: "action", label: "Action", render: (e) => h("strong", {}, e.action) },
      { key: "detail", label: "Detail", render: (e) => e.detail },
      { key: "inv", label: "Invoice", render: (e) => (e.invoice ? link(`#/invoice/${encodeURIComponent(e.invoice)}`, e.invoice) : "—") },
    ],
  })));
}

const NETWORK = "Cardano Preprod (test)";
const txRows = () => invoices().filter(isPaid);

export function transactionsPage() {
  const real = txRows().filter((i) => isRealHash(i.txHash)).length;
  return h("div", { class: "page" }, pageHead("Transactions", "Test transactions on Cardano Preprod."),
    notice(real ? `Real test transactions: ${real}. Demo rows have no hash.` : "No real transactions yet. Every row is a demo with no hash, so nothing has an explorer link. Real runs appear here with their hash.", real ? "info" : "warn"),
    card({}, table({
      label: "Transactions", rows: txRows(), initialSort: { key: "time", dir: "desc" }, emptyText: "No transactions yet",
      onRow: (i) => { location.hash = `#/tx/${encodeURIComponent(i.id)}`; },
      columns: [
        { key: "amount", label: "Amount", align: "right", sort: (i) => i.amount, render: (i) => money(i.amount) },
        { key: "to", label: "Recipient", render: (i) => h("span", { class: "mono ellipsis addr" }, i.approvedAddress ?? "Vendor master") },
        { key: "status", label: "Status", render: (i) => badge(i.paymentStatus) },
        { key: "hash", label: "Hash", render: (i) => (isRealHash(i.txHash) ? h("span", { class: "mono" }, `${i.txHash.slice(0, 10)}…`) : "None") },
        { key: "net", label: "Network", render: () => NETWORK },
        { key: "time", label: "Time", sort: (i) => i.paidAt ?? i.date, render: (i) => date(i.paidAt ?? i.date) },
        { key: "inv", label: "Invoice", render: invLink },
      ],
    })));
}

export function txDetail(id) {
  const i = invoice(id);
  if (!i || !isPaid(i)) return h("div", { class: "page" }, pageHead("Transaction not found"), link("#/transactions", "Back to transactions"));
  const real = isRealHash(i.txHash);
  return h("div", { class: "page" }, h("a", { class: "back", href: "#/transactions" }, "← Transactions"),
    pageHead(real ? "Test transaction" : "Demo payment", `${tusdm(i.amount)} for ${i.number}`, badge(i.paymentStatus)),
    real ? null : notice("Demo only: this payment was never submitted to a blockchain, so there is no hash or explorer link."),
    card({}, kv([
      ["Amount", tusdm(i.amount)],
      ["Recipient", h("span", { class: "mono" }, i.approvedAddress ?? "Set by the payer from the vendor master")],
      ["Status", badge(i.paymentStatus)],
      ["Transaction hash", real ? h("span", { class: "mono" }, i.txHash) : "None"],
      ["Network", NETWORK],
      ["Timestamp", when(i.paidAt ?? i.date)],
      ["Invoice", invLink(i)],
    ]), real ? h("div", { class: "actions top" }, h("a", { class: "btn primary", href: `https://preprod.cardanoscan.io/transaction/${i.txHash}`, target: "_blank", rel: "noreferrer" }, icon("link", 15), "View on Cardanoscan")) : null));
}

export function cashflowPage() {
  const open = invoices().filter((i) => !isPaid(i) && i.paymentStatus !== "Rejected" && i.due);
  const weeks = Array.from({ length: 6 }, (_, n) => {
    const start = new Date(`${TODAY}T12:00:00`);
    start.setDate(start.getDate() + n * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const [a, b] = [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    const list = open.filter((i) => (n === 0 ? i.due <= b : i.due >= a && i.due <= b));
    const held = list.filter((i) => i.verification === "Blocked" && i.decision?.action !== "Approved");
    return { label: start.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), a, b, list, value: sum(list), held: sum(held), payable: sum(list) - sum(held) };
  });
  let balance = CASH_BALANCE;
  const rows = weeks.map((w) => { balance -= w.payable; return { ...w, balance }; });
  const totalOpen = sum(open);
  const heldTotal = sum(open.filter((i) => i.verification === "Blocked" && i.decision?.action !== "Approved"));
  return h("div", { class: "page" }, pageHead("Cash flow forecast", "Upcoming payments by due date. Held invoices aren't counted in the projected balance."),
    h("div", { class: "grid kpis" },
      card({ class: "stat-card" }, stat("Operating balance (demo)", money(CASH_BALANCE))),
      card({ class: "stat-card" }, stat("Outstanding", money(totalOpen))),
      card({ class: "stat-card" }, stat("Of which held", money(heldTotal))),
      card({ class: "stat-card" }, stat("Balance after 6 weeks", money(rows.at(-1).balance)))),
    card({}, cardHead("Due per week", "Week starting. tUSDM, including held invoices."), columns(weeks)),
    card({}, table({
      label: "Weekly forecast", rows,
      columns: [
        { key: "w", label: "Week starting", render: (r) => r.label },
        { key: "c", label: "Invoices", align: "right", render: (r) => String(r.list.length) },
        { key: "p", label: "Payable", align: "right", render: (r) => money(r.payable) },
        { key: "h", label: "Held", align: "right", render: (r) => money(r.held) },
        { key: "b", label: "Projected balance", align: "right", render: (r) => money(r.balance) },
      ],
    })));
}

let analyticsRange = 12;

export function analyticsPage() {
  const volume = h("div", {});
  const bySupplier = h("div", {});
  const byCategory = h("div", {});
  const headline = h("div", { class: "grid kpis" });
  const draw = (n) => {
    analyticsRange = n;
    const range = lastMonths(n);
    const v = monthlyVolume(range);
    const totalSpend = sum(v, (d) => d.value);
    volume.replaceChildren(columns(v, { highlight: (d) => d.month === thisMonth() }));
    bySupplier.replaceChildren(hbars(spendBySupplier(range), { href: (d) => `#/supplier/${d.id}` }));
    byCategory.replaceChildren(hbars(spendByCategory(range)));
    headline.replaceChildren(
      card({ class: "stat-card" }, stat("Total spend", money(totalSpend))),
      card({ class: "stat-card" }, stat("Monthly average", money(totalSpend / n))),
      card({ class: "stat-card" }, stat("Largest supplier", spendBySupplier(range)[0]?.label ?? "—")),
      card({ class: "stat-card" }, stat("Largest category", spendByCategory(range)[0]?.label ?? "—")));
  };
  draw(analyticsRange);
  return h("div", { class: "page" }, pageHead("Spending analytics", "Demo data.", rangePicker(analyticsRange, draw)), headline,
    card({}, cardHead("Payment volume"), volume),
    h("div", { class: "grid two" }, card({}, cardHead("By supplier"), bySupplier), card({}, cardHead("By category"), byCategory)));
}

export function accountsPage() {
  return h("div", { class: "page" }, pageHead("Payment accounts", "Wallets the agent would pay from."),
    notice("Demo balances. No wallet is connected to this dashboard, and private keys never reach the browser.", "info"),
    h("div", { class: "grid three" }, ACCOUNTS.map((a) => card({ class: "stat-card" },
      h("strong", {}, a.name), h("div", { class: "kpi-value num" }, `${a.balance.toLocaleString("en")} `, h("span", { class: "muted small" }, a.asset)),
      h("p", { class: "small muted" }, a.role), h("p", { class: "tiny muted" }, `${a.network} · ${a.status}`)))));
}

export const companyPage = () => h("div", { class: "page" }, pageHead("Company profile"), card({}, kv([
  ["Name", COMPANY.legal], ["Address", COMPANY.address], ["VAT ID", COMPANY.vat], ["Industry", COMPANY.industry], ["Base asset", "tUSDM on Cardano Preprod"],
])));

export const teamPage = () => h("div", { class: "page" }, pageHead("Team and permissions", "Who can do what. Fictional people."), card({}, table({
  label: "Team", rows: TEAM,
  columns: [
    { key: "n", label: "Name", render: (t) => h("strong", {}, t.name) },
    { key: "r", label: "Role", render: (t) => t.role },
    { key: "a", label: "Access", render: (t) => t.access },
  ],
})));

export const integrationsPage = () => h("div", { class: "page" }, pageHead("Integrations", "The systems this dashboard is built to connect to."),
  h("div", { class: "insights" }, INTEGRATIONS.map((x) => card({ class: "insight" }, h("div", { class: "row between" }, h("strong", {}, x.name), badge(x.status)), h("p", { class: "small muted" }, x.detail)))));

export const walletPage = () => h("div", { class: "page" }, pageHead("Cardano wallet configuration"),
  notice("Secrets don't belong here. Keys stay in private server-side files, and this page can never show or accept a recovery phrase.", "info"),
  card({}, kv([
    ["Network", "Cardano Preprod only"], ["Wallet", "Not connected"], ["Signing", "Server side, in the x402 payer"], ["Explorer", "preprod.cardanoscan.io"], ["Transaction links", "Only shown for real hashes"],
  ])));

export const notificationsPage = () => {
  const items = notifications();
  return h("div", { class: "page" }, pageHead("Notifications", "New invoices, blocked payments, due dates and unusual activity."), card({},
    items.length ? h("ul", { class: "attn" }, items.map((n) => h("li", {}, h("a", { href: n.href }, h("span", { class: `attn-mark ${n.tone}` }, icon(n.tone === "bad" ? "alert" : n.tone === "warn" ? "clock" : "bell", 14)), h("span", { class: "grow" }, n.text))))) : empty("No notifications")));
};
