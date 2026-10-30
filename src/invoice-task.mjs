import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { runBatch as defaultRunBatch } from './run-batch.mjs';

const EMAILS = 'data/emails';

/**
 * Picks sample emails named in the Task text, or all of them.
 * The Task text is untrusted, so it can only select from this folder by exact file name.
 */
export function selectEmails(text, dir = EMAILS) {
  const all = readdirSync(dir).filter(f => f.endsWith('.eml')).sort();
  const named = all.filter(f => text.includes(f) || text.includes(f.slice(0, -4)));
  return (named.length ? named : all).map(f => join(dir, f));
}

const money = amount => amount === null ? '-' : `${(amount / 1e6).toFixed(2)} tUSDM`;

/** Deterministic report built only from the saved Run, so the model cannot change a result. */
export function summarize(run) {
  const rows = run.invoices.map(({ candidate, decision, payment }) =>
    `| ${candidate.sourceFile.split('/').pop()} | ${candidate.invoiceNumber ?? '-'} | ${decision.result} | ${decision.reasons.join(', ') || '-'} | ${payment.status} | ${money(payment.amount)} | ${payment.txHash ?? '-'} |`);
  const passed = run.invoices.filter(i => i.decision.result === 'PASS').length;
  return [
    `Invoice batch ${run.runId}: ${run.invoices.length} checked, ${passed} passed, ${run.invoices.length - passed} held for review.`,
    '',
    '| File | Invoice | Result | Reasons | Payment | Amount | Transaction |',
    '| --- | --- | --- | --- | --- | --- | --- |',
    ...rows,
  ].join('\n');
}

/**
 * Drop-in for client.mjs answer(): runs the batch, then asks the agent to explain it.
 * The explanation's session is the one follow-up comments continue.
 */
export function createInvoiceAnswer({ answer, runBatch = defaultRunBatch, dir = EMAILS }) {
  return async (input, journal, deadline) => {
    const runId = `task-${journal.split('/').pop().replace(/-session\.json$/, '').replace(/[^A-Za-z0-9_-]/g, '')}`;
    const { run } = await runBatch(selectEmails(input, dir), { runId });
    const report = summarize(run);
    const explanation = await answer(`Explain this invoice batch report for the finance team.\n\n${report}\n\nRun JSON:\n${JSON.stringify(run)}`, journal, deadline);
    return `${report}\n\n${explanation}`;
  };
}
