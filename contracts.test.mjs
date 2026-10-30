import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { Decision, PaymentRecord, Run } from "./src/contracts.mjs";

const sample = () =>
  JSON.parse(readFileSync(new URL("./data/fixtures/run.sample.json", import.meta.url), "utf8"));

test("the sample run matches the contract", () => {
  Run.parse(sample());
});

test("a decision never carries a payout address", () => {
  const { decision } = sample().invoices[0];
  const parsed = Decision.parse({ ...decision, payoutAddress: "addr_test1_from_invoice" });
  assert.equal("payoutAddress" in parsed, false);
});

test("a PASS needs a vendor and an amount", () => {
  const { decision } = sample().invoices[0];
  assert.throws(() => Decision.parse({ ...decision, vendorId: null }));
  assert.throws(() => Decision.parse({ ...decision, approvedAmount: null }));
});

test("a FLAG needs a reason", () => {
  const { decision } = sample().invoices[1];
  assert.throws(() => Decision.parse({ ...decision, reasons: [] }));
});

test("a PAID record needs a transaction hash", () => {
  const { payment } = sample().invoices[0];
  assert.throws(() => PaymentRecord.parse({ ...payment, txHash: null }));
});
