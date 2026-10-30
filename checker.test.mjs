import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { evaluate } from './src/rules/index.mjs';
import { Decision } from './src/contracts.mjs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url)));
const erp = { vendors: read('./data/erp/vendors.json'), purchaseOrders: read('./data/erp/purchase-orders.json'), goodsReceipts: read('./data/erp/goods-receipts.json'), ...read('./data/erp/policy.json') };
const cases = read('./data/fixtures/checker-cases.json');
for (const fixture of cases) test(`fraud regression: ${fixture.name}`, () => {
  const before = JSON.stringify([fixture.candidate, erp]);
  const result = evaluate(fixture.candidate, erp);
  Decision.parse(result);
  assert.equal(result.result, fixture.expected.result);
  assert.deepEqual(result.reasons.sort(), [...fixture.expected.reasons].sort());
  assert.equal(result.approvedAmount, result.result === 'PASS' ? 1000000 : null);
  assert.equal(JSON.stringify([fixture.candidate, erp]), before);
  assert.equal('payoutAddress' in result, false);
});
test('fail-open regression: absent, ambiguous or corrupt evidence never passes', () => {
  const mutations = [
    (c,e) => { c.total = null; }, (c,e) => { c.lineItems = []; },
    (c,e) => { e.goodsReceipts = []; }, (c,e) => { delete e.processedInvoiceKeys; },
    (c,e) => { e.vendors.push(structuredClone(e.vendors[0])); },
    (c,e) => { e.purchaseOrders.push(structuredClone(e.purchaseOrders[0])); },
    (c,e) => { e.goodsReceipts.push(structuredClone(e.goodsReceipts[0])); },
    (c,e) => { c.headers.from = 'a@example.com, b@example.com'; },
    (c,e) => { c.bodySignals = ['unparseable PDF']; },
    (c,e) => { c.lineItems[0].quantity = 0.5; },
    (c,e) => { c.lineItems.push(structuredClone(c.lineItems[0])); },
    (c,e) => { e.maxInvoiceAmount = 1; },
    (c,e) => { c.vendorName = 'Unknown'; },
    (c,e) => { e.goodsReceipts[0].lineItems[0].quantity = 9; },
    (c,e) => { c.headers.replyTo = 'broken'; },
  ];
  for (const mutate of mutations) {
    const c = structuredClone(cases[0].candidate), e = structuredClone(erp); mutate(c,e);
    const result = evaluate(c,e); Decision.parse(result); assert.equal(result.result, 'FLAG'); assert.equal(result.approvedAmount, null);
  }
  for (const c of [undefined, null, {}, { total: NaN }]) assert.equal(evaluate(c, erp).result, 'FLAG');
});
