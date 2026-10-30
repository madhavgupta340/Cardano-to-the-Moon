# Proof

Record only what actually happened. Never put keys or wallet secrets here.

## x402 paid requests (Cardano preprod)

| Date and time | Request | Result | Transaction hash | Explorer link |
| --- | --- | --- | --- | --- |

## Sokosumi Tasks

| Date and time | Task ID | Workspace | Paid? | Result | Transaction hash |
| --- | --- | --- | --- | --- | --- |
| 2026-10-30 14:13:46 UTC | `01a18d25-4c3b-70fd-969a-d45562e4a35b` | Personal | No (execution-only) | `COMPLETED`, completion event `01a18d28-d6b9-721b-bdaf-f805ea91f47a`; five team-name suggestions from the template instructions | n/a |
| 2026-10-30 14:47:24 UTC | `01a18d47-20f7-7529-9a9c-873d0cf02e8b` | Personal | No (execution-only) | `COMPLETED`, completion event `01a18d47-a3bd-726c-ad09-10685c9e3fd6`; invoice batch of the six sample emails with live Gemini extraction: 01-clean PASS, 02-06 FLAG with the expected reason codes. Payment step was the stub payer, so every payment is `HELD` and no funds moved | n/a |

| 2026-10-30 15:33:13 UTC | `01a18d68-44d5-75ca-aba7-7c257905b5f2` | Personal | Yes, 1 tUSDM via Masumi escrow (Sokosumi charged 100 credits) | `COMPLETED`, completion event `01a18d71-9587-74eb-aab1-95bb5ad28c6c`; invoice batch report (6 checked, 1 passed, 5 held; supplier payer still the stub, so no supplier funds moved) | Escrow lock `388292c06046502df4ca46960033707ae7eee2be40fa05be56fde6835e2e236f` (FundsLocked, confirmed 15:31:18 UTC); result `38e87cd08541c9d070f6d8a6947cac033898099a50e784df3a87bd7460bd0b2e` (ResultSubmitted, confirmed) |

Paid Task links: [escrow lock](https://preprod.cardanoscan.io/transaction/388292c06046502df4ca46960033707ae7eee2be40fa05be56fde6835e2e236f), [result submission](https://preprod.cardanoscan.io/transaction/38e87cd08541c9d070f6d8a6947cac033898099a50e784df3a87bd7460bd0b2e). Agent "Cardano to the Moon Invoice Checker" registered on Preprod, registration transaction [`b97fe7d16c18d655d81b349c568a449e216b90b9a65ba00e984d61b11bcb5ecd`](https://preprod.cardanoscan.io/transaction/b97fe7d16c18d655d81b349c568a449e216b90b9a65ba00e984d61b11bcb5ecd) (`RegistrationConfirmed`). The seller withdrawal unlocks at 16:03:56 UTC; the receipt is recorded below only after it is checked.

Follow-up comment on the same Task: user comment event `01a18d29-129b-726a-8e5e-71eb5e6d72bb` at 14:14:01 UTC, Coworker reply event `01a18d2b-8e6d-71cb-9997-96e03d3ece83` at 14:16:44 UTC. Both read back with `sokosumi --preprod tasks events`.

Setup note: with Sokosumi CLI 1.0.4, every `--personal` command failed on Preprod with `404 route_not_found` for `GET /v1/users/me/workspace-access`. Personal access was granted on the website (Coworker early access, User recipient), and the Task was created with `tasks create` without `--personal`.

## Seller receipt checks

| Date and time | Task ID | Net amount received | Checked by |
| --- | --- | --- | --- |
