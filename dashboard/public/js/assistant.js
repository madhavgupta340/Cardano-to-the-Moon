// Finance assistant. It answers from dashboard data with plain logic: no LLM is connected.
// It only reads, so it has no way to approve, change limits or pay.
import { TODAY } from "./data.js";
import { attention, invoices, isDueSoon, isPaid, payments, riskOf, thisMonth } from "./store.js";
import { SUPPLIERS } from "./data.js";
import { button, h, icon, tusdm } from "./ui.js";

const invoiceLink = (i) => ({ label: `${i.number}: ${i.supplierName}, ${tusdm(i.amount)}`, href: `#/invoice/${i.id}` });

export const SUGGESTIONS = [
  "How much did we pay suppliers this month?",
  "Which invoices are waiting for approval?",
  "Why was invoice INV-1048 blocked?",
  "Show me suspicious supplier activity.",
  "Which payments are due this week?",
  "Summarise today's financial activity.",
];

export function answer(question) {
  const q = question.toLowerCase();
  const all = invoices();

  if (/\b(approve|pay|execute|release|send|override|bypass)\b/.test(q) && /\b(it|this|invoice|inv-|now|all|for me)\b/.test(q) && !/\b(how much|did we|which|waiting)\b/.test(q)) {
    return { text: "I can't approve or pay anything. Those decisions go through the rules and a person with the right permissions. I can take you to the approval centre.", links: [{ label: "Open approval centre", href: "#/approvals" }] };
  }

  const ref = q.match(/(inv-\d+(?:-b)?|nt-\d+)/i);
  if (ref) {
    const hit = all.find((i) => i.id.toLowerCase() === ref[1] || i.number.toLowerCase() === ref[1]);
    if (!hit) return { text: `I can't find ${ref[1].toUpperCase()} in the current data.`, links: [{ label: "All invoices", href: "#/invoices" }] };
    const same = all.filter((i) => i.number === hit.number);
    const target = same.find((i) => i.needsPerson) ?? hit;
    const note = /why|block/.test(q) && target.verification !== "Blocked" ? `${target.number} isn't blocked. Its status is ${target.verification}. ` : "";
    return { text: `${note}${target.explanation}`, links: [invoiceLink(target)] };
  }

  if (/approval|approve|waiting/.test(q)) {
    const list = all.filter((i) => i.needsPerson && i.verification === "Requires approval");
    return { text: list.length ? `${list.length} invoices are waiting for approval, worth ${tusdm(sum(list))}.` : "Nothing is waiting for approval.", links: [...list.map(invoiceLink), { label: "Open approval centre", href: "#/approvals" }] };
  }

  if (/how much|paid|pay suppliers|spent|spend/.test(q)) {
    const rows = payments().filter((p) => p.month === thisMonth());
    const value = rows.reduce((n, p) => n + p.amount, 0);
    const count = all.filter((i) => isPaid(i) && i.paidAt?.startsWith(thisMonth())).length;
    return { text: `In this demo data, ${tusdm(value)} is recorded as paid this month across ${count} invoices. These are demo payments, not on-chain transactions.`, links: [{ label: "Payment history", href: "#/payments" }] };
  }

  if (/suspicious|risk|fraud|unusual/.test(q)) {
    const flagged = SUPPLIERS.map((s) => ({ s, r: riskOf(s) })).filter((x) => x.r.level !== "Low");
    const unknown = all.filter((i) => i.reasons.includes("UNKNOWN_VENDOR"));
    const lines = flagged.map((x) => `${x.s.name}: ${x.r.risks.map((r) => r.text.toLowerCase()).join("; ")}.`);
    if (unknown.length) lines.push(`${unknown[0].supplierName} sent an invoice but isn't in the vendor master.`);
    return { text: lines.join(" ") || "No suspicious activity right now.", links: [{ label: "Supplier risk", href: "#/suppliers/risk" }, ...flagged.map((x) => ({ label: x.s.name, href: `#/supplier/${x.s.id}` }))] };
  }

  if (/due|this week|upcoming/.test(q)) {
    const list = all.filter((i) => !isPaid(i) && i.paymentStatus !== "Rejected" && isDueSoon(i, 7)).sort((a, b) => a.due.localeCompare(b.due));
    return { text: list.length ? `${list.length} open invoices are due within 7 days, worth ${tusdm(sum(list))}. Some are held, so being due doesn't make them payable.` : "Nothing is due in the next 7 days.", links: list.map(invoiceLink) };
  }

  if (/summar|today|overview/.test(q)) {
    const today = all.filter((i) => i.date === TODAY);
    const open = attention();
    return {
      text: `${today.length} invoices arrived today. ${all.filter((i) => i.verification === "Blocked" && i.needsPerson).length} are blocked and ${all.filter((i) => i.paymentStatus === "Ready").length} are ready for payment. ${open.length ? `Top item: ${open[0].text}.` : "Nothing needs your attention."}`,
      links: open.slice(0, 3).map((a) => ({ label: a.text, href: a.href })),
    };
  }

  return { text: "I can answer questions about payments, approvals, a specific invoice, supplier risk, due dates or today's summary.", links: [], suggest: true };
}

const sum = (list) => list.reduce((n, i) => n + i.amount, 0);

export function assistantPanel() {
  const log = h("div", { class: "chat-log", "aria-live": "polite" });
  const suggestions = h("div", { class: "chips" }, SUGGESTIONS.map((text) =>
    h("button", { type: "button", class: "chip", onclick: () => ask(text) }, text)));

  const add = (cls, ...kids) => {
    log.append(h("div", { class: `msg ${cls}` }, kids));
    log.scrollTop = log.scrollHeight;
  };

  function ask(text) {
    const question = text.trim();
    if (!question) return;
    add("me", question);
    const reply = answer(question);
    add("them", h("p", {}, reply.text),
      reply.links.length ? h("div", { class: "msg-links" }, reply.links.map((l) => h("a", { href: l.href }, l.label))) : null);
  }

  const input = h("input", { type: "text", placeholder: "Ask about your finances", "aria-label": "Ask the assistant" });
  const panel = h("aside", { class: "assistant", id: "assistant", "aria-label": "Finance assistant", hidden: true },
    h("div", { class: "assistant-head" },
      h("div", {}, h("strong", {}, "Finance assistant"), h("p", { class: "muted small" }, "Answers from dashboard data. It can't approve or pay.")),
      h("button", { type: "button", class: "icon-btn", "aria-label": "Close assistant", onclick: () => toggle(false) }, icon("x"))),
    log,
    suggestions,
    h("form", { class: "chat-form", onsubmit: (e) => { e.preventDefault(); ask(input.value); input.value = ""; } },
      input, button("Ask", null, "primary small", null, { type: "submit" })));

  const fab = h("button", { type: "button", class: "fab", "aria-label": "Open finance assistant", onclick: () => toggle(true) }, icon("spark", 18), h("span", {}, "Ask"));

  function toggle(open) {
    panel.hidden = !open;
    fab.hidden = open;
    if (open) input.focus();
  }
  window.addEventListener("clearline:ask", (e) => { toggle(true); ask(e.detail); });
  return [panel, fab];
}
