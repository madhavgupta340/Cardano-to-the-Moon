# Cardano to the Moon

An invoice agent for finance teams, built for the Agentic Commerce on Cardano track at the TUM Blockchain & AI Hackathon.

A customer hires the agent on Sokosumi to check a batch of supplier invoices received by email. It checks each one against company records, pays the ones that pass through x402 on Cardano preprod, and holds suspicious ones for a person.

**Status: in development.** See `docs/PROOF.md` for what has actually run.

## Start here

| Read | For |
| --- | --- |
| [docs/PLAN.md](docs/PLAN.md) | Idea, safety rules, branch briefs and timeline |
| [docs/SUBMISSION.md](docs/SUBMISSION.md) | Slides, video and Devfolio brief |
| [docs/MASUMI-SETUP.md](docs/MASUMI-SETUP.md) | Masumi and Sokosumi setup, from the quickstart template |
| [docs/PROOF.md](docs/PROOF.md) | Task IDs and transaction hashes |
| [AGENTS.md](AGENTS.md) | Rules for coding agents |

## Run it

Requires Node.js 24.

```sh
npm ci
cp .env.example .env
npm test
```

Agent and worker commands are in `docs/MASUMI-SETUP.md`. Full run commands will be added here as each part lands.

## Limits

- Invoices are synthetic, and everything runs on Cardano preprod.
- The supplier's x402 endpoint is a mock we run ourselves.
- `npm audit` reports findings in the pinned template dependencies. Review them before any public deployment.

Built from the [Masumi TUM hackathon quickstart](https://github.com/masumi-network/tum-hackathon-quickstart).
