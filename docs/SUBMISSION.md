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

## Slide outline

Keep it to about seven slides. The video has to cover who it's for, the problem, the business case and one paid job from start to finish, so spend most of the time on the demo.

1. **Customer and problem:** a small company's finance team pays suppliers in stablecoins and can't manually check every invoice. Open on a fake "new bank details" email.
2. **The agent:** the team hires it per invoice batch. It checks each invoice, pays the ones that pass, and holds the rest for a person.
3. **Two payment stories:** the customer pays the agent through Masumi escrow on Sokosumi, and the agent pays suppliers through x402 only when the checks pass.
4. **Demo:** one batch from hire to explorer link. Use real screenshots and `[TODO]` until they exist.
5. **Why you can trust it:** rules decide and the LLM only extracts. Show the PDF with hidden instructions getting flagged.
6. **Business case and real use:** how it charges per batch, what would need to change for real suppliers, and how it continues after the hackathon. `[TODO]`: agree the numbers as a team.
7. **Built with:** Masumi, Sokosumi, x402, Cardano preprod, plus the transaction hash.

## Video script

`[TODO]`: write once the demo flow runs. Target 2 minutes 30 seconds at most.

## Devfolio description

`[TODO]`: draft these sections.

- The problem
- What we built
- How it works
- Cardano tools used
- How it could run in real use
