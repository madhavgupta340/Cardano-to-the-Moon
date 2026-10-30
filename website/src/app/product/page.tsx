import type { Metadata } from "next";
import { FinalCta, PageHero, SokosumiLink, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "Product", description: "Invoice intelligence, three-way matching, supplier verification, risk detection, approvals, payment execution and audit history." };

type Row = [string, string, ("good" | "warn" | "bad" | "neutral" | "teal")?];
type Feature = { title: string; stage: string; what: string; why: string; how: string; control: string; mock: string; rows: Row[] };

const FEATURES: Feature[] = [
  { title: "Invoice intelligence", stage: "In the prototype", what: "Turns supplier emails and PDFs into structured invoice data.", why: "Invoices arrive in different layouts, and retyping them is slow.", how: "A language model reads the document, while code parses the email headers.", control: "Extracted values never authorise anything. They're only inputs to the checks.",
    mock: "Extracted fields", rows: [["Supplier", "Example Parts GmbH"], ["Invoice", "DEMO-1042"], ["Line item", "400 × brackets at €3.00"], ["Total", "€1,200.00"]] },
  { title: "Three-way matching", stage: "In the prototype", what: "Compares each invoice with its purchase order and goods receipt.", why: "It shows whether you're being billed for what you ordered and received.", how: "Fixed rules compare items, quantities and prices.", control: "You maintain the records that invoices are compared with.",
    mock: "Match result", rows: [["Quantity", "Match", "good"], ["Unit price", "Mismatch", "bad"], ["Goods receipt", "On file", "good"], ["Result", "Blocked", "bad"]] },
  { title: "Supplier verification", stage: "In the prototype", what: "Checks the sender and payout address against your vendor records.", why: "Changed payment details are a common route for invoice fraud.", how: "The address on the invoice is only compared. Any payout address is read from the vendor records.", control: "A person verifies changes before the records are updated.",
    mock: "Supplier check", rows: [["Sender domain", "On file", "good"], ["Payout address", "Differs", "bad"], ["Status", "Pending verification", "warn"]] },
  { title: "Risk detection", stage: "In the prototype", what: "Flags duplicates, urgent wording and hidden instructions in documents.", why: "These signals are easy to overlook when reviewing many invoices.", how: "Rules produce a reason code for each flag. Urgent wording can add a flag, but its absence never helps an invoice pass.", control: "You see every reason code, and flagged invoices wait for you.",
    mock: "Reason codes", rows: [["DUPLICATE_INVOICE", "Flag", "warn"], ["URGENCY_LANGUAGE", "Flag", "warn"], ["HIDDEN_INSTRUCTIONS", "Flag", "bad"]] },
  { title: "Approval workflows", stage: "In the prototype", what: "Holds exceptions in a queue for a person to approve or reject.", why: "People should judge the cases that rules can't settle.", how: "The dashboard saves each decision. Acting on an approval is part of the payment work still in development.", control: "Approval stays locked when the vendor isn't on file or the address differs.",
    mock: "Approval queue", rows: [["DEMO-1050", "Awaiting approval", "warn"], ["DEMO-1049", "Locked", "bad"], ["DEMO-1051", "Rejected", "neutral"]] },
  { title: "AI finance assistant", stage: "In the prototype", what: "Explains results in plain language and answers follow-up questions on a Task.", why: "A finance team needs to understand why an invoice was held.", how: "The agent explains a saved report, and has no tools to change it.", control: "It can't approve invoices or start a payment through conversation.",
    mock: "Conversation", rows: [["You", "Why was DEMO-1049 held?"], ["Agent", "The payout address differs from your vendor records."]] },
  { title: "Payment execution", stage: "In development", what: "Designed to pay verified invoices through x402 on Cardano.", why: "It could connect the check and the payment in one traceable process.", how: "Each attempt is recorded before sending. If an outcome is unclear, the invoice is held and not retried.", control: "You set the limits, and addresses only come from the vendor records.",
    mock: "Payment status", rows: [["Payment connector", "Not connected", "neutral"], ["Payments sent", "0"], ["Network", "Preprod (test)"]] },
  { title: "Cardano transaction evidence", stage: "In development", what: "Will link each real payment to its record on a blockchain explorer.", why: "Anyone can independently confirm that the transaction happened.", how: "The transaction hash is saved with the payment record.", control: "Links only appear for real hashes. A blockchain record doesn't prove delivery.",
    mock: "Evidence", rows: [["Transaction hash", "None yet"], ["Explorer link", "Shown for real payments"]] },
  { title: "Audit history", stage: "In the prototype", what: "Saves each run's invoices, decisions and payment records.", why: "You can review later what was checked and decided.", how: "Each run is written to a file, and earlier runs are used to stop an invoice being paid twice.", control: "Your team can read every record, and decisions are logged separately.",
    mock: "Run record", rows: [["Invoices checked", "6"], ["Passed", "1", "good"], ["Held for review", "5", "warn"]] },
];

function Mock({ title, rows }: { title: string; rows: Row[] }) {
  return (
    <div className="pane" style={{ boxShadow: "var(--shadow)", padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}><h4>{title}</h4><Tag tone="neutral">Illustrative</Tag></div>
      {rows.map(([k, v, tone]) => <div className="row" key={k}><span className="muted">{k}</span>{tone ? <Tag tone={tone}>{v}</Tag> : <span>{v}</span>}</div>)}
    </div>
  );
}

export default function Product() {
  return (
    <>
      <PageHero eyebrow="Product" title="Every feature, and what stays in your control." lead="Each feature is labelled with its current stage, so you can see what exists today and what's still being built.">
        <div className="actions"><SokosumiLink>View Agent on Sokosumi</SokosumiLink></div>
      </PageHero>
      <section className="section" style={{ paddingTop: 12 }}>
        <div className="container">
          {FEATURES.map((f) => (
            <article className="feature" key={f.title}>
              <div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}><h2 style={{ fontSize: "clamp(22px, 2.6vw, 28px)" }}>{f.title}</h2><Tag tone={f.stage === "In development" ? "warn" : "teal"}>{f.stage}</Tag></div>
                <dl>
                  <div><dt>What it does</dt><dd>{f.what}</dd></div>
                  <div><dt>Why it matters</dt><dd>{f.why}</dd></div>
                  <div><dt>How it works</dt><dd>{f.how}</dd></div>
                  <div><dt>What you control</dt><dd>{f.control}</dd></div>
                </dl>
              </div>
              <Mock title={f.mock} rows={f.rows} />
            </article>
          ))}
        </div>
      </section>
      <FinalCta />
    </>
  );
}
