# Synthetic checker data

Run `node data/generate.mjs` to reproduce the six emails, embedded PDFs, ERP JSON and expected candidates. No account identifiers or usable wallets are present. All domains use `.example`. Amounts are integer minor units of tUSDM (1000000 = 1 tUSDM).

Samples: clean; price and quantity mismatch; unknown PO; duplicate invoice; payout redirection plus lookalike sender, different Reply-To and urgency; hidden instructions in white PDF text. The last PDF deliberately contains malicious instructions as test data.

`fixtures/checker-cases.json` contains manually specified expected extraction and decision results. It is test data, not model evidence. `fixtures/run.sample.json` is the original illustrative dashboard contract fixture, not a payment receipt.

ERP consumers load `vendors.json`, `purchase-orders.json`, `goods-receipts.json` as arrays under `vendors`, `purchaseOrders`, `goodsReceipts`, and spread `policy.json` into the same object. The checker requires a unique vendor, PO and receipt, exact line matching, a hard limit and an explicit processed-invoice list. Partial deliveries and multiple receipts are held for review in this demo.
