// Deterministic verification for the demo data: no LLM, network or wallet involved.
// Extracted fields go in, a verification result comes out. The real engine is src/rules/.

export const REASONS = {
  AMOUNT_MISMATCH: "Price or quantity differs from the purchase order or goods receipt",
  NO_MATCHING_PO: "No matching purchase order",
  DUPLICATE_INVOICE: "This invoice number was already received from this supplier",
  PAYOUT_ADDRESS_MISMATCH: "Payout address differs from the vendor master",
  UNKNOWN_VENDOR: "Supplier is not in the vendor master",
  SENDER_DOMAIN_MISMATCH: "Sender domain doesn't match the supplier",
  REPLY_TO_MISMATCH: "Reply-To differs from From",
  URGENCY_LANGUAGE: "Urgency or \"new bank details\" language",
  HIDDEN_INSTRUCTIONS: "Instructions hidden in the document",
  EXTRACTION_FAILED: "The invoice couldn't be read reliably",
  OVER_INVOICE_LIMIT: "Over the automatic payment limit",
  // Dashboard-only codes, not in src/contracts.mjs.
  GOODS_RECEIPT_MISSING: "No goods receipt recorded yet",
  AUTO_APPROVE_OFF: "Automatic approval is switched off",
  SUPPLIER_UNDER_REVIEW: "Supplier isn't on the approved list",
};

const BLOCKING = new Set([
  "AMOUNT_MISMATCH", "DUPLICATE_INVOICE", "PAYOUT_ADDRESS_MISMATCH", "UNKNOWN_VENDOR",
  "SENDER_DOMAIN_MISMATCH", "REPLY_TO_MISMATCH", "HIDDEN_INSTRUCTIONS", "EXTRACTION_FAILED",
]);

// A person can't override these: the facts have to change first.
export const NOT_APPROVABLE = new Set(["DUPLICATE_INVOICE", "PAYOUT_ADDRESS_MISMATCH", "UNKNOWN_VENDOR", "HIDDEN_INSTRUCTIONS"]);

export const total = (inv) => Math.round(inv.qty * inv.unit * 100) / 100;

const domainOf = (email) => email?.split("@")[1] ?? null;

export function evaluate(inv, { suppliers, pos, grs, invoices, limits, perms, confirmedAddresses }) {
  const supplier = suppliers.find((s) => s.id === inv.supplier) ?? null;
  const po = pos.find((p) => p.id === inv.po) ?? null;
  const gr = po ? grs.find((g) => g.po === po.id) ?? null : null;
  const amount = total(inv);
  const reasons = [];
  const checks = [];
  const check = (name, ok, detail, code) => {
    checks.push({ name, ok, detail });
    if (!ok && code) reasons.push(code);
  };

  const approvedAddress = !supplier ? null
    : confirmedAddresses[supplier.id] ? supplier.pendingAddress : supplier.address;

  check("Supplier in vendor master", !!supplier, supplier ? supplier.name : `${inv.vendorName} isn't listed`, "UNKNOWN_VENDOR");
  if (supplier) {
    const stated = inv.statedAddress ?? approvedAddress;
    check("Payout address", stated === approvedAddress,
      stated === approvedAddress ? "Matches the vendor master" : "Invoice states a different address than the vendor master",
      "PAYOUT_ADDRESS_MISMATCH");
    const from = inv.from ?? supplier.email;
    check("Sender domain", domainOf(from) === supplier.domain,
      domainOf(from) === supplier.domain ? `${domainOf(from)} is on file` : `${domainOf(from)} isn't ${supplier.domain}`,
      "SENDER_DOMAIN_MISMATCH");
    if (limits.approvedOnly && supplier.status !== "Verified") {
      check("Approved supplier list", false, `Supplier status is ${supplier.status}`, "SUPPLIER_UNDER_REVIEW");
    }
  }
  if (inv.replyTo) check("Reply-To", false, `Replies go to ${inv.replyTo}`, "REPLY_TO_MISMATCH");

  check("Purchase order", !!po, po ? `${po.id} found` : "No purchase order for this invoice", "NO_MATCHING_PO");
  if (po) {
    const deviation = Math.abs(inv.unit - po.unit) / po.unit * 100;
    const inTolerance = deviation <= limits.deviation;
    check("Unit price", inTolerance,
      deviation === 0 ? "Matches the purchase order"
        : `${deviation.toFixed(1)}% from the purchase order, limit is ${limits.deviation}%`,
      "AMOUNT_MISMATCH");
    if (inTolerance) {
      check("Quantity against order", inv.qty <= po.qty, `${inv.qty} invoiced, ${po.qty} ordered`, "AMOUNT_MISMATCH");
    }
    check("Goods receipt", !!gr, gr ? `${gr.id}, ${gr.qty} received` : "Nothing recorded as received", "GOODS_RECEIPT_MISSING");
    if (gr && gr.qty < inv.qty && !reasons.includes("AMOUNT_MISMATCH")) reasons.push("AMOUNT_MISMATCH");
  }

  const earlier = invoices.find((other) => other.id !== inv.id && other.number === inv.number
    && other.supplier === inv.supplier && other.date < inv.date);
  check("Duplicate check", !earlier, earlier ? `Same number as ${earlier.id}, received ${earlier.date}` : "No earlier invoice with this number", "DUPLICATE_INVOICE");

  if (inv.hidden) check("Hidden instructions", false, "The document contains text aimed at the agent. It was ignored.", "HIDDEN_INSTRUCTIONS");
  if (inv.signals.length) check("Email language", false, "Pressure or changed-details language found", "URGENCY_LANGUAGE");

  check("Automatic payment limit", amount <= limits.maxAuto,
    `${amount.toLocaleString("en")} against a limit of ${limits.maxAuto.toLocaleString("en")} tUSDM`, "OVER_INVOICE_LIMIT");
  if (!perms.autoApprove && reasons.length === 0) reasons.push("AUTO_APPROVE_OFF");

  const blocked = reasons.some((code) => BLOCKING.has(code));
  const verification = inv.pending ? "Pending" : blocked ? "Blocked" : reasons.length ? "Requires approval" : "Verified";

  return {
    verification,
    reasons: inv.pending ? [] : reasons,
    checks: inv.pending ? [] : checks,
    supplierObj: supplier, po, gr, amount, approvedAddress,
    canApprove: !reasons.some((code) => NOT_APPROVABLE.has(code)),
    explanation: explain(verification, reasons, inv, po, gr, amount, limits),
  };
}

function explain(verification, reasons, inv, po, gr, amount, limits) {
  if (verification === "Pending") return "Verification hasn't started. The invoice is still being read.";
  if (verification === "Verified") {
    return `Invoice verified. Supplier, quantity and unit price match ${po.id}, and goods receipt ${gr.id} is confirmed. No duplicate found, and the amount is inside the automatic limit.`;
  }
  const parts = [];
  if (reasons.includes("AMOUNT_MISMATCH") && po) {
    const over = amount - po.qty * po.unit;
    const pct = (over / (po.qty * po.unit) * 100).toFixed(0);
    parts.push(over > 0
      ? `The invoice exceeds the purchase order amount by ${pct}%.`
      : "Price or quantity doesn't match the purchase order.");
  }
  if (reasons.includes("PAYOUT_ADDRESS_MISMATCH")) parts.push("It asks for payment to an address that isn't in the vendor master.");
  if (reasons.includes("DUPLICATE_INVOICE")) parts.push("This invoice number was already received from this supplier.");
  if (reasons.includes("UNKNOWN_VENDOR")) parts.push(`${inv.vendorName} isn't an approved supplier.`);
  if (reasons.includes("SENDER_DOMAIN_MISMATCH")) parts.push("The sender's domain only looks like the supplier's.");
  if (reasons.includes("HIDDEN_INSTRUCTIONS")) parts.push("The document contains hidden instructions aimed at the agent, which had no effect on this result.");
  if (reasons.includes("NO_MATCHING_PO")) parts.push("There is no purchase order behind it.");
  if (reasons.includes("GOODS_RECEIPT_MISSING")) parts.push("Nothing has been recorded as received yet.");
  if (reasons.includes("OVER_INVOICE_LIMIT")) parts.push(`The amount is over the ${limits.maxAuto.toLocaleString("en")} tUSDM automatic limit.`);
  if (reasons.includes("SUPPLIER_UNDER_REVIEW")) parts.push("The supplier is still under review.");
  if (reasons.includes("AUTO_APPROVE_OFF")) parts.push("All checks passed, but automatic approval is switched off.");
  if (parts.length === 0) parts.push("A soft signal needs a person to look at it.");
  const lead = verification === "Blocked" ? "Payment blocked." : "Approval needed.";
  return `${lead} ${parts.join(" ")} Manual review required.`;
}
