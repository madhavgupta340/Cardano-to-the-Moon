# Checker integration

```js
import { extractInvoice } from './src/extract-invoice.mjs';
import { evaluate } from './src/rules/index.mjs';
const candidate = await extractInvoice(emlPath);
const decision = evaluate(candidate, erp);
```

Load ERP arrays and policy as described in `data/README.md`. The evaluator is pure, never reads an environment variable, and never carries a payout address. FLAG always has a null approved amount. Payment code must re-read the approved destination from the trusted vendor master, persist attempts before sending, and include prior/uncertain attempts in `processedInvoiceKeys`. Invoice keys are `vendorId:invoiceNumber`; invoice-number variants compare case-insensitively against prior keys. This checker requires a full exact PO/receipt match; split invoices and partial deliveries are held.

Extraction uses the existing pinned AI SDK and the existing `ZAI_API_KEY`, `ZAI_BASE_URL`, `ZAI_MODEL` environment interface. No credentials are loaded or printed by the module. The model receives the body and decoded PDF text, never ERP records, wallets or tools. Header parsing and red-flag scanning happen in code, outside the model. A provider timeout, unavailable configuration, unsupported currency or malformed result returns a candidate with `EXTRACTION_FAILED`.

Dependency-free demo scope: one plain-text body and one base64 PDF attachment in multipart/mixed; simple ASCII mailbox headers (optional display names and folding); UTF-8/ASCII plain text; the generator's uncompressed single-page Helvetica PDF layout. Duplicate headers, nested MIME, HTML, quoted-printable, multiple attachments, image-only, compressed or encrypted PDFs are held. The limited PDF parser intentionally accepts only the generator's grammar. Add a maintained MIME/PDF library in a separately approved dependency PR before broadening input support.

The six end-to-end local tests inject a controlled model response. They verify MIME/PDF transport, code-owned headers/signals and deterministic decisions, not a live model's extraction accuracy. LLM extraction can still omit or misread facts; the demo must not be represented as production fraud prevention. `src/contracts.mjs` is unchanged.
