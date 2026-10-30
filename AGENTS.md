# TUM hackathon starter

Use and adapt this existing application as a template. Keep its working paths when you change the agent's purpose.
Read README.md and the affected source before edits. Keep dependency versions pinned unless the user requests an upgrade.
Run `npm test` after behavior changes. Add a regression test only when it catches a named bug.

Create fresh dedicated account resources, a payment database, and wallets for each project.
Never copy another project's Coworker, Vendor, wallet, registration, or task identifiers.
Read current `sokosumi skills` and command help before provisioning. Use supported credential interfaces. Never inspect the credential vault.
Keep credentials in private environment files or the supported CLI vault. Keep generated state under ignored paths.
Do not commit `.env`, `.local/`, runtime JSON, private logs, seeds, or credentials.
Require the participant's `AGENT_AUTHOR` before agent registration.

Get user authorization before external writes, resource creation, funds transfers, publishing, or deployment.
Do not claim live execution, registration, or seller payment without measured evidence.

# Team rules

Read `docs/PLAN.md` first. It has the idea, safety rules, branch owners and timeline.
Stay inside the folders your branch owns. Merge small pull requests to `main` often.
`src/contracts.mjs` is shared: adding a field is fine, but renaming or removing one needs agreement from whoever reads it.
Root `npm test` runs only root `*.test.mjs` files. Add new test paths to the `test` script when you add tests elsewhere.
The repo goes public before the deadline, so no secret may reach any branch, even temporarily.
