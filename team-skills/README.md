# Team agent skills

This folder bundles **all 20 skills** from the two requested sources: Masumi (1) and Cardano Foundation (19), including their reference material and upstream licenses. The two Masumi documentation links point to the same collection.

## Setup for each teammate

After pulling this branch (or main once merged), run from the project root:

```sh
python team-skills/install.py
python team-skills/install.py --check
```

Requires Python 3.9 or newer; on some machines use `python3` or `py -3`. No pip or npm packages are needed, and setup works offline. It verifies archive SHA-256 hashes, extracts the full repositories under ignored `team-skills/.installed/`, and creates ignored discovery wrappers in `.agents/skills/` (Codex) and `.claude/skills/` (Claude Code). Existing differing files are preserved and cause setup to stop. Re-running an unchanged installation is safe. Run again in each checkout; wrappers contain local absolute paths.

Start a new agent session after setup. In Codex, check `/skills`; in Claude Code, check the slash-command menu. Actual discovery depends on the agent client and must be checked on each teammate's machine. Other agents can read the installed `SKILL.md` files directly. Example prompts:

- "Use the masumi skill to help with our Sokosumi integration."
- "Use build-transaction for our Cardano preprod payment."
- "Use debug-transaction to explain this failed transaction."

These are guidance documents, not a running agent or funded wallet. Setup does not run upstream installers, hooks, examples, or account operations. The project's AGENTS.md still governs actions. In particular, this project uses **preprod**, even where upstream examples default to Preview. Never copy example keys, wallets or resource IDs into real configuration.

## Included skills

Masumi: `masumi`, with all ten reference guides for payments, registry, identity, smart contracts, Cardano, MIP-003, Sokosumi, Kodosumi and API debugging.

Cardano: `assess-constitutionality`, `build-transaction`, `cardano-context`, `connect-wallet`, `debug-transaction`, `design-token`, `explain-cip`, `explain-eutxo`, `explain-zk`, `give-feedback`, `governance-guide`, `optimize-validator`, `query-chain`, `review-contract`, `scaffold-project`, `setup-devnet`, `suggest-scalability`, `suggest-tooling`, `write-validator`.

The Cardano archive includes its complete bundled documentation corpus. Keeping the original directory layout preserves each skill's references; wrappers direct agents to read the original file before following relative links. The only extraction omissions are two upstream Unix discovery symlinks, replaced by the portable wrappers. The original archives remain byte-for-byte intact.

## Sources, versions and licensing

- [Masumi documentation](https://www.masumi.network/dev/masumi/documentation/integrations/masumi-skills)
- [Masumi skills](https://github.com/masumi-network/masumi-skills), commit `3eabe4a243dfd3ee326a105736215eeb0d83c787`, MIT license.
- [Cardano Dev Skills](https://github.com/cardano-foundation/cardano-dev-skills), commit `deab0385bc7b6bcddabab0feb363419ee4eb5a27`, Apache-2.0 license. Bundled third-party sources retain their upstream notices and terms.

`sources.json` records the exact source URLs, commits and SHA-256 checksums. The ZIP files are the original GitHub source archives, about 14 MB combined, with licenses and attribution included. Downloaded 2026-10-30. These pinned snapshots do not auto-update. To refresh, review new upstream commits, replace the corresponding archives/checksums and submit a focused PR. Existing differing discovery wrappers require deliberate migration; the installer never silently changes them.
