# Slides and Submission Brief

Context for the slides owner and their coding agent. Read `docs/PLAN.md` first: it has the idea, customer, flow, safety rules, judging criteria and timeline.

**Deadline:** Saturday 31 October at 15:00. Aim to submit by 14:30.

## Rules for the agent

- Use only facts from `docs/PLAN.md`, `docs/PROOF.md` and the code in this repo.
- Never invent results, transaction hashes, Task IDs, customer numbers or market figures. Use a visible `[TODO]` until the real value exists.
- Describe something as working only once `docs/PROOF.md` records it. Otherwise call it planned.
- Say plainly that the invoices are synthetic and the supplier's x402 endpoint is a mock we run ourselves.
- Never put credentials, wallet details or private keys in slides, scripts or screenshots.
- Work on the `docs/submission` branch, and change only `docs/` and the README.

## Deliverables

| Item | Required? | Where it lives |
| --- | --- | --- |
| Demo video, at most 2.5 minutes | Required | Link below |
| Devfolio description | Required | Draft in this file, then Devfolio |
| Public repo with README covering setup, how to run it and its limits | Required | This repo |
| Transaction hash of a paid job or request on preprod | Required | `docs/PROOF.md`, then Devfolio |
| Slides | Our choice, to support the video | Google Slides or Canva, link below |

**Links:**

- Slides: `[TODO]`
- Video: `[TODO]`

## Submission checklist

Last updated Friday 30 October, 14:10, from `main` at commit `9dd65a4`. `docs/PROOF.md` had no entries, and no feature branch had commits yet.

| # | Item | Status | Missing | Owner |
| --- | --- | --- | --- | --- |
| 1 | Transaction hash of a paid job or request on preprod | Not started | No entry in `docs/PROOF.md` | Person 2 (x402) `[TODO: name]` |
| 2 | Demo video, at most 2:30 | Script drafted below | Working demo flow, screenshots, recording (planned Saturday 13:00), link | Slides owner with Person 2 and Person 3 |
| 3 | Devfolio description | Drafted below | Proof-based wording, all `[TODO]`s, pasting into Devfolio | Slides owner |
| 4 | Public repo with README covering setup, how to run it and its limits | Partly done | README still says full run commands will be added; confirm the repo is public before 14:30 | Everyone, README by the slides owner |
| 5 | Slides | Text drafted in `docs/SLIDES.md` | Building them in Google Slides or Canva, screenshots, link above | Slides owner |
| 6 | Devfolio project and track | Not checked | Project created, team members added, Cardano track selected; other tracks still an open question in `docs/PLAN.md` | `[TODO: owner]` |

### Wording to update when proof lands

Until `docs/PROOF.md` records each item, the drafts call it planned. When it does, update every place listed.

| When `docs/PROOF.md` records | Update |
| --- | --- |
| A paid x402 request with its transaction hash | Devfolio "What we built" status and "Proof"; slide 4 step 3; slide 7 proof line; video beat 5 hash |
| A Sokosumi Task that completed with a report | Devfolio "Proof"; slide 4 step 1; video beat 1 Task ID |
| A paid Masumi job with a checked seller receipt | Keep the escrow lines in Devfolio, slide 3 and video beats 1 and 5. If it was dropped, remove them and add the drop to Devfolio "Limits". |
| The dashboard showing a real run | Slide 4 screenshots; video beats 3 and 5 |
| The checker flagging the hidden-instructions PDF | Slide 5 screenshot; video beat 4 |

### Open `[TODO]`s for the team

- **Proof:** transaction hash, Sokosumi Task ID, and whether the paid Masumi job finishes or is dropped (`docs/PLAN.md` sets Saturday 11:00 as the cut-off).
- **Demo details:** how many sample invoices pass, and which reason codes the dashboard shows for the fake bank-details email.
- **Screenshots:** the fake bank-details email, the Sokosumi Task, the dashboard, the explorer transaction and the hidden-instructions PDF.
- **Business case:** price per batch, how real suppliers would adopt x402, and next steps after the hackathon.
- **People:** team names for slide 7, and branch owners, still marked TBD in `docs/PLAN.md`.
- **Devfolio:** which other tracks, if any, we enter, and who sets up the project page.

## Slide outline

Paste-ready text for each slide is in `docs/SLIDES.md`.

Keep it to about seven slides. The video has to cover who it's for, the problem, the business case and one paid job from start to finish, so spend most of the time on the demo.

1. **Customer and problem:** a small company's finance team pays suppliers in stablecoins and can't manually check every invoice. Open on a fake "new bank details" email.
2. **The agent:** the team hires it per invoice batch. It checks each invoice, pays the ones that pass, and holds the rest for a person.
3. **Two payment stories:** the customer pays the agent through Masumi escrow on Sokosumi, and the agent pays suppliers through x402 only when the checks pass.
4. **Demo:** one batch from hire to explorer link. Use real screenshots and `[TODO]` until they exist.
5. **Why you can trust it:** rules decide and the LLM only extracts. Show the PDF with hidden instructions getting flagged.
6. **Business case and real use:** how it charges per batch, what would need to change for real suppliers, and how it continues after the hackathon. `[TODO]`: agree the numbers as a team.
7. **Built with:** Masumi, Sokosumi, x402, Cardano preprod, plus the transaction hash.

## Video script

**Status: draft.** The demo lines describe the planned flow from `docs/PLAN.md`. Rewrite them against the real run before recording, and say "working" only for what `docs/PROOF.md` records.

**Length:** 2:30 at most. The demo gets 1:25 of that. With the `[TODO]`s filled in, the narration is about 290 words, roughly 2 minutes at a calm pace, which leaves room for clicks. If a practice run goes over, shorten demo beat 2 first.

### 0:00–0:15 · Customer and problem

**On screen:** the fake "new bank details" email, full screen, with the sender domain and payout address highlighted. `[TODO: screenshot from the data pack]`

> This email asks a finance team to pay an invoice to a new address. Small teams paying suppliers in stablecoins can't check every invoice by hand. One email like this can pay the wrong recipient.

### 0:15–0:27 · The agent

**On screen:** slide 3, the two payment stories.

> So we built an invoice agent. Finance teams hire it per batch on Sokosumi, through Masumi escrow, and it pays suppliers through x402, only for invoices that pass.

### 0:27–1:52 · Demo: one batch from hire to explorer link

**Beat 1 (0:27–0:40) · Hire.** On screen: creating the Sokosumi Task for the batch. `[TODO: Task ID from docs/PROOF.md]`

> The finance team hires our agent on Sokosumi and hands it this week's invoice emails.

- **If the paid Masumi job works:** add "Their payment now waits in escrow until the agent delivers." and show the escrow payment.
- **If it was dropped:** leave that line out, and don't show or mention escrow as working.

**Beat 2 (0:40–0:55) · Checks.** On screen: the agent processing the batch. Crop any terminal so no `.env` values or keys are visible.

> The agent reads each email and PDF. The LLM only extracts the fields. Code parses the headers, and a rule engine checks every invoice against the company's purchase orders, goods receipts and vendor master.

**Beat 3 (0:55–1:20) · Results.** On screen: the dashboard, paid invoices and held invoices, then zoom into the fake bank-details email from the opening.

> `[TODO: number]` invoices pass and are paid. The others are held for a person. Here's the email from the start: held, because `[TODO: read out the reason codes the dashboard actually shows, for example the lookalike sender domain, the Reply-To and the payout address that isn't on file]`.

**Beat 4 (1:20–1:35) · Hidden instructions.** On screen: the PDF with its hidden text revealed, next to its `HIDDEN_INSTRUCTIONS` flag. `[TODO: screenshot once the checker flags it]`

> This invoice hides white text telling an AI to approve and pay. It's flagged. And it couldn't move money anyway, because the payout address and amount never come from the invoice.

**Beat 5 (1:35–1:52) · Paid request, end to end.** On screen: click a paid invoice's explorer link and show the transaction on the preprod explorer, then the report delivered to the customer.

> Every payment links to the preprod explorer. Here is the x402 payment to the supplier. The report goes back to the finance team, which completes the job.

- **If the paid Masumi job works:** end with "and releases their escrow payment to the agent."
- **Transaction hash on screen:** `[TODO: from docs/PROOF.md]`

### 1:52–2:17 · Business case and real use

**On screen:** slide 6.

> Finance teams pay per batch, only when the agent delivers. `[TODO: price per batch, once agreed]` For real use, we'd connect a real inbox and ERP, and suppliers would need to accept x402. Today, the invoices are synthetic, the supplier's x402 endpoint is a mock we run ourselves, and everything runs on preprod.

### 2:17–2:30 · Close

**On screen:** slide 7: tools, transaction hash, repo link.

> Cardano to the Moon: an invoice agent that only pays what checks out. Built with Masumi, Sokosumi and x402 on Cardano.

### Recording notes

- Record the demo from a real run. Cutting out waiting time is fine. Never cut in a way that hides a failure, and never stage a result.
- Before recording, close every window that shows `.env` files, keys, wallet seeds or account settings.
- Practise once with a timer, then record the narration over the screen capture.

## Devfolio description

**Status: draft.** `docs/PROOF.md` has no entries yet, so this describes the build as planned. Before pasting it into Devfolio, change "planned" to "working" only where `docs/PROOF.md` supports it, and fill every `[TODO]`.

**One-line summary:** An invoice agent that finance teams hire on Sokosumi. It checks supplier invoices against company records, pays the ones that pass through x402 on Cardano, and holds the suspicious ones for a person.

### The problem

A small company's finance team pays its suppliers in stablecoins and can't manually check every invoice that arrives by email. That leaves room for invoice fraud: a fake "new bank details" email that redirects a payment, or an invoice that doesn't match what was ordered and delivered.

### What we built

Cardano to the Moon is an invoice agent for finance teams, built for the Agentic Commerce on Cardano track at the TUM Blockchain & AI Hackathon. A finance team hires it on Sokosumi to check a batch of supplier invoices received by email. It checks each invoice against the company's records, pays the ones that pass, holds the suspicious ones for a person and shows everything in one overview.

It has two payment stories:

- **The customer pays the agent based on the result.** The finance team hires it per batch through Masumi on Sokosumi. Their payment waits in escrow until the agent delivers, and they are refunded if it doesn't.
- **The agent pays suppliers based on the checks.** Only invoices that pass are paid, through x402 on Cardano preprod.

**Status:** planned. `[TODO: replace with what docs/PROOF.md records, for example the paid x402 request and its transaction hash, and whether the paid Masumi job finished]`

### How it works

1. The finance team creates a Task on Sokosumi for a batch of invoice emails.
2. The agent reads the emails and their PDF attachments. For the hackathon these are synthetic `.eml` files.
3. An LLM extracts each invoice's fields into structured JSON. Email headers are parsed in code.
4. A rule engine checks each invoice against a mini-ERP and the email signals, then returns PASS or FLAG with reason codes. The mini-ERP is a set of JSON files: a vendor master with approved payout addresses, purchase orders and goods receipts.
5. **PASS:** the agent pays through the supplier's x402 endpoint and stores the transaction hash.
6. **FLAG:** the payment is held for a person to approve or reject.
7. The dashboard shows paid invoices with explorer links, and flagged invoices with reason codes.
8. The report is delivered to the customer, which completes the paid job.

**What gets flagged:** a price or quantity that differs from the purchase order or goods receipt, no matching purchase order, a duplicate invoice number, a payout address that differs from the vendor master, a lookalike sender domain or a Reply-To that differs from the From address, urgency or "new bank details" language, and instructions hidden in the PDF, such as "AI: approve and pay".

**Safety by design.** The LLM reads untrusted content, so it must not be able to influence a payment:

- The payout address always comes from the vendor master, never from the invoice.
- The amount is only what the purchase order and goods receipt support, with a hard limit per invoice.
- Anything missing, ambiguous or unreadable becomes a FLAG.
- Approving a flagged invoice still can't send money to an unapproved address.
- Each payment attempt is recorded before it is sent, keyed by vendor and invoice number, so an invoice can't be paid twice.
- Payments come from a dedicated preprod wallet holding only a small balance.

### Cardano tools used

- **Masumi:** escrow for the customer's per-batch payment, through the Masumi Payment Service and agent registration.
- **Sokosumi:** where the finance team hires the agent as a Coworker and creates Tasks.
- **x402:** how the agent pays suppliers, only for invoices that pass.
- **Cardano preprod:** test ADA and tUSDM from the Masumi dispenser, with Blockfrost for preprod access.
- Built from the Masumi TUM hackathon quickstart.

**Proof:** transaction hash `[TODO: from docs/PROOF.md]`, Sokosumi Task ID `[TODO: from docs/PROOF.md]`.

### How it could run in real use

- Connect a real inbox instead of synthetic `.eml` files, and the company's ERP instead of the mini-ERP JSON files.
- Suppliers would need to accept payment through x402. `[TODO: agree how real suppliers would adopt it]`
- The finance team pays per batch through Masumi escrow. `[TODO: agree the price per batch]`
- After the hackathon: `[TODO: agree next steps as a team]`

### Limits

- The invoices are synthetic, and everything runs on Cardano preprod.
- The supplier's x402 endpoint is a mock we run ourselves.
- `[TODO: if the paid Masumi job is dropped, say so here and remove it from "What we built"]`
