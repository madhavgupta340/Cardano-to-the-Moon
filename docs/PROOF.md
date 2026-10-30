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

Follow-up comment on the same Task: user comment event `01a18d29-129b-726a-8e5e-71eb5e6d72bb` at 14:14:01 UTC, Coworker reply event `01a18d2b-8e6d-71cb-9997-96e03d3ece83` at 14:16:44 UTC. Both read back with `sokosumi --preprod tasks events`.

Setup note: with Sokosumi CLI 1.0.4, every `--personal` command failed on Preprod with `404 route_not_found` for `GET /v1/users/me/workspace-access`. Personal access was granted on the website (Coworker early access, User recipient), and the Task was created with `tasks create` without `--personal`.

## Seller receipt checks

| Date and time | Task ID | Net amount received | Checked by |
| --- | --- | --- | --- |
