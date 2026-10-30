import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { PageHero, SokosumiLink } from "@/components/ui";
import { site, SOKOSUMI_AGENT_URL } from "@/config/site";

export const metadata: Metadata = { title: "FAQ", description: "Answers about how the agent works, Cardano, Masumi and Sokosumi, your data, product status and access." };

const FAQS: [string, ReactNode][] = [
  ["What is this platform?", <p key="a">An AI-powered financial operations agent designed to help businesses process invoices, verify financial obligations and manage authorised supplier payments.</p>],
  ["How does the AI agent work?", <p key="a">The agent extracts and organises invoice information, coordinates verification steps and explains exceptions. Financial authorisation is governed by configured rules and permissions rather than an unrestricted language-model decision.</p>],
  ["What is three-way matching?", <p key="a">Three-way matching compares an invoice with its purchase order and goods receipt to check whether the billed goods or services, quantities and prices are consistent with the underlying transaction.</p>],
  ["Can the agent automatically pay invoices?", <><p key="a">Not yet. The agent is designed to support authorised payment execution, but supplier payments aren&apos;t connected in the current prototype, so it doesn&apos;t send any.</p><p key="b">When connected, whether a payment can proceed automatically will depend on company policy, available evidence and configured permissions. Sensitive or exceptional cases can require human approval.</p></>],
  ["Why use Cardano?", <p key="a">Cardano provides blockchain infrastructure for payment execution and verifiable transaction records. It can also support programmable settlement workflows. It does not independently verify whether goods were physically delivered or whether an invoice is commercially legitimate.</p>],
  ["What are Masumi and Sokosumi?", <><p key="a">Masumi is a protocol for agentic commerce on Cardano, adding agent identity, discovery and escrow. Sokosumi is a marketplace where people hire AI agents through Tasks.</p><p key="b">Two different payments are involved. Paying to use the agent is a payment for an AI service. Paying a supplier invoice is a separate payment that the agent would manage. Buying the agent doesn&apos;t authorise it to spend your company&apos;s funds.</p></>],
  ["Do I need cryptocurrency knowledge?", <><p key="a">The goal is an experience that finance teams can understand without knowing blockchain mechanics.</p><p key="b">The current prototype runs on the Cardano Preprod test network with test tokens that have no real value. Running it yourself means setting up a dedicated test wallet, which is a technical task. See the <a href={site.documentationUrl} target="_blank" rel="noopener">documentation</a>.</p></>],
  ["Is my financial data stored on the blockchain?", <><p key="a">Sensitive invoices and business documents should remain off-chain. In the current prototype, invoices are synthetic and run records are stored as local files, not on a blockchain.</p><p key="b">Blockchain payments are public, so amounts and addresses would be visible on the ledger. Hashes also don&apos;t automatically make data private. The architecture for real business data hasn&apos;t been established yet, so please don&apos;t submit real invoices.</p></>],
  ["Can the agent make mistakes?", <p key="a">Yes. AI extraction and automated workflows can make mistakes. The system uses validation rules, defined permissions, exception handling and human review to reduce risk, but can&apos;t eliminate it.</p>],
  ["Can I connect my accounting software?", <p key="a">Not yet. No accounting or ERP integrations are available. The prototype reads company records from local files. Connecting a real inbox and ERP is planned.</p>],
  ["Is the platform available for production use?", <p key="a">No. {site.status.summary} See the <Link href="/access/">current status of each capability</Link>.</p>],
  ["How can I try the agent?", SOKOSUMI_AGENT_URL ? <p key="a">Go to the official listing: <SokosumiLink className="">View Agent on Sokosumi</SokosumiLink>.</p> : <p key="a">A public Sokosumi listing hasn&apos;t been published yet. The <Link href="/access/">Access page</Link> will link to it once it exists. Until then, you can read the code in the <a href={site.documentationUrl} target="_blank" rel="noopener">documentation</a>.</p>],
  ["How does pricing work?", <p key="a">Pricing hasn&apos;t been established. Once the agent is listed, Sokosumi will show the current service price and access conditions. Service fees cover use of the agent, and don&apos;t include the amounts of any supplier invoices.</p>],
  ["Who can I contact?", <p key="a">{site.contact.email ? <>Email <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>, or use the <Link href="/contact/">contact page</Link>.</> : <>A contact address hasn&apos;t been published yet. The <Link href="/contact/">contact page</Link> and <Link href="/impressum/">Impressum</Link> will show it.</>}</p>],
];

export default function Faq() {
  return (
    <>
      <PageHero eyebrow="FAQ" title="Questions and straight answers." />
      <section className="section" style={{ paddingTop: 24 }}>
        <div className="container narrow faq">
          {FAQS.map(([q, a]) => <details key={q}><summary>{q}</summary><div className="a">{a}</div></details>)}
        </div>
      </section>
    </>
  );
}
