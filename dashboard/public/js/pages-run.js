// Run overview for the demo: one agent run, straight from runs/*.json or the sample file.
import { REASONS } from "./rules.js";
import { isRealHash, reviewRunInvoice, runtime } from "./store.js";
import { badge, button, card, cardHead, empty, h, icon, modal, notice, pageHead, toast, tusdm, when } from "./ui.js";

const EXPLORER = "https://preprod.cardanoscan.io/transaction/";
let selected = null;

const amountOf = (i) => (i.payment.amount ?? i.candidate.total ?? 0) / 1e6;
const sum = (list) => list.reduce((n, i) => n + amountOf(i), 0);
const nameOf = (i) => i.candidate.vendorName ?? "Unknown vendor";
const numberOf = (i) => i.candidate.invoiceNumber ?? "No invoice number";

function txCell(hash) {
  if (isRealHash(hash)) {
    return h("a", { class: "btn small", href: `${EXPLORER}${hash}`, target: "_blank", rel: "noreferrer" }, icon("link", 14), `View on explorer: ${hash.slice(0, 8)}…${hash.slice(-6)}`);
  }
  return h("span", { class: "muted small" }, "Placeholder hash, so no explorer link");
}

function paidCard(i) {
  return h("article", { class: "run-row" },
    h("div", { class: "grow" }, h("strong", {}, numberOf(i)), h("div", { class: "muted small" }, nameOf(i))),
    h("span", { class: "num strong" }, tusdm(amountOf(i))),
    badge("Paid"),
    h("div", { class: "run-tx" }, txCell(i.payment.txHash)));
}

function evidence(i) {
  const c = i.candidate;
  return h("details", { class: "run-evidence" }, h("summary", { class: "small muted" }, "Evidence from the email (untrusted)"),
    h("dl", { class: "kv" },
      h("dt", {}, "From"), h("dd", {}, c.headers.from),
      h("dt", {}, "Reply-To"), h("dd", {}, c.headers.replyTo ?? "None"),
      h("dt", {}, "PO"), h("dd", {}, c.poNumber ?? "None"),
      h("dt", {}, "Stated address"), h("dd", { class: "mono" }, c.statedPayoutAddress ?? "None"),
      h("dt", {}, "Email says"), h("dd", {}, c.bodySignals.join("; ") || "Nothing unusual"),
      h("dt", {}, "Source"), h("dd", {}, c.sourceFile)));
}

function confirm(runId, i, action) {
  const key = i.decision.invoiceKey;
  const approving = action === "APPROVED";
  modal(`${approving ? "Approve" : "Reject"} ${numberOf(i)}`,
    h("p", {}, approving
      ? "This records your decision and sends nothing. Any later payment can only go to the vendor master address, never one from the invoice."
      : "This records that the invoice shouldn't be paid."),
    (close) => [
      button("Cancel", close, "ghost"),
      button(approving ? "Approve" : "Reject", async () => {
        close();
        const result = await reviewRunInvoice(runId, key, action);
        toast(result.error ?? `${numberOf(i)}: decision saved`, result.error ? "bad" : "good");
      }, approving ? "primary" : "danger"),
    ]);
}

function flaggedCard(runId, i) {
  const key = i.decision.invoiceKey;
  const review = runtime.reviews[runId]?.[key];
  const lock = runtime.locks[runId]?.[key];
  const status = review ? (review.action === "APPROVED" ? "Approved, not paid" : "Rejected") : "Held";
  return h("article", { class: "run-flag" },
    h("div", { class: "run-row bare" },
      h("div", { class: "grow" }, h("strong", {}, numberOf(i)), h("div", { class: "muted small" }, nameOf(i))),
      h("span", { class: "num strong" }, tusdm(amountOf(i))),
      badge(status)),
    h("ul", { class: "reason-list" }, i.decision.reasons.map((code) =>
      h("li", {}, REASONS[code] ?? code, h("code", {}, code)))),
    review
      ? h("p", { class: "small muted" }, `Decision saved ${when(review.reviewedAt)}.`, review.payoutAddress ? ` Any payment goes to the vendor master address: ${review.payoutAddress}` : "")
      : h("div", { class: "actions" },
          button("Approve", () => confirm(runId, i, "APPROVED"), "primary", "check", { disabled: !!lock, title: lock }),
          button("Reject", () => confirm(runId, i, "REJECTED"), "danger-ghost", "x")),
    !review && lock ? h("p", { class: "small lock-note" }, icon("shield", 14), lock) : null,
    evidence(i));
}

function unclearCard(i) {
  const failed = i.payment.status === "FAILED";
  return h("article", { class: "run-flag" },
    h("div", { class: "run-row bare" },
      h("div", { class: "grow" }, h("strong", {}, numberOf(i)), h("div", { class: "muted small" }, nameOf(i))),
      h("span", { class: "num strong" }, tusdm(amountOf(i))),
      badge(failed ? "Failed" : "Unclear")),
    h("p", { class: "small" }, "Check the chain before anyone retries, so this isn't paid twice."));
}

const tile = (value, label) => h("div", { class: "card stat-card" }, h("div", { class: "stat" }, h("span", { class: "muted small" }, label), h("strong", { class: "num" }, value)));

export function runPage() {
  if (runtime.runError) return h("div", { class: "page" }, pageHead("Run overview"), notice(`Couldn't load runs: ${runtime.runError}`, "bad"));
  if (!runtime.loaded) return h("div", { class: "page" }, pageHead("Run overview"), h("div", { class: "skeleton tall" }));
  const entries = runtime.rawRuns;
  if (entries.length === 0) return h("div", { class: "page" }, pageHead("Run overview"), empty("No runs yet"));
  const entry = entries.find((e) => e.run.runId === selected) ?? entries[0];
  const { run, sample } = entry;
  const byStatus = (...statuses) => run.invoices.filter((i) => statuses.includes(i.payment.status));
  const paid = byStatus("PAID");
  const held = byStatus("HELD");
  const unclear = byStatus("ATTEMPTED", "FAILED");
  const reviews = runtime.reviews[run.runId] ?? {};
  const open = held.filter((i) => !reviews[i.decision.invoiceKey]).length + unclear.length;

  return h("div", { class: "page" },
    pageHead("Run overview", `${run.runId} · ${when(run.createdAt)} · Cardano Preprod (test)`,
      entries.length > 1 ? h("label", { class: "field" }, "Run ", h("select", {
        class: "plain-select",
        onchange: (e) => { selected = e.target.value; window.dispatchEvent(new Event("veridano:render")); },
      }, entries.map((e) => h("option", { value: e.run.runId, selected: e.run.runId === run.runId }, e.run.runId)))) : null),
    sample ? notice("Sample data from data/fixtures/run.sample.json. No real run exists yet, and nothing here happened on chain.") : null,
    h("div", { class: "grid kpis" },
      tile(String(run.invoices.length), "Invoices checked"),
      tile(tusdm(sum(paid)), `Paid (${paid.length})`),
      tile(tusdm(sum(held)), `Held (${held.length})`),
      tile(String(open), "Need a person")),
    unclear.length ? card({}, cardHead("Unclear payments", "Don't retry these without checking"), unclear.map(unclearCard)) : null,
    card({}, cardHead("Flagged invoices", "Held for a person, with the reason codes"), held.length ? held.map((i) => flaggedCard(run.runId, i)) : empty("Nothing flagged in this run")),
    card({}, cardHead("Paid invoices", "Passed every check"), paid.length ? paid.map(paidCard) : empty("Nothing paid in this run")));
}
