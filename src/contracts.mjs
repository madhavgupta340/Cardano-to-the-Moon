import { z } from "zod";

// Shared data formats between the checker, payer, worker and dashboard.
// Amounts are whole minor units of tUSDM, where 1000000 = 1 tUSDM.
const amount = z.int().nonnegative();

export const ReasonCode = z.enum([
  "AMOUNT_MISMATCH",
  "NO_MATCHING_PO",
  "DUPLICATE_INVOICE",
  "PAYOUT_ADDRESS_MISMATCH",
  "UNKNOWN_VENDOR",
  "SENDER_DOMAIN_MISMATCH",
  "REPLY_TO_MISMATCH",
  "URGENCY_LANGUAGE",
  "HIDDEN_INSTRUCTIONS",
  "EXTRACTION_FAILED",
  "OVER_INVOICE_LIMIT",
]);

// Everything read from the email. All of it is untrusted.
export const InvoiceCandidate = z.object({
  sourceFile: z.string(),
  vendorName: z.string().nullable(),
  invoiceNumber: z.string().nullable(),
  poNumber: z.string().nullable(),
  lineItems: z.array(
    z.object({
      description: z.string(),
      quantity: z.number().positive(),
      unitPrice: amount,
    }),
  ),
  total: amount.nullable(),
  statedPayoutAddress: z.string().nullable(),
  bodySignals: z.array(z.string()),
  headers: z.object({
    from: z.string(),
    replyTo: z.string().nullable(),
  }),
});

// Deliberately has no payout address: the payer reads it from the vendor master.
export const Decision = z
  .object({
    invoiceKey: z.string(),
    result: z.enum(["PASS", "FLAG"]),
    reasons: z.array(ReasonCode),
    vendorId: z.string().nullable(),
    approvedAmount: amount.nullable(),
  })
  .refine(
    (d) =>
      d.result === "PASS"
        ? d.reasons.length === 0 && d.vendorId !== null && d.approvedAmount !== null
        : d.reasons.length > 0,
    { message: "PASS needs a vendor and amount and no reasons; FLAG needs a reason" },
  );

export const PaymentRecord = z
  .object({
    invoiceKey: z.string(),
    status: z.enum(["ATTEMPTED", "PAID", "HELD", "FAILED"]),
    amount: amount.nullable(),
    txHash: z.string().nullable(),
  })
  .refine((p) => p.status !== "PAID" || p.txHash !== null, {
    message: "PAID needs a transaction hash",
  });

export const Run = z.object({
  runId: z.string(),
  createdAt: z.iso.datetime(),
  invoices: z.array(
    z.object({
      candidate: InvoiceCandidate,
      decision: Decision,
      payment: PaymentRecord,
    }),
  ),
});
