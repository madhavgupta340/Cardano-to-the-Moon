"use client";
import { useState } from "react";
import { Icon, Tag } from "./ui";

type Check = { label: string; result: "ok" | "no" | "wait" };
type Demo = {
  id: string; supplier: string; amount: string; status: "Verified" | "Requires approval" | "Blocked"; tone: "good" | "warn" | "bad";
  explanation: string; checks: Check[]; contact: string; onFile: string; invoiceAddress: string; payment: string; evidence: string;
};

const DEMOS: Demo[] = [
  {
    id: "DEMO-1042", supplier: "Example Parts GmbH", amount: "€1,200.00", status: "Verified", tone: "good",
    explanation: "Supplier, quantity and unit price match the purchase order, and the goods receipt is on file. No duplicate was found, and the amount is within the automatic limit.",
    checks: [
      { label: "Purchase order matches", result: "ok" }, { label: "Goods receipt on file", result: "ok" }, { label: "Supplier in vendor records", result: "ok" },
      { label: "Payout address matches vendor records", result: "ok" }, { label: "No duplicate found", result: "ok" }, { label: "Within company policy", result: "ok" },
    ],
    contact: "accounts@example-parts.example", onFile: "addr_demo_example_parts", invoiceAddress: "addr_demo_example_parts",
    payment: "Eligible for payment. Nothing was sent, because this is a demo.", evidence: "No transaction exists. A real payment would show its transaction hash and an explorer link here.",
  },
  {
    id: "DEMO-1050", supplier: "Sample Sensors AG", amount: "€3,200.00", status: "Requires approval", tone: "warn",
    explanation: "The invoice matches its purchase order, but nothing has been recorded as received. A person needs to confirm delivery or wait for the goods receipt.",
    checks: [
      { label: "Purchase order matches", result: "ok" }, { label: "No goods receipt yet", result: "wait" }, { label: "Supplier in vendor records", result: "ok" },
      { label: "Payout address matches vendor records", result: "ok" }, { label: "No duplicate found", result: "ok" }, { label: "Within company policy", result: "ok" },
    ],
    contact: "billing@sample-sensors.example", onFile: "addr_demo_sample_sensors", invoiceAddress: "addr_demo_sample_sensors",
    payment: "Held until a person decides.", evidence: "No transaction exists.",
  },
  {
    id: "DEMO-1049", supplier: "Placeholder Freight Ltd", amount: "€1,350.00", status: "Blocked", tone: "bad",
    explanation: "Payment blocked. The invoice is €150 above the €1,200 purchase order, and it asks for payment to an address that isn't in the vendor records. Manual review required.",
    checks: [
      { label: "Amount exceeds the purchase order by €150", result: "no" }, { label: "Goods receipt on file", result: "ok" }, { label: "Supplier in vendor records", result: "ok" },
      { label: "Payout address differs from vendor records", result: "no" }, { label: "No duplicate found", result: "ok" }, { label: "Urgent wording in the email", result: "wait" },
    ],
    contact: "accounts@placeholder-freight.example", onFile: "addr_demo_placeholder_freight", invoiceAddress: "addr_demo_changed_address",
    payment: "Blocked. Approval is locked until the new address is verified.", evidence: "No transaction exists.",
  },
];

const TABS = ["Verification", "AI explanation", "Supplier", "Payment", "Evidence"] as const;

export function DemoPreview() {
  const [selected, setSelected] = useState(0);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Verification");
  const [decision, setDecision] = useState<string | null>(null);
  const d = DEMOS[selected];
  const pick = (i: number) => { setSelected(i); setDecision(null); setTab("Verification"); };
  const icon = { ok: "check", no: "x", wait: "clock" } as const;

  return (
    <div className="demo">
      <div className="demo-bar"><strong>Approval queue</strong><Tag tone="neutral">Demo with synthetic data. No real invoices or payments.</Tag></div>
      <div className="demo-in">
        <div className="demo-list" role="tablist" aria-label="Example invoices" aria-orientation="vertical">
          {DEMOS.map((item, i) => (
            <button key={item.id} type="button" role="tab" className="demo-item" aria-selected={i === selected} aria-controls="demo-panel" onClick={() => pick(i)}>
              <span style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong>{item.id}</strong><span>{item.amount}</span></span>
              <span className="muted small">{item.supplier}</span>
              <span><Tag tone={item.tone}>{item.status}</Tag></span>
            </button>
          ))}
        </div>
        <div id="demo-panel" className="demo-main" role="tabpanel" aria-live="polite">
          <div className="tabs" role="tablist" aria-label="Invoice details">
            {TABS.map((t) => <button key={t} type="button" role="tab" aria-selected={t === tab} onClick={() => setTab(t)}>{t}</button>)}
          </div>
          {tab === "Verification" && (
            <>
              <div className={`verdict ${d.tone}`}><strong>{d.status}</strong></div>
              <ul className="checks">
                {d.checks.map((c) => <li key={c.label}><span className={c.result}><Icon name={icon[c.result]} size={16} /></span>{c.label}</li>)}
              </ul>
            </>
          )}
          {tab === "AI explanation" && (
            <div className="stack" style={{ gap: 8 }}>
              <p>{d.explanation}</p>
              <p className="small muted">The AI writes this summary from the check results. It can't change the result.</p>
            </div>
          )}
          {tab === "Supplier" && (
            <dl className="kv">
              <dt>Supplier</dt><dd>{d.supplier}</dd>
              <dt>Contact</dt><dd>{d.contact}</dd>
              <dt>Address on file</dt><dd className="mono">{d.onFile}</dd>
              <dt>Address on invoice</dt><dd className="mono">{d.invoiceAddress}</dd>
            </dl>
          )}
          {tab === "Payment" && <p>{d.payment}</p>}
          {tab === "Evidence" && <p>{d.evidence}</p>}
          {d.status !== "Verified" && (
            <div className="stack" style={{ gap: 8 }}>
              <div className="actions">
                <button type="button" className="btn primary small" disabled={d.status === "Blocked"} onClick={() => setDecision("Approved in this demo. A real approval would record your decision, and any payment would only go to the address in the vendor records.")}>Approve</button>
                <button type="button" className="btn secondary small" onClick={() => setDecision("Rejected in this demo. A real rejection would be recorded in the audit trail.")}>Reject</button>
              </div>
              {d.status === "Blocked" && <p className="small muted">Approve stays locked while the payout address is unverified.</p>}
              {decision && <p className="notice info" role="status">{decision}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
