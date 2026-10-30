import type { Metadata } from "next";
import { FinalCta, PageHero, SectionHead, Tag } from "@/components/ui";

export const metadata: Metadata = { title: "How it works", description: "The full workflow, from invoice ingestion to AI extraction, rule-based checks, approval, payment and audit trail." };

const LAYERS: [string, string, "teal" | "neutral" | "warn"][] = [
  ["AI extraction", "Reads the email and document, and turns them into structured fields. Its output is treated as untrusted.", "teal"],
  ["Deterministic validation", "Fixed rules compare those fields with the company's records and return a result with reason codes.", "neutral"],
  ["Payment authorisation", "Permissions and limits decide whether a verified invoice may proceed. Exceptions go to a person.", "warn"],
];

const STEPS = [
  ["Invoice ingestion", "A batch of supplier invoices enters the system. In the prototype, these are synthetic emails with PDF attachments."],
  ["AI document extraction", "The AI reads the document and extracts the supplier, invoice number, line items and total. Email headers are parsed by code."],
  ["Purchase order matching", "The rules look for a purchase order from the same supplier, then compare items, quantities and prices."],
  ["Goods receipt verification", "The rules check that what's being billed was recorded as received."],
  ["Duplicate detection", "The supplier and invoice number are compared with invoices already processed."],
  ["Supplier verification", "The sender and payout address are compared with the vendor records."],
  ["Approval policies", "Anything missing, ambiguous or unreadable is flagged. Flagged invoices are held for a person."],
  ["Payment execution", "Designed so that only verified invoices proceed, with the address taken from the vendor records. Not connected yet in the prototype."],
  ["Transaction audit trail", "Each run saves its decisions and payment records. An attempt is recorded before anything is sent, so it can't be lost."],
];

function Example({ title, invoice, tone, result, explanation, rows }: { title: string; invoice: string; tone: "good" | "bad"; result: string; explanation: string; rows: [string, string, string, boolean][] }) {
  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}><h3>{title}</h3><Tag tone={tone}>{result}</Tag></div>
      <p className="small muted">An invoice arrives for {invoice}.</p>
      <div className="scroll">
        <table className="compare">
          <thead><tr><th scope="col">Check</th><th scope="col">Invoice</th><th scope="col">Record</th></tr></thead>
          <tbody>{rows.map(([c, a, b, ok]) => <tr key={c} className={ok ? "" : "miss"}><td>{c}</td><td>{a}</td><td>{b}</td></tr>)}</tbody>
        </table>
      </div>
      <p className={`verdict ${tone}`}>{explanation}</p>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <>
      <PageHero eyebrow="How it works" title="AI reads. Rules decide. People hold the limits." lead="This page describes the whole workflow, including the steps still in development." />
      <section className="section">
        <div className="container">
          <SectionHead title="System overview" lead="Three separate layers, so that a mistake or a manipulated document in one doesn't automatically become a payment." />
          <div className="layers">
            {LAYERS.map(([t, d, tone], i) => <div className="layer" key={t}><strong>{i + 1}. {t}</strong><span className="muted">{d}</span><Tag tone={tone}>{i === 0 ? "Uses a language model" : i === 1 ? "No language model" : "Your settings"}</Tag></div>)}
          </div>
        </div>
      </section>
      <section className="section tint">
        <div className="container">
          <SectionHead title="The workflow, step by step" />
          <div className="grid g3">{STEPS.map(([t, d], i) => <div className="card" key={t}><span className="eyebrow">Step {i + 1}</span><h3>{t}</h3><p className="muted small">{d}</p></div>)}</div>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <SectionHead title="Two worked examples" lead="The amounts are illustrative. The prototype itself works in test tokens on Cardano Preprod." />
          <div className="grid g2">
            <Example title="The invoice matches" invoice="€1,200" tone="good" result="Eligible" explanation="The invoice is marked as eligible for payment under the configured rules."
              rows={[["Amount vs. purchase order", "€1,200", "€1,200 authorised", true], ["Goods receipt", "Billed in full", "Delivery confirmed", true], ["Supplier", "As stated", "Matches vendor record", true], ["Duplicate check", "New number", "None found", true]]} />
            <Example title="The invoice doesn't match" invoice="€1,350" tone="bad" result="Blocked" explanation="Payment blocked. The invoice is €150 above the €1,200 purchase order. Manual review required."
              rows={[["Amount vs. purchase order", "€1,350", "€1,200 authorised", false], ["Goods receipt", "Billed in full", "Delivery confirmed", true], ["Supplier", "As stated", "Matches vendor record", true], ["Duplicate check", "New number", "None found", true]]} />
          </div>
          <div className="grid g3" style={{ marginTop: 28 }}>
            <div className="card flat"><h3>What the AI did</h3><p className="muted small">It read €1,200 and €1,350 from the documents. If it misreads a value, the comparison should fail and the invoice gets held.</p></div>
            <div className="card flat"><h3>What the rules did</h3><p className="muted small">They compared the values with the records and gave the same answer they&apos;d give every time for those inputs.</p></div>
            <div className="card flat"><h3>What authorisation does</h3><p className="muted small">It decides whether an eligible invoice may be paid under your limits, or needs a person first. A passed check isn&apos;t a payment.</p></div>
          </div>
        </div>
      </section>
      <FinalCta />
    </>
  );
}
