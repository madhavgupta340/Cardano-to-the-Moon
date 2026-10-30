import { mkdir, readdir, readFile, rename, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { PaymentRecord, Run } from './contracts.mjs';
import { extractInvoice } from './extract-invoice.mjs';
import { evaluate } from './rules/index.mjs';

// Payment statuses that block another payment for the same invoice key.
// ATTEMPTED means the outcome is unknown, so it stays held for a person to check.
const BLOCKING = new Set(['ATTEMPTED', 'PAID']);

export async function loadErp(dir = 'data/erp') {
  const read = async name => JSON.parse(await readFile(join(dir, name), 'utf8'));
  return {
    vendors: await read('vendors.json'),
    purchaseOrders: await read('purchase-orders.json'),
    goodsReceipts: await read('goods-receipts.json'),
    ...(await read('policy.json')),
  };
}

/** Invoice keys with a PAID or uncertain ATTEMPTED payment in any earlier run. */
export async function priorPaymentKeys(runsDir = 'runs') {
  let files;
  try { files = await readdir(runsDir); } catch (e) { if (e.code === 'ENOENT') return []; throw e; }
  const keys = [];
  for (const file of files.filter(f => f.endsWith('.json'))) {
    // An unreadable run file could hide a payment, so it stops the batch.
    const run = Run.parse(JSON.parse(await readFile(join(runsDir, file), 'utf8')));
    for (const { payment } of run.invoices) if (BLOCKING.has(payment.status)) keys.push(payment.invoiceKey);
  }
  return keys;
}

/** Placeholder until the x402 payer is merged: never sends, so nothing is marked paid. */
export async function stubPay(decision) {
  return { invoiceKey: decision.invoiceKey, status: 'HELD', amount: decision.approvedAmount, txHash: null };
}

async function save(path, run) {
  const tmp = `${path}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(Run.parse(run), null, 2) + '\n', { mode: 0o600 });
  await rename(tmp, path);
}

function settle(decision, result) {
  const parsed = PaymentRecord.safeParse(result);
  // Anything the payer cannot account for exactly stays as an uncertain attempt.
  if (!parsed.success || parsed.data.invoiceKey !== decision.invoiceKey || parsed.data.status === 'ATTEMPTED') return null;
  if (parsed.data.status === 'PAID' && parsed.data.amount !== decision.approvedAmount) return null;
  return parsed.data;
}

/**
 * Checks each email, pays only PASS decisions and writes runs/<runId>.json after every step.
 * The attempt is saved before the payer is called, so a crash never hides a send.
 */
export async function runBatch(emlPaths, {
  extract = extractInvoice, pay = stubPay, erp, runsDir = 'runs',
  runId = `run-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`,
  now = () => new Date(),
} = {}) {
  if (!Array.isArray(emlPaths) || !emlPaths.length) throw new Error('runBatch needs at least one .eml path');
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(runId)) throw new Error('runId must be a simple file name');
  const records = erp ?? await loadErp();
  await mkdir(runsDir, { recursive: true, mode: 0o700 });
  const path = join(runsDir, `${runId}.json`);
  // Overwriting a run could erase a recorded payment attempt.
  if ((await readdir(runsDir)).includes(`${runId}.json`)) throw new Error(`Run ${runId} already exists; inspect it before retrying`);
  const processed = [...records.processedInvoiceKeys, ...await priorPaymentKeys(runsDir)];
  const run = { runId, createdAt: now().toISOString(), invoices: [] };
  for (const emlPath of emlPaths) {
    const candidate = await extract(emlPath);
    const decision = evaluate(candidate, { ...records, processedInvoiceKeys: processed });
    const entry = { candidate, decision, payment: { invoiceKey: decision.invoiceKey, status: 'HELD', amount: null, txHash: null } };
    run.invoices.push(entry);
    if (decision.result === 'PASS') {
      entry.payment = { invoiceKey: decision.invoiceKey, status: 'ATTEMPTED', amount: decision.approvedAmount, txHash: null };
      processed.push(decision.invoiceKey);
      await save(path, run);
      try { entry.payment = settle(decision, await pay(decision)) ?? entry.payment; } catch { /* stays ATTEMPTED */ }
    }
    await save(path, run);
  }
  return { run, path };
}
