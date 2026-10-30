// Overview and accounts payable pages.
import { COMPANY, PRIOR, SUPPLIERS, TODAY } from "./data.js";
import { REASONS } from "./rules.js";
import {
  activity, addDocuments, attention, decide, invoice, invoices, isPaid, payments, reviewRun,
  saveDraft, state, supplier, thisMonth, timeline,
} from "./store.js";
import { columns, hbars, sparkline, statusBar } from "./charts.js";
import {
  badge, button, card, cardHead, date, empty, h, icon, kv, link, modal, money, notice, pageHead, table, toast, tusdm, when,
} from "./ui.js";

const sum = (list, pick = (i) => i.amount) => list.reduce((n, i) => n + pick(i), 0);

export const monthLabel = (m) => new Date(`${m}-15`).toLocaleDateString("en-GB", { month: "short" });

export function lastMonths(count) {
  const out = [];
  const d = new Date(`${thisMonth()}-15`);
  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 15);
    out.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function greeting() {
  const hour = new Date().getHours();
  return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
}

function delta(now, before, { goodWhenUp }) {
  if (!before) return null;
  const pct = ((now - before) / before) * 100;
  const up = pct >= 0;
  const good = up === goodWhenUp;
  return h("span", { class: `delta ${Math.abs(pct) < 0.5 ? "" : good ? "good" : "bad"}` },
    icon(up ? "arrowUp" : "arrowDown", 12), `${Math.abs(pct).toFixed(1)}%`, h("span", { class: "muted" }, " vs last month"));
}

function kpi(label, value, ic, deltaEl, spark, href) {
  return h("a", { class: "card kpi", href },
    h("div", { class: "kpi-top" }, h("span", { class: "kpi-label" }, label), h("span", { class: "kpi-icon" }, icon(ic, 15))),
    h("div", { class: "kpi-value num" }, value, ic === "doc" ? null : h("span", { class: "kpi-unit" }, " tUSDM")),
    h("div", { class: "kpi-foot" }, deltaEl, spark));
}

export function monthlyVolume(months) {
  const rows = payments();
  return months.map((m) => ({ label: monthLabel(m), title: new Date(`${m}-15`).toLocaleDateString("en-GB", { month: "long", year: "numeric" }), month: m, value: sum(rows.filter((p) => p.month === m), (p) => p.amount) }));
}

export function spendBySupplier(months) {
  const rows = payments().filter((p) => months.includes(p.month));
  return SUPPLIERS.map((s) => ({ label: s.name, id: s.id, value: sum(rows.filter((p) => p.supplier === s.id), (p) => p.amount) }))
    .filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
}

export function spendByCategory(months) {
  const rows = payments().filter((p) => months.includes(p.month));
  const totals = new Map();
  rows.forEach((p) => {
    const cat = supplier(p.supplier)?.category ?? "Other";
    totals.set(cat, (totals.get(cat) ?? 0) + p.amount);
  });
  return [...totals].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

export const statusParts = (all) => [
  { label: "Verified", key: "ready", tone: "good", value: all.filter((i) => i.verification === "Verified").length },
  { label: "Requires approval", key: "approval", tone: "warn", value: all.filter((i) => i.verification === "Requires approval").length },
  { label: "Blocked", key: "blocked", tone: "bad", value: all.filter((i) => i.verification === "Blocked").length },
  { label: "Pending", key: "pending", tone: "info", value: all.filter((i) => i.verification === "Pending").length },
];

export function rangePicker(value, onChange) {
  const options = [[3, "3M"], [6, "6M"], [12, "12M"]];
  const wrap = h("div", { class: "segmented", role: "group", "aria-label": "Date range" });
  const draw = (current) => wrap.replaceChildren(...options.map(([n, label]) =>
    h("button", { type: "button", class: n === current ? "on" : "", "aria-pressed": String(n === current), onclick: () => { draw(n); onChange(n); } }, label)));
  draw(value);
  return wrap;
}

export function invoiceRow(i) {
  return h("a", { class: "list-row", href: `#/invoice/${encodeURIComponent(i.id)}` },
    h("div", { class: "grow" }, h("strong", {}, i.number), h("div", { class: "muted small ellipsis" }, i.supplierName)),
    h("span", { class: "num strong" }, money(i.amount)),
    badge(i.verification === "Verified" || isPaid(i) ? i.paymentStatus : i.verification));
}

let overviewTab = "received";
let overviewRange = 12;

export function overview() {
  const all = invoices();
  const paidNow = all.filter((i) => i.paidAt?.startsWith(thisMonth()));
  const months = lastMonths(12);
  const volume = monthlyVolume(months);
  const paidValue = sum(payments().filter((p) => p.month === thisMonth()), (p) => p.amount);
  const prevPaid = volume[volume.length - 2].value;
  const pending = all.filter((i) => ["Ready", "Awaiting approval", "Queued, not sent"].includes(i.paymentStatus));
  const blocked = all.filter((i) => ["Held", "On hold"].includes(i.paymentStatus));
  const processed = all.filter((i) => i.verification !== "Pending").length;
  const longDate = new Date(`${TODAY}T12:00:00`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const tabs = [
    ["received", "Received", [...all].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)],
    ["verifying", "Being verified", all.filter((i) => i.verification === "Pending")],
    ["approval", "Awaiting approval", all.filter((i) => i.paymentStatus === "Awaiting approval")],
    ["ready", "Ready for payment", all.filter((i) => i.paymentStatus === "Ready")],
    ["paid", "Completed", all.filter(isPaid).sort((a, b) => (b.paidAt ?? "").localeCompare(a.paidAt ?? ""))],
  ];
  const tabBody = h("div", { class: "list" });
  const tabBar = h("div", { class: "tabs", role: "tablist" });
  const drawTabs = () => {
    tabBar.replaceChildren(...tabs.map(([key, label, rows]) => h("button", {
      type: "button", role: "tab", class: key === overviewTab ? "on" : "", "aria-selected": String(key === overviewTab),
      onclick: () => { overviewTab = key; drawTabs(); },
    }, label, h("span", { class: "count" }, String(rows.length)))));
    const rows = tabs.find(([key]) => key === overviewTab)[2];
    tabBody.replaceChildren(...(rows.length ? rows.map(invoiceRow) : [empty("Nothing here right now")]));
  };
  drawTabs();

  const items = attention();
  const volumeBox = h("div", {});
  const supplierBox = h("div", {});
  const categoryBox = h("div", {});
  const drawCharts = (n) => {
    overviewRange = n;
    const range = lastMonths(n);
    volumeBox.replaceChildren(columns(monthlyVolume(range), { highlight: (d) => d.month === thisMonth() }));
    supplierBox.replaceChildren(hbars(spendBySupplier(range).slice(0, 6), { href: (d) => `#/supplier/${d.id}` }));
    categoryBox.replaceChildren(hbars(spendByCategory(range)));
  };
  drawCharts(overviewRange);

  return h("div", { class: "page" },
    pageHead(`${greeting()}, ${COMPANY.name}`, longDate),
    h("div", { class: "grid kpis" },
      kpi("Invoices processed", String(processed), "doc", delta(processed, PRIOR.processed, { goodWhenUp: true }), null, "#/invoices"),
      kpi("Paid this month", money(paidValue), "coins", delta(paidValue, prevPaid, { goodWhenUp: true }), sparkline(volume.slice(-6).map((v) => v.value)), "#/payments"),
      kpi("Pending payments", money(sum(pending)), "clock", delta(sum(pending), PRIOR.pending, { goodWhenUp: false }), null, "#/invoices?view=ready"),
      kpi("Blocked or flagged", money(sum(blocked)), "shield", delta(sum(blocked), PRIOR.blocked, { goodWhenUp: false }), null, "#/invoices?view=blocked")),
    h("div", { class: "grid two-one" },
      card({}, cardHead("Invoice activity", `${paidNow.length} paid this month in demo data`, link("#/invoices", "All invoices")), tabBar, tabBody),
      card({ class: "attention" }, cardHead("Needs your attention", items.length ? `${items.length} open items` : null),
        items.length
          ? h("ul", { class: "attn" }, items.map((a) => h("li", {}, h("a", { href: a.href },
              h("span", { class: `attn-mark ${a.tone}` }, icon(a.tone === "bad" ? "alert" : "clock", 14)), h("span", { class: "grow" }, a.text), icon("arrowDown", 12)))))
          : empty("All clear", "Nothing needs a person right now."))),
    h("div", { class: "grid two-one" },
      card({}, cardHead("Monthly payment volume", "tUSDM paid, demo data", rangePicker(overviewRange, drawCharts)), volumeBox),
      card({}, cardHead("Processing status", `${all.length} invoices`), statusBar(statusParts(all), { href: (p) => (p.key === "ready" ? "#/invoices?view=verified" : `#/invoices?view=${p.key}`) }))),
    h("div", { class: "grid two" },
      card({}, cardHead("Spending by supplier", "Follows the selected range"), supplierBox),
      card({}, cardHead("Spending by category", "Follows the selected range"), categoryBox)),
    card({}, cardHead("AI Agent Activity", "Newest first. Open any item for detail.", link("#/agent/activity", "Full activity")), activityFeed(activity().slice(0, 8))));
}

export function activityFeed(events) {
  if (events.length === 0) return empty("No activity yet");
  return h("ol", { class: "feed" }, events.map((e) =>
    h("li", {}, h("details", {},
      h("summary", {}, h("span", { class: `feed-dot ${e.kind}` }), h("span", { class: "grow" }, e.title), h("span", { class: "muted small nowrap" }, when(e.at))),
      h("div", { class: "feed-body" }, h("p", {}, e.detail),
        e.invoice ? link(`#/invoice/${encodeURIComponent(e.invoice.id)}`, `Open ${e.invoice.number}: ${e.invoice.supplierName}`) : null)))));
}

const VIEWS = {
  all: ["All invoices", () => true, "Every invoice the agent has received."],
  pending: ["Pending verification", (i) => i.verification === "Pending", "Still being read. The rules run once extraction finishes."],
  verified: ["Verified invoices", (i) => i.verification === "Verified", "Passed every rule."],
  ready: ["Ready for payment", (i) => i.paymentStatus === "Ready" || i.paymentStatus === "Queued, not sent", "Verified or approved by a person, and not yet paid."],
  approval: ["Awaiting approval", (i) => i.paymentStatus === "Awaiting approval", "Need a person's decision."],
  blocked: ["Blocked invoices", (i) => i.verification === "Blocked" && !isPaid(i), "Failed a hard rule."],
};

const filters = { q: "", supplier: "", status: "", from: "", to: "" };

export function invoicesPage(params) {
  const view = VIEWS[params.get("view")] ?? VIEWS.all;
  const base = invoices().filter(view[1]);
  const tableBox = h("div", {});
  const count = h("span", { class: "muted small" });

  const draw = () => {
    const q = filters.q.toLowerCase();
    const rows = base.filter((i) =>
      (!q || `${i.number} ${i.supplierName} ${i.item} ${i.poId ?? ""}`.toLowerCase().includes(q))
      && (!filters.supplier || i.supplierName === filters.supplier)
      && (!filters.status || i.verification === filters.status || i.paymentStatus === filters.status)
      && (!filters.from || i.date >= filters.from)
      && (!filters.to || i.date <= filters.to));
    count.textContent = `${rows.length} of ${base.length} invoices`;
    tableBox.replaceChildren(table({
      label: view[0], rows,
      emptyText: base.length ? "No invoices match these filters" : "No invoices in this view",
      initialSort: { key: "date", dir: "desc" },
      onRow: (i) => { location.hash = `#/invoice/${encodeURIComponent(i.id)}`; },
      columns: [
        { key: "number", label: "Invoice", sort: (i) => i.number, render: (i) => link(`#/invoice/${encodeURIComponent(i.id)}`, h("strong", {}, i.number)) },
        { key: "supplier", label: "Supplier", sort: (i) => i.supplierName, render: (i) => i.supplierName },
        { key: "date", label: "Invoice date", sort: (i) => i.date, render: (i) => date(i.date) },
        { key: "due", label: "Due date", sort: (i) => i.due ?? "", render: (i) => date(i.due) },
        { key: "amount", label: "Amount", align: "right", sort: (i) => i.amount, render: (i) => money(i.amount) },
        { key: "verification", label: "Verification", sort: (i) => i.verification, render: (i) => badge(i.verification) },
        { key: "payment", label: "Payment", sort: (i) => i.paymentStatus, render: (i) => badge(i.paymentStatus) },
        { key: "actions", label: "Actions", render: (i) => link(`#/invoice/${encodeURIComponent(i.id)}`, i.needsPerson ? "Review" : "View") },
      ],
    }));
  };

  const bind = (key) => (e) => { filters[key] = e.target.value; draw(); };
  const names = [...new Set(base.map((i) => i.supplierName))].sort();
  const statuses = [...new Set(base.flatMap((i) => [i.verification, i.paymentStatus]))].sort();
  if (!names.includes(filters.supplier)) filters.supplier = "";
  if (!statuses.includes(filters.status)) filters.status = "";

  const option = (value, current) => h("option", { value, selected: value === current }, value);
  const toolbar = h("div", { class: "toolbar" },
    h("label", { class: "field search" }, icon("search", 14), h("input", { type: "search", placeholder: "Search number, supplier, item, PO", "aria-label": "Search invoices", value: filters.q, oninput: bind("q") })),
    h("select", { "aria-label": "Filter by supplier", onchange: bind("supplier") }, h("option", { value: "" }, "All suppliers"), names.map((n) => option(n, filters.supplier))),
    h("select", { "aria-label": "Filter by status", onchange: bind("status") }, h("option", { value: "" }, "All statuses"), statuses.map((n) => option(n, filters.status))),
    h("label", { class: "field date" }, "From", h("input", { type: "date", value: filters.from, onchange: bind("from") })),
    h("label", { class: "field date" }, "To", h("input", { type: "date", value: filters.to, onchange: bind("to") })),
    button("Clear", () => { Object.assign(filters, { q: "", supplier: "", status: "", from: "", to: "" }); rerender(); }, "ghost small"));

  draw();
  return h("div", { class: "page" }, pageHead(view[0], view[2]), card({}, toolbar, h("div", { class: "toolbar-count" }, count), tableBox));
}

const rerender = () => window.dispatchEvent(new Event("clearline:render"));

function documentPreview(i) {
  const s = i.supplierObj;
  return h("div", { class: "paper", "aria-label": "Invoice document preview" },
    h("div", { class: "paper-top" },
      h("div", {}, h("strong", {}, i.supplierName), h("div", { class: "small" }, s?.city ?? ""), h("div", { class: "small" }, i.from ?? s?.email ?? "")),
      h("div", { class: "right" }, h("div", { class: "paper-title" }, "INVOICE"), h("div", { class: "small" }, i.number))),
    kv([["Bill to", COMPANY.legal], ["Invoice date", date(i.date)], ["Due", date(i.due)], ["Reference", i.poId ?? "None stated"]]),
    h("table", { class: "paper-table" },
      h("thead", {}, h("tr", {}, h("th", {}, "Item"), h("th", { class: "right" }, "Qty"), h("th", { class: "right" }, "Unit"), h("th", { class: "right" }, "Total"))),
      h("tbody", {}, h("tr", {}, h("td", {}, i.item), h("td", { class: "right" }, String(i.qty)), h("td", { class: "right" }, money(i.unit)), h("td", { class: "right" }, money(i.amount))))),
    h("div", { class: "paper-total" }, "Total due ", h("strong", {}, tusdm(i.amount))),
    i.statedAddress ? h("p", { class: "small mono" }, `Pay to: ${i.statedAddress}`) : null,
    i.signals.map((text) => h("p", { class: "small" }, text)),
    i.hidden ? h("p", { class: "paper-hidden" }, h("span", { class: "muted small" }, "Hidden text found in the file, ignored by the rules: "), i.hidden) : null,
    h("p", { class: "muted tiny" }, "Rendered preview of a fictional document."));
}

function matching(i) {
  if (!i.po && !i.gr && i.source === "run") return null;
  const { po, gr } = i;
  const same = (a, b) => (a === undefined || b === undefined || a === null || b === null ? null : a === b);
  const rows = [
    ["Supplier", i.supplierName, po ? supplier(po.supplier)?.name : null, gr ? supplier(po.supplier)?.name : null, po ? same(i.supplier, po.supplier) : false],
    ["Product or service", i.item, po?.item, gr ? po.item : null, po ? same(i.item, po.item) : false],
    ["Quantity", i.qty, po?.qty, gr?.qty, po ? i.qty <= po.qty && (!gr || i.qty <= gr.qty) : false],
    ["Unit price", money(i.unit), po ? money(po.unit) : null, null, po ? i.unit === po.unit : false],
    ["Total amount", money(i.amount), po ? money(po.qty * po.unit) : null, gr && po ? money(gr.qty * po.unit) : null, po ? i.amount === po.qty * po.unit : false],
  ];
  return h("div", { class: "table-wrap" }, h("table", { class: "match", "aria-label": "Three-way match" },
    h("thead", {}, h("tr", {}, h("th", {}, ""), h("th", {}, "Invoice"), h("th", {}, po ? `Purchase order ${po.id}` : "Purchase order"), h("th", {}, gr ? `Goods receipt ${gr.id}` : "Goods receipt"), h("th", {}, "Result"))),
    h("tbody", {}, rows.map(([name, a, b, c, ok]) => h("tr", { class: ok ? "" : "miss" },
      h("th", { scope: "row" }, name), h("td", {}, a ?? "—"), h("td", {}, b ?? "—"), h("td", {}, c ?? "—"),
      h("td", {}, h("span", { class: `match-mark ${ok ? "good" : "bad"}` }, icon(ok ? "check" : "x", 13), ok ? "Match" : "Mismatch")))))));
}

function stages(i) {
  const approved = i.verification === "Verified" || i.decision?.action === "Approved" || isPaid(i);
  const step = (title, value, tone, note) => h("li", { class: `stage ${tone}` }, h("span", { class: "stage-dot" }), h("strong", {}, title), h("div", { class: "small" }, value), note ? h("div", { class: "muted tiny" }, note) : null);
  const real = i.source === "run" && i.txHash;
  return h("ol", { class: "stages" },
    step("Invoice verification", i.verification, i.verification === "Verified" ? "good" : i.verification === "Blocked" ? "bad" : "warn", "Deterministic rules"),
    step("Internal approval", i.decision?.action === "Rejected" ? "Rejected" : approved ? (i.decision?.action === "Approved" ? "Approved by a person" : "Within company policy") : "Not approved", approved ? "good" : i.decision?.action === "Rejected" ? "bad" : "warn"),
    step("Payment submission", real ? "Submitted" : i.paidAt ? "Demo only, not submitted" : "Not submitted", real ? "good" : "idle", i.source !== "run" ? "x402 not connected" : null),
    step("Blockchain confirmation", real ? "See explorer" : "None", real ? "good" : "idle", "Cardano Preprod"));
}

function draftMessage(i) {
  const reasons = i.reasons.map((code) => `- ${REASONS[code] ?? code}`).join("\n") || "- Please confirm the invoice details";
  return `Hello ${i.supplierObj?.contact ?? i.supplierName},\n\nWe received invoice ${i.number} for ${tusdm(i.amount)} and can't process it yet:\n\n${reasons}\n\nPlease send us a corrected invoice or the missing information.\n\nKind regards,\n${COMPANY.user.name}\n${COMPANY.legal}`;
}

export function openDraft(i) {
  const existing = state.drafts[i.id];
  const area = h("textarea", { rows: 12, "aria-label": "Message to supplier", value: existing?.text ?? draftMessage(i) });
  modal(`Message to ${i.supplierName}`, h("div", {},
    notice("Drafted by the agent. Nothing goes out without your approval, and no email service is connected yet, so approving only records it.", "info"),
    h("p", { class: "small" }, `To: ${i.supplierObj?.email ?? i.from ?? "unknown"}`),
    area),
  (close) => [
    button("Save draft", () => { saveDraft(i.id, area.value, "Draft"); close(); toast("Draft saved"); }, "ghost"),
    button("Approve message", () => {
      saveDraft(i.id, area.value, "Approved");
      decide(i.id, "Clarification", "Clarification message approved, not sent");
      close();
      toast("Approved and recorded. Not sent, because no email service is connected.");
    }, "primary", "send"),
  ]);
}

function confirmDecision(i, action, text) {
  modal(`${action}: ${i.number}`, h("p", {}, text), (close) => [
    button("Cancel", close, "ghost"),
    button(action === "Reject" ? "Reject invoice" : "Confirm", async () => {
      close();
      const result = i.source === "run"
        ? await reviewRun(i.id, action === "Approve" ? "APPROVED" : "REJECTED")
        : decide(i.id, { Approve: "Approved", Reject: "Rejected", Hold: "Hold", Queue: "Queued" }[action]);
      if (result.error) toast(result.error, "bad");
      else toast(`${i.number}: recorded`, "good");
    }, action === "Reject" ? "danger" : "primary"),
  ]);
}

function actionsFor(i) {
  if (isPaid(i)) return [];
  const rows = [];
  const open = i.verification !== "Pending";
  if (open && i.paymentStatus === "Ready" && i.source !== "run") {
    rows.push(button("Queue for payment", () => confirmDecision(i, "Queue", "This records the approval to pay. Nothing is sent, because the payment connector isn't connected yet. The payout address will come from the vendor master, never from the invoice."), "primary", "send"));
  }
  if (open && i.paymentStatus !== "Ready" && i.paymentStatus !== "Queued, not sent") {
    rows.push(button("Approve", () => confirmDecision(i, "Approve", "This records your decision and doesn't send money. Payment can only go to the address in the vendor master."), "primary", "check", {
      disabled: !i.canApprove || i.decision?.action === "Approved",
      title: i.canApprove ? null : "Fix the underlying problem first",
    }));
  }
  if (open) rows.push(button("Reject", () => confirmDecision(i, "Reject", "The invoice won't be paid. This is recorded in the audit trail."), "danger-ghost", "x", { disabled: i.decision?.action === "Rejected" }));
  if (open && i.source !== "run") {
    rows.push(button("Request clarification", () => openDraft(i), "ghost", "send"));
    rows.push(button("Hold payment", () => confirmDecision(i, "Hold", "Payment stays on hold until someone changes it."), "ghost", "pause", { disabled: i.decision?.action === "Hold" }));
  }
  rows.push(button("View evidence", () => document.getElementById("evidence")?.scrollIntoView({ behavior: "smooth" }), "ghost", "doc"));
  return rows;
}

export function invoiceDetail(id) {
  const i = invoice(id);
  if (!i) return h("div", { class: "page" }, pageHead("Invoice not found"), empty("That invoice doesn't exist", "It may have been removed from the data."), link("#/invoices", "Back to invoices"));
  const blockedApprove = i.needsPerson && !i.canApprove;
  const supplierInfo = i.supplierObj;
  const toneOf = { Verified: "good", Blocked: "bad", "Requires approval": "warn", Pending: "info" }[i.verification];
  const events = i.source === "run" ? [] : timeline(i);

  return h("div", { class: "page" },
    h("a", { class: "back", href: "#/invoices" }, "← Invoices"),
    pageHead(`${i.number}`, `${i.supplierName} · ${tusdm(i.amount)} · due ${date(i.due)}`, h("div", { class: "row gap" }, badge(i.verification), badge(i.paymentStatus))),
    h("div", { class: `verdict ${toneOf}` },
      h("div", { class: "verdict-head" }, icon(toneOf === "good" ? "check" : toneOf === "bad" ? "x" : "clock", 18), h("strong", {}, i.verification)),
      h("p", {}, i.explanation),
      h("p", { class: "tiny" }, "Written from the rule results. An LLM only reads the document and can't change this outcome."),
      i.reasons.length ? h("ul", { class: "reason-list" }, i.reasons.map((code) => h("li", {}, REASONS[code] ?? code, h("code", {}, code)))) : null),
    blockedApprove ? notice(i.lockReason ?? (i.reasons.includes("PAYOUT_ADDRESS_MISMATCH") && supplierInfo?.pendingAddress
      ? "Approval is locked until a person verifies the new payout address on the supplier's profile."
      : "Approval is locked for this invoice because a person can't override this problem. Reject it or ask the supplier for a correction."), "bad") : null,
    h("div", { class: "actions" }, actionsFor(i)),
    card({}, cardHead("Payment path", "Four separate steps. A verified invoice isn't a payment."), stages(i)),
    matching(i) ? card({}, cardHead("Three-way match", "Invoice vs. purchase order vs. goods receipt"), matching(i)) : null,
    h("div", { class: "grid two" },
      card({}, cardHead("Document"), documentPreview(i)),
      h("div", { class: "stack-col" },
        card({}, cardHead("Extracted information", "Read by AI, treated as untrusted"), kv([
          ["Invoice number", i.number], ["Item", i.item], ["Quantity", String(i.qty)], ["Unit price", tusdm(i.unit)],
          ["Total", tusdm(i.amount)], ["From", i.from ?? supplierInfo?.email], ["Reply-To", i.replyTo ?? "None"], ["Stated address", i.statedAddress ? h("span", { class: "mono" }, i.statedAddress) : "None stated"],
        ])),
        card({}, cardHead("Supplier", null, supplierInfo ? link(`#/supplier/${supplierInfo.id}`, "Open profile") : null), supplierInfo
          ? kv([["Name", supplierInfo.name], ["Status", badge(supplierInfo.status)], ["Contact", supplierInfo.contact], ["Vendor master address", h("span", { class: "mono" }, i.approvedAddress)]])
          : h("p", { class: "muted" }, `${i.supplierName} isn't in the vendor master.`)),
        card({}, cardHead("Purchase order and goods receipt"), kv([
          ["Purchase order", i.po ? `${i.po.id}, ${i.po.owner}` : i.poId ?? "None"],
          ["Ordered", i.po ? `${i.po.qty} × ${money(i.po.unit)} tUSDM` : "—"],
          ["Goods receipt", i.gr ? `${i.gr.id}, ${date(i.gr.date)}` : "None"],
          ["Received", i.gr ? `${i.gr.qty} by ${i.gr.by}` : "—"],
        ])),
        card({}, cardHead("Payment details"), kv([
          ["Status", badge(i.paymentStatus)], ["Network", "Cardano Preprod (test)"],
          ["Pays to", i.approvedAddress ? h("span", { class: "mono" }, i.approvedAddress) : "Set by the payer from the vendor master"],
          ["Transaction", i.txHash ? link(`#/tx/${encodeURIComponent(i.id)}`, "View transaction") : "None"],
        ])))),
    card({ id: "evidence" }, cardHead("Checks and transaction history", "Every check the rules ran, in order"),
      events.length ? activityFeed(events) : i.checks.length ? h("ul", { class: "reason-list" }, i.checks.map((c) => h("li", {}, c.name))) : empty("No checks recorded")));
}

export function approvalsPage() {
  const all = invoices().filter((i) => i.needsPerson);
  const approvable = all.filter((i) => i.canApprove);
  const locked = all.filter((i) => !i.canApprove);
  const group = (title, sub, rows) => card({}, cardHead(title, sub), rows.length
    ? h("div", { class: "approvals" }, rows.map((i) => h("article", { class: "approval" },
        h("div", { class: "grow" },
          h("a", { href: `#/invoice/${encodeURIComponent(i.id)}` }, h("strong", {}, `${i.number}: ${i.supplierName}`)),
          h("p", { class: "small muted" }, i.explanation)),
        h("div", { class: "approval-side" }, h("span", { class: "num strong" }, tusdm(i.amount)), h("div", { class: "actions" }, actionsFor(i).slice(0, 3))))))
    : empty("Nothing here", "No invoices are in this group."));
  return h("div", { class: "page" },
    pageHead("Awaiting approval", "Decisions only a person can make. Approving records a decision. It doesn't send money."),
    group("You can decide", "Approve, reject or ask for more information", approvable),
    group("Locked until fixed", "These can only be rejected or sent back, because approval could send money to the wrong place", locked));
}

export function paymentsPage() {
  const rows = invoices().filter(isPaid);
  return h("div", { class: "page" },
    pageHead("Payment history", "Payments recorded against invoices."),
    notice("Rows marked \"Paid (demo)\" are sample data. They were never submitted to Cardano Preprod and have no transaction hash."),
    card({}, table({
      label: "Payment history", rows, initialSort: { key: "paid", dir: "desc" }, emptyText: "No payments yet",
      onRow: (i) => { location.hash = `#/tx/${encodeURIComponent(i.id)}`; },
      columns: [
        { key: "number", label: "Invoice", sort: (i) => i.number, render: (i) => link(`#/invoice/${encodeURIComponent(i.id)}`, i.number) },
        { key: "supplier", label: "Supplier", sort: (i) => i.supplierName, render: (i) => i.supplierName },
        { key: "paid", label: "Paid", sort: (i) => i.paidAt ?? i.date, render: (i) => date(i.paidAt ?? i.date) },
        { key: "amount", label: "Amount", align: "right", sort: (i) => i.amount, render: (i) => money(i.amount) },
        { key: "status", label: "Status", render: (i) => badge(i.paymentStatus) },
      ],
    })));
}

export function documentsPage() {
  const kinds = ["Invoice", "Purchase order", "Goods receipt"];
  return h("div", { class: "page" },
    pageHead("Documents", "Upload invoices, purchase orders and goods receipts."),
    notice("Prototype: only the file name and size are recorded in this browser. Files aren't uploaded or read until the inbox is connected.", "info"),
    h("div", { class: "grid three" }, kinds.map((kind) => card({ class: "drop" },
      icon("upload", 20), h("strong", {}, kind),
      h("label", { class: "btn ghost small" }, "Choose files", h("input", { type: "file", multiple: true, class: "sr", "aria-label": `Upload ${kind}`, onchange: (e) => { addDocuments([...e.target.files], kind); toast(`${e.target.files.length} added`); } }))))),
    card({}, cardHead("Added documents"), table({
      label: "Documents", rows: state.documents, emptyText: "No documents added yet",
      columns: [
        { key: "name", label: "File", render: (d) => d.name },
        { key: "kind", label: "Type", render: (d) => d.kind },
        { key: "size", label: "Size", align: "right", render: (d) => `${Math.ceil(d.size / 1024)} KB` },
        { key: "at", label: "Added", render: (d) => when(d.at) },
        { key: "status", label: "Status", render: () => "Queued, not processed" },
      ],
    })));
}
