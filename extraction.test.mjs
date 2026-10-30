import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { extractInvoice, parseEmail, pdfText } from './src/extract-invoice.mjs';
import { evaluate } from './src/rules/index.mjs';
const read = name => JSON.parse(readFileSync(new URL(name, import.meta.url)));
const cases = read('./data/fixtures/checker-cases.json');
const erp = { vendors: read('./data/erp/vendors.json'), purchaseOrders: read('./data/erp/purchase-orders.json'), goodsReceipts: read('./data/erp/goods-receipts.json'), ...read('./data/erp/policy.json') };
for (const fixture of cases) test(`email to decision regression: ${fixture.name} (stubbed model)`, async () => {
  let called = false;
  const candidate = await extractInvoice(fixture.candidate.sourceFile, { extract: async input => {
    called = true;
    assert.match(input.pdfText, new RegExp(fixture.candidate.invoiceNumber));
    assert.ok(input.body.length);
    // Deliberately omit red flags and forge headers: code must preserve both.
    return { ...fixture.candidate, currency: 'tUSDM', bodySignals: [], headers: { from: 'attacker@forged.example', replyTo: null } };
  } });
  assert.ok(called);
  assert.deepEqual(candidate.headers, fixture.candidate.headers);
  const decision = evaluate(candidate, erp);
  assert.equal(decision.result, fixture.expected.result);
  assert.deepEqual(decision.reasons.sort(), [...fixture.expected.reasons].sort());
});
test('malformed MIME, repeated sender and unsupported PDF cannot be silently accepted', () => {
  const raw = readFileSync('data/emails/01-clean.eml', 'utf8');
  for (const changed of [raw.replace('From:', 'From: second@demo.example\r\nFrom:'), raw.replace('base64', 'quoted-printable'), raw.replace('billing@lunar-stationery.example', 'bad'), raw.replace('multipart/mixed', 'multipart/alternative'), raw.replace(/--synthetic-boundary-0--/, '')]) assert.throws(() => parseEmail(changed));
  const pdf = readFileSync('data/pdfs/01-clean.pdf');
  assert.throws(() => pdfText(Buffer.from(pdf.toString().replace('/Helvetica', '/Unknown'))));
  assert.throws(() => pdfText(Buffer.from(pdf.toString() + 'extra revision')));
});
test('provider errors, malformed JSON fields and currency ambiguity stay held', async () => {
  for (const extract of [async () => { throw new Error('private provider detail'); }, async () => ({}), async () => ({ ...cases[0].candidate, currency: 'EUR' }), async () => ({ ...cases[0].candidate, currency: 'tUSDM', total: '1000000' })]) {
    const candidate = await extractInvoice(cases[0].candidate.sourceFile, { extract });
    assert.equal(evaluate(candidate, erp).result, 'FLAG');
    assert.ok(candidate.bodySignals.includes('EXTRACTION_FAILED'));
    assert.ok(!JSON.stringify(candidate).includes('private provider detail'));
  }
  assert.equal(evaluate(await extractInvoice('data/emails/absent.eml'), erp).result, 'FLAG');
});
