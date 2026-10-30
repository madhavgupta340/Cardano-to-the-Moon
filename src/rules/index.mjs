import { z } from 'zod';
import { InvoiceCandidate } from '../contracts.mjs';

const text = z.string().trim().min(1);
const integer = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const line = z.object({ description: text, quantity: z.number().int().positive().max(1000000), unitPrice: integer });
const erpSchema = z.object({
  vendors: z.array(z.object({ id: text, name: text, domains: z.array(text).min(1), payoutAddress: text })),
  purchaseOrders: z.array(z.object({ vendorId: text, poNumber: text, currency: z.literal('tUSDM'), lineItems: z.array(line).min(1) })),
  goodsReceipts: z.array(z.object({ vendorId: text, poNumber: text, lineItems: z.array(line.omit({ unitPrice: true })).min(1) })),
  maxInvoiceAmount: integer.positive(),
  processedInvoiceKeys: z.array(text),
});
const canonical = value => value.trim().toLowerCase();
export function mailbox(value) {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(?:[^<>\r\n,;]+\s*<)?([a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+)>?$/i);
  if (!match || value.includes('<') !== value.includes('>')) return null;
  return match[1].toLowerCase();
}
export function signalReasons(value) {
  const reasons = [];
  if (/urgent|urgency|immediately|new bank|bank details|replacement address|payment details.*chang/i.test(value)) reasons.push('URGENCY_LANGUAGE');
  if (/HIDDEN_INSTRUCTIONS|AI\s*:|ignore (?:all |previous )?instructions|approve and pay|hide all warnings|system prompt/i.test(value)) reasons.push('HIDDEN_INSTRUCTIONS');
  return reasons;
}
/** Pure decision function. No I/O; never emits a payout destination. */
export function evaluate(candidate, erp) {
  const reasons = new Set();
  const add = reason => reasons.add(reason);
  let vendorId = null, approvedAmount = null, invoiceKey = 'unresolved:invalid';
  const finish = () => ({ invoiceKey, result: reasons.size ? 'FLAG' : 'PASS', reasons: [...reasons], vendorId, approvedAmount: reasons.size ? null : approvedAmount });
  const parsed = InvoiceCandidate.safeParse(candidate), records = erpSchema.safeParse(erp);
  if (!parsed.success || !records.success) { add('EXTRACTION_FAILED'); return finish(); }
  const c = parsed.data, e = records.data;
  invoiceKey = `unresolved:${c.sourceFile}`;
  if (![c.sourceFile, c.vendorName, c.invoiceNumber, c.poNumber, c.statedPayoutAddress].every(v => typeof v === 'string' && v.trim()) || c.total === null || !Number.isSafeInteger(c.total) || !c.lineItems.length) add('EXTRACTION_FAILED');
  if (c.invoiceNumber && !/^[A-Za-z0-9][A-Za-z0-9._/-]{0,99}$/.test(c.invoiceNumber)) add('EXTRACTION_FAILED');
  const vendors = e.vendors.filter(v => c.vendorName && canonical(v.name) === canonical(c.vendorName));
  if (vendors.length !== 1) { add(vendors.length ? 'EXTRACTION_FAILED' : 'UNKNOWN_VENDOR'); return finish(); }
  const vendor = vendors[0]; vendorId = vendor.id;
  if (e.vendors.filter(v => v.id === vendorId).length !== 1 || vendorId.includes(':')) add('EXTRACTION_FAILED');
  if (c.invoiceNumber) invoiceKey = `${vendor.id}:${c.invoiceNumber}`;
  if (e.processedInvoiceKeys.some(key => canonical(key) === canonical(invoiceKey))) add('DUPLICATE_INVOICE');
  if (c.statedPayoutAddress !== vendor.payoutAddress) add('PAYOUT_ADDRESS_MISMATCH');
  const from = mailbox(c.headers.from), reply = c.headers.replyTo === null ? null : mailbox(c.headers.replyTo);
  if (!from || (c.headers.replyTo !== null && !reply)) add('EXTRACTION_FAILED');
  if (from && !vendor.domains.some(domain => canonical(domain) === from.split('@')[1])) add('SENDER_DOMAIN_MISMATCH');
  if (reply && reply !== from) add('REPLY_TO_MISMATCH');
  for (const signal of c.bodySignals) {
    const found = signalReasons(signal);
    for (const reason of found) add(reason);
    if (!found.length) add('EXTRACTION_FAILED');
  }
  const orders = e.purchaseOrders.filter(p => p.vendorId === vendor.id && p.poNumber === c.poNumber);
  if (!orders.length) add('NO_MATCHING_PO');
  else if (orders.length !== 1) add('EXTRACTION_FAILED');
  else {
    const receipts = e.goodsReceipts.filter(r => r.vendorId === vendor.id && r.poNumber === c.poNumber);
    if (receipts.length !== 1) add('EXTRACTION_FAILED');
    else {
      const po = orders[0], receipt = receipts[0];
      const unique = items => new Set(items.map(i => canonical(i.description))).size === items.length;
      if (![c.lineItems, po.lineItems, receipt.lineItems].every(unique) || !c.lineItems.every(i => line.safeParse(i).success)) add('EXTRACTION_FAILED');
      let total = 0;
      for (const item of po.lineItems) {
        const inv = c.lineItems.find(i => canonical(i.description) === canonical(item.description));
        const received = receipt.lineItems.find(i => canonical(i.description) === canonical(item.description));
        if (!inv || !received || inv.quantity !== item.quantity || received.quantity !== item.quantity || inv.unitPrice !== item.unitPrice) add('AMOUNT_MISMATCH');
        total += item.quantity * item.unitPrice;
      }
      if (c.lineItems.length !== po.lineItems.length || receipt.lineItems.length !== po.lineItems.length || c.total !== total) add('AMOUNT_MISMATCH');
      if (!Number.isSafeInteger(total) || total <= 0) add('EXTRACTION_FAILED');
      if (total > e.maxInvoiceAmount) add('OVER_INVOICE_LIMIT');
      approvedAmount = total;
    }
  }
  if (c.total > e.maxInvoiceAmount) add('OVER_INVOICE_LIMIT');
  return finish();
}
