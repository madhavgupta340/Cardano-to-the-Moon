import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Run } from './src/contracts.mjs';
import { loadErp, runBatch } from './src/run-batch.mjs';
const cases = JSON.parse(readFileSync(new URL('./data/fixtures/checker-cases.json', import.meta.url)));
const byFile = new Map(cases.map(c => [c.candidate.sourceFile, c.candidate]));
const extract = async path => structuredClone(byFile.get(path));
const clean = cases[0].candidate.sourceFile;
const tempRuns = () => mkdtempSync(join(tmpdir(), 'runs-'));

test('six sample emails: only the clean invoice reaches the payer, run file matches the contract', async () => {
  const runsDir = tempRuns(), paid = [];
  const pay = async d => { paid.push(d.invoiceKey); return { invoiceKey: d.invoiceKey, status: 'PAID', amount: d.approvedAmount, txHash: 'ab'.repeat(32) }; };
  const { run, path } = await runBatch(cases.map(c => c.candidate.sourceFile), { extract, pay, runsDir, runId: 'six', erp: await loadErp() });
  assert.deepEqual(paid, ['synthetic-stationery:INV-DEMO-01']);
  run.invoices.forEach((inv, i) => {
    assert.equal(inv.decision.result, cases[i].expected.result);
    assert.equal(inv.payment.status, inv.decision.result === 'PASS' ? 'PAID' : 'HELD');
  });
  assert.deepEqual(Run.parse(JSON.parse(readFileSync(path, 'utf8'))), run);
});

test('double payment: attempt is saved before sending, and an uncertain attempt blocks every later payment', async () => {
  const runsDir = tempRuns(), erp = await loadErp();
  let calls = 0;
  const crash = async () => {
    calls++;
    const saved = JSON.parse(readFileSync(join(runsDir, 'first.json'), 'utf8'));
    assert.equal(saved.invoices.at(-1).payment.status, 'ATTEMPTED');
    throw new Error('network dropped after send');
  };
  const first = await runBatch([clean, clean], { extract, pay: crash, runsDir, runId: 'first', erp });
  assert.equal(calls, 1);
  assert.equal(first.run.invoices[0].payment.status, 'ATTEMPTED');
  assert.deepEqual(first.run.invoices[1].decision.reasons, ['DUPLICATE_INVOICE']);
  const second = await runBatch([clean], { extract, pay: crash, runsDir, runId: 'second', erp });
  assert.equal(calls, 1);
  assert.deepEqual(second.run.invoices[0].decision.reasons, ['DUPLICATE_INVOICE']);
});

test('a payer reply that does not match the approved amount is kept as an uncertain attempt', async () => {
  const pay = async d => ({ invoiceKey: d.invoiceKey, status: 'PAID', amount: d.approvedAmount + 1, txHash: 'cd'.repeat(32) });
  const { run } = await runBatch([clean], { extract, pay, runsDir: tempRuns(), runId: 'wrong-amount', erp: await loadErp() });
  assert.equal(run.invoices[0].payment.status, 'ATTEMPTED');
  assert.equal(run.invoices[0].payment.txHash, null);
});
