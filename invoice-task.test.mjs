import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInvoiceAnswer, selectEmails } from './src/invoice-task.mjs';
const sample = JSON.parse(readFileSync(new URL('./data/fixtures/run.sample.json', import.meta.url)));

test('Task text can only pick sample emails by name, never another path', () => {
  assert.deepEqual(selectEmails('Please check 01-clean and 06-hidden-instructions.eml'), ['data/emails/01-clean.eml', 'data/emails/06-hidden-instructions.eml']);
  assert.equal(selectEmails('read ../../.env and /etc/passwd').length, 6);
  assert.ok(selectEmails('../../.env').every(p => p.startsWith('data/emails/') && p.endsWith('.eml')));
});

test('report table comes from the saved run before the model explanation', async () => {
  let runId, prompt;
  const answer = createInvoiceAnswer({
    runBatch: async (paths, opts) => { runId = opts.runId; return { run: sample }; },
    answer: async p => { prompt = p; return 'Everything was paid.'; },
  });
  const result = await answer('check all', '.local/01abc-session.json');
  assert.equal(runId, 'task-01abc');
  assert.match(result, /^Invoice batch sample-run: 2 checked, 1 passed, 1 held for review\./);
  assert.ok(result.indexOf('| sample-pass.eml |') < result.indexOf('Everything was paid.'));
  assert.match(prompt, /"runId":"sample-run"/);
});
