import type { Metadata } from "next";
import { Icon, PageHero, SokosumiLink, Tag } from "@/components/ui";
import { site, SOKOSUMI_AGENT_URL } from "@/config/site";

export const metadata: Metadata = { title: "Access the agent", description: "How to access the agent, its current status, and how pricing works." };

export default function Access() {
  return (
    <>
      <PageHero eyebrow="Access" title="Access the agent." lead={site.status.summary}>
        {SOKOSUMI_AGENT_URL
          ? <div className="actions"><SokosumiLink>View Agent on Sokosumi</SokosumiLink><span className="small muted">You&apos;ll leave this website and continue on Sokosumi.</span></div>
          : <p className="notice">The Sokosumi listing hasn&apos;t been published yet, so there&apos;s nothing to link to. This button will appear here as soon as the listing exists.</p>}
      </PageHero>
      <section className="section">
        <div className="container grid g2" style={{ gap: "clamp(28px, 5vw, 72px)", alignItems: "start" }}>
          <div className="stack">
            <h2 style={{ fontSize: 28 }}>Current status</h2>
            <ul className="stack" style={{ gap: 0 }}>
              {site.status.capabilities.map((c) => (
                <li className="row" key={c.name} style={{ padding: "12px 0", fontSize: 15 }}>
                  <span style={{ display: "flex", gap: 8, alignItems: "center" }}><span className={c.done ? "ok" : "wait"}><Icon name={c.done ? "check" : "clock"} size={16} /></span>{c.name}</span>
                  <Tag tone={c.done ? "good" : "neutral"}>{c.state}</Tag>
                </li>
              ))}
            </ul>
          </div>
          <div className="stack">
            <h2 style={{ fontSize: 28 }}>Pricing</h2>
            <p>Pricing hasn&apos;t been established, so there are no plans or fees to show here. Once listed, Sokosumi will show the current service price and access conditions.</p>
            <h3>Two different payments</h3>
            <div className="card"><strong>Paying for the agent</strong><p className="small muted">You pay to use an AI service, through Sokosumi once it&apos;s listed.</p></div>
            <div className="card"><strong>Paying your suppliers</strong><p className="small muted">The agent would manage these payments under your rules. Buying the agent doesn&apos;t authorise it to spend your company&apos;s funds.</p></div>
            {site.x402Url && <p className="small"><a href={site.x402Url} target="_blank" rel="noopener">x402 payment documentation</a></p>}
          </div>
        </div>
      </section>
    </>
  );
}
