// Decides whether a person may approve a held invoice, and what an approval records.
// The only payout address that can ever appear in a review comes from the vendor master.

export function approvalBlock({ decision, payment }, vendors) {
  if (payment.status !== "HELD") return "Only held invoices can be reviewed.";
  const vendor = vendors.find((v) => v.id === decision.vendorId);
  if (!vendor?.payoutAddress) return "This vendor isn't in the vendor master, so there is no approved address to pay.";
  if (decision.reasons.includes("PAYOUT_ADDRESS_MISMATCH")) {
    return "The invoice asks for a different payout address than the vendor master. Reject it and check with the vendor through a known contact.";
  }
  return null;
}

export function buildReview(invoice, action, vendors, now = new Date()) {
  const reviewedAt = now.toISOString();
  if (action === "REJECTED") return { action, reviewedAt };
  const vendor = vendors.find((v) => v.id === invoice.decision.vendorId);
  return { action, reviewedAt, vendorId: vendor.id, payoutAddress: vendor.payoutAddress };
}
