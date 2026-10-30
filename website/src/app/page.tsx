import Link from "next/link";
import { DemoPreview } from "@/components/DemoPreview";
import { FinalCta, Icon, SectionHead, SokosumiLink, Tag } from "@/components/ui";
import { site } from "@/config/site";

const PRINCIPLES = ["Policy-controlled automation", "Transparent AI decisions", "Verifiable payment activity", "Human oversight when needed"];

const PROBLEMS = [
  ["Inconsistent formats", "Invoice data arrives as emails, PDFs and attachments, each laid out differently."],
  ["Manual comparison", "Finance teams compare invoices with purchase orders by hand."],
  ["Duplicates and wrong amounts", "A repeated invoice or an incorrect price is easy to miss in a busy week."],
  ["Changing supplier details", "A supplier's payment details can change unexpectedly, and each change needs checking."],
  ["Slow approvals", "Waiting for the right person to approve a payment holds up operations."],
  ["Little visibility", "Teams often can't see what their automation did, or why."],
];

const USE_CASES = [
  ["Accounts payable teams", "Spend review time on the invoices that failed a check, rather than on every invoice."],
  ["Small and medium-sized businesses", "Get a consistent check on each invoice without building a large finance process."],
  ["Recurring supplier invoices", "Repeat the same checks on every invoice, and catch a repeated invoice number."],
  ["Procurement and finance departments", "Bring orders, deliveries and invoices together in one comparison."],
  ["Teams exploring financial AI", "Try AI on document work while rules and people keep control of payments."],
  ["Agentic commerce", "Explore how agents could pay for and deliver services within set limits."],
];

const CONTROLS = [
  ["Spending limits", "Your company sets the amount above which a person must decide."],
  ["Approved supplier records", "Payouts are checked against the addresses on file, not the ones on an invoice."],
  ["Duplicate detection", "An invoice number already received from a supplier gets flagged."],
  ["Manual approval", "Sensitive changes, such as a new payout address, wait for a person."],
  ["Payment permissions", "You decide what the agent may do alone and what needs review."],
  ["Audit trail", "Decisions and payment activity are recorded so they can be reviewed later."],
];

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-copy">
            <span className="pill"><i aria-hidden="true" /> {site.status.label} on the Cardano Preprod test network</span>
            <h1>Your AI Agent for Smarter Financial Operations.</h1>
            <p className="lead">Automate invoice verification, detect financial discrepancies and execute authorised supplier payments. Bring intelligent financial operations into your business with AI and Cardano infrastructure.</p>
            <div className="actions">
              <SokosumiLink>Explore the Agent</SokosumiLink>
              <a href="#how-it-works" className="btn secondary">See How It Works</a>
            </div>
          </div>
          <div className="mock-frame" role="img" aria-label="Illustrative dashboard with demo data: invoices processed, payments pending, verified invoices, flagged transactions, agent activity and Cardano payment status.">
            <div className="mock-top"><strong>Overview</strong><Tag tone="neutral">Illustrative demo data</Tag></div>
            <div className="mock-body" aria-hidden="true">
              <div className="mock-side"><span className="on">Overview</span><span>Invoices</span><span>Approvals</span><span>Suppliers</span><span>Audit trail</span></div>
              <div className="mock-main">
                <div className="kpis">
                  <div className="kpi">Invoices processed<b>128</b></div>
                  <div className="kpi">Payments pending<b>9</b></div>
                  <div className="kpi">Verified invoices<b>112</b></div>
                  <div className="kpi">Flagged<b>7</b></div>
                </div>
                <div className="panes">
                  <div className="pane">
                    <h4>Agent activity</h4>
                    <div className="row"><span>DEMO-1042 matched PO and receipt</span><Tag tone="good">Verified</Tag></div>
                    <div className="row"><span>DEMO-1050 has no goods receipt</span><Tag tone="warn">Approval</Tag></div>
                    <div className="row"><span>DEMO-1049 payout address changed</span><Tag tone="bad">Blocked</Tag></div>
                  </div>
                  <div className="pane">
                    <h4>Cardano payment status</h4>
                    <div className="row"><span>Network</span><span>Preprod (test)</span></div>
                    <div className="row"><span>Demo payments sent</span><span>0</span></div>
                    <div className="row"><span>Transaction evidence</span><span>Shown for real payments only</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="principles" aria-label="Principles">
        <div className="container grid g4">
          {PRINCIPLES.map((p) => <div key={p} className="principle"><Icon name="check" /> {p}</div>)}
        </div>
      </section>

      <section className="section">
        <div className="container grid g2" style={{ gap: "clamp(28px, 5vw, 72px)" }}>
          <div className="head" style={{ marginBottom: 0 }}>
            <p className="eyebrow">The problem</p>
            <h2>Financial operations shouldn&apos;t depend on manual checks.</h2>
            <p className="lead">Paying a supplier means checking several records that rarely arrive together. Those checks take time, and they&apos;re easy to get wrong when volumes rise.</p>
          </div>
          <ul className="problems">
            {PROBLEMS.map(([t, d]) => <li key={t}><strong>{t}</strong><span className="muted small">{d}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="section tint">
        <div className="container">
          <SectionHead eyebrow="The solution" title="An intelligent layer between your invoices and your money." lead="The agent connects invoice processing, financial checks, approvals and payment execution in one controlled sequence." />
          <div className="grid g3">
            {([["doc", "Understand", "Extract invoice information and organise financial documents."], ["scale", "Verify", "Compare invoices with purchase orders, goods receipts and company policies."], ["send", "Execute", "Route exceptions for approval and execute authorised payments through the configured Cardano payment infrastructure."]] as const).map(([ic, t, d]) => (
              <div className="card" key={t}><span className="icon-box"><Icon name={ic} /></span><h3>{t}</h3><p className="muted">{d}</p></div>
            ))}
          </div>
          <p className="notice info" style={{ marginTop: 18 }}><strong>Who decides what:</strong> AI helps read documents and coordinate the work. Deterministic rules and permission checks govern whether a payment is authorised.</p>
          <p className="small muted" style={{ marginTop: 10 }}>Current status: supplier payment execution is in development and hasn&apos;t been connected yet.</p>
        </div>
      </section>

      <section className="section" id="preview">
        <div className="container">
          <SectionHead eyebrow="Product preview" title="See how three invoices get three different outcomes." lead="Click an example invoice, then open its verification results, explanation, supplier details and payment status." />
          <DemoPreview />
        </div>
      </section>

      <section className="section tint" id="how-it-works">
        <div className="container">
          <SectionHead eyebrow="How it works" title="From invoice to payment, in five steps." />
          <ol className="flow">
            {[
              ["Invoice received", "A supplier invoice enters the system."],
              ["Information extracted", "The AI identifies the supplier, invoice number, line items, quantities, prices, dates and total."],
              ["Financial verification", "The system compares the invoice with the purchase order, goods receipt, supplier records and company policies."],
              ["Decision and approval", "Invoices that satisfy the rules can proceed within the configured permissions. Exceptions are held for human review."],
              ["Payment and evidence", "An authorised payment is submitted through the configured Cardano infrastructure. The system records its status and available evidence."],
            ].map(([t, d], i) => <li className="flow-step" key={t}><span className="flow-num" aria-hidden="true">{i + 1}</span><h3>{t}</h3><p className="muted small">{d}</p></li>)}
          </ol>
          <p className="small muted" style={{ marginTop: 26, maxWidth: "70ch" }}>A blockchain record shows that a payment happened. It doesn&apos;t prove that goods were delivered, and payments aren&apos;t always instant.</p>
          <div className="actions" style={{ marginTop: 18 }}><Link href="/how-it-works/" className="btn secondary">Read the full workflow</Link></div>
        </div>
      </section>

      <section className="section dark">
        <div className="container grid g2" style={{ gap: "clamp(28px, 5vw, 72px)" }}>
          <div className="stack" style={{ justifyItems: "start", alignContent: "start" }}>
            <p className="eyebrow">Why Cardano</p>
            <h2>Programmable payments. Verifiable execution.</h2>
            <p className="lead">Invoice verification and blockchain settlement solve different problems. The agent verifies the business obligation. Cardano provides payment infrastructure and transaction evidence.</p>
            <SokosumiLink>Explore the Agent on Sokosumi</SokosumiLink>
          </div>
          <ul className="stack" style={{ gap: 14 }}>
            {[
              ["Transaction records", "Payments leave a record on a public ledger."],
              ["Programmable settlement", "A payment can be tied to rules in a smart contract."],
              ["Transparent evidence", "Anyone with the transaction hash can look it up on an explorer."],
              ["Infrastructure for agents", "Masumi adds agent identity, discovery and escrow on Cardano. Sokosumi is a marketplace for hiring agents."],
              ["Conditional payments", "Escrow-style flows could release funds only when set conditions are met."],
            ].map(([t, d]) => <li key={t}><strong>{t}</strong><p className="muted small">{d}</p></li>)}
            <li className="tiny muted">We build on Masumi and Sokosumi. This doesn&apos;t imply a partnership with, or endorsement by, either project or Cardano.</li>
          </ul>
        </div>
      </section>

      <section className="section" id="use-cases">
        <div className="container">
          <SectionHead eyebrow="Use cases" title="Who it's designed for." />
          <div className="grid g3">{USE_CASES.map(([t, d]) => <div className="card" key={t}><h3>{t}</h3><p className="muted small">{d}</p></div>)}</div>
        </div>
      </section>

      <section className="section tint">
        <div className="container grid g2" style={{ gap: "clamp(28px, 5vw, 72px)", alignItems: "start" }}>
          <div>
            <SectionHead eyebrow="Security and control" title="Automation with boundaries." lead="These controls are designed to reduce risk. No system can guarantee against fraud or error." />
            <ul className="stack" style={{ gap: 12 }}>{CONTROLS.map(([t, d]) => <li key={t}><strong>{t}</strong><p className="muted small">{d}</p></li>)}</ul>
          </div>
          <div className="address-block">
            <div style={{ background: "var(--bad-bg)" }}><strong style={{ color: "var(--bad)" }}>Example: payout address change blocked</strong><span className="small">Demo with synthetic data</span></div>
            <div><span className="muted small">Address in vendor records</span><span className="mono">addr_demo_placeholder_freight</span></div>
            <div><span className="muted small">Address requested on the invoice</span><span className="mono">addr_demo_changed_address</span></div>
            <div><span className="muted small">Email says</span><span>&ldquo;Urgent: our bank details have changed, please pay today.&rdquo;</span></div>
            <div><strong>Payment blocked pending verification.</strong><span className="small muted">A person must confirm the new address through a contact they already trust. Until then, approval stays locked.</span></div>
          </div>
        </div>
      </section>

      <FinalCta />
    </>
  );
}
