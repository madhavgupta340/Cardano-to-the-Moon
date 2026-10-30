# Dashboard

Finance dashboard for the invoice agent, owned by the `feat/dashboard` branch. See `docs/PLAN.md`.

## Run it

Requires Node.js 24. From the repo root:

```sh
npm ci
node dashboard/server.mjs
```

Then open http://localhost:4173. Set `PORT` to use another port. There's no build step.

For the demo, open **Run overview** (`#/run`). It shows the newest runs from `runs/`, or `data/fixtures/run.sample.json` if there are none. Run `npm test` in this folder to test the approval rules.

## Approve and Reject

The server saves decisions in `dashboard/.local/reviews.json`, which Git ignores. It refuses Approve if the vendor isn't in `data/erp/vendors.json` or the invoice asks for a different payout address. An approval records the vendor master address, never one from the invoice, and nothing in this folder sends money. `pay()` must read that address from the vendor master too.

## How it's organised

| File | Job |
| --- | --- |
| `server.mjs` | Serves the app, reads `runs/*.json`, stores Approve and Reject decisions |
| `reviews.mjs` | The approval rules, tested in `reviews.test.mjs` |
| `public/js/pages-run.js` | Run overview for the demo |
| `public/js/data.js` | Fictional demo company data |
| `public/js/rules.js` | Deterministic checks for the demo data, separate from AI extraction |
| `public/js/store.js` | The only data layer pages use, so a backend can replace it |
| `public/js/ui.js`, `charts.js` | Shared components and charts |
| `public/js/pages-*.js`, `main.js` | Pages, navigation and routes |
| `public/js/assistant.js` | Finance assistant |

## What's real and what isn't

- **Demo data:** the company, invoices and payments are fictional. Demo payments have no transaction hash and are labelled as not on chain.
- **Real runs:** any valid `runs/*.json` file is validated against `src/contracts.mjs` and listed with the demo invoices. Only real-format, non-placeholder hashes get a Cardanoscan link.
- **Assistant:** it answers from dashboard data with fixed logic. No LLM is connected, and it can only read.
- **Approvals and limits:** these only record decisions, in this browser's storage for demo data and in `dashboard/.local/reviews.json` for real runs. Nothing here can send money.
- **Not connected:** payments, email and document processing. Uploads record only a file's name and size, and supplier messages are never sent.
- **Rules:** `rules.js` exists to drive the demo. The real checker belongs in `src/rules/`.
