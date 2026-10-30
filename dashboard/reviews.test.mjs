import assert from "node:assert/strict";
import { test } from "node:test";
import { approvalBlock, buildReview } from "./reviews.mjs";

const vendors = [{ id: "v1", payoutAddress: "VENDOR_MASTER_ADDRESS" }];
const held = (decision = {}) => ({
  candidate: { statedPayoutAddress: "ATTACKER_ADDRESS" },
  decision: { vendorId: "v1", reasons: ["AMOUNT_MISMATCH"], ...decision },
  payment: { status: "HELD" },
});

test("an approval pays the vendor master address, never the invoice's", () => {
  const invoice = held();
  assert.equal(approvalBlock(invoice, vendors), null);
  const review = buildReview(invoice, "APPROVED", vendors);
  assert.equal(review.payoutAddress, "VENDOR_MASTER_ADDRESS");
  assert.equal(JSON.stringify(review).includes("ATTACKER_ADDRESS"), false);
});

test("a changed payout address can't be approved", () => {
  assert.match(approvalBlock(held({ reasons: ["PAYOUT_ADDRESS_MISMATCH"] }), vendors), /different payout address/);
});

test("a vendor outside the vendor master can't be approved", () => {
  assert.match(approvalBlock(held({ vendorId: "unknown" }), vendors), /isn't in the vendor master/);
  assert.match(approvalBlock(held({ vendorId: null }), vendors), /isn't in the vendor master/);
  assert.match(approvalBlock(held(), []), /isn't in the vendor master/);
});

test("only held invoices can be reviewed", () => {
  assert.match(approvalBlock({ ...held(), payment: { status: "PAID" } }, vendors), /Only held/);
});

test("a rejection records no address", () => {
  assert.equal("payoutAddress" in buildReview(held(), "REJECTED", vendors), false);
});
