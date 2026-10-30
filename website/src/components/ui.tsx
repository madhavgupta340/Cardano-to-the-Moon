import Link from "next/link";
import type { ReactNode } from "react";
import { site, SOKOSUMI_AGENT_URL } from "@/config/site";

export function Mark({ size = 26, a = "#101D35", b = "#168C83" }: { size?: number; a?: string; b?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path fill={a} d="M6 10H21L33 54H23Z" />
      <path fill={b} d="M43 10H58L42 54L35.5 31Z" />
    </svg>
  );
}

const ICONS = {
  check: "M5 12l5 5 9-10",
  x: "M6 6l12 12M18 6L6 18",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  doc: "M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6",
  scale: "M12 4v16M6 20h12M5 8h14M5 8l-3 6a3 3 0 0 0 6 0zM19 8l-3 6a3 3 0 0 0 6 0z",
  send: "M4 12l16-8-6 16-3-6z",
  sliders: "M5 4v16M12 4v16M19 4v16M3 9h4M10 15h4M17 7h4",
  eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  link: "M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1",
  person: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
  menu: "M4 7h16M4 12h16M4 17h16",
  out: "M9 5H5v14h14v-4M13 11l8-8M15 3h6v6",
} as const;

export function Icon({ name, size = 18 }: { name: keyof typeof ICONS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={ICONS[name]} />
    </svg>
  );
}

/** Every purchase or access CTA. Goes to the listing once configured, otherwise to the Access page. */
export function SokosumiLink({ children, className = "btn primary" }: { children: ReactNode; className?: string }) {
  if (!SOKOSUMI_AGENT_URL) return <Link href="/access/" className={className}>{children}</Link>;
  return (
    <a href={SOKOSUMI_AGENT_URL} target="_blank" rel="noopener" className={className}>
      {children} <Icon name="out" size={15} /><span className="sr"> (opens Sokosumi in a new tab)</span>
    </a>
  );
}

export function SectionHead({ eyebrow, title, lead }: { eyebrow?: string; title: string; lead?: ReactNode }) {
  return (
    <div className="head">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h2>{title}</h2>
      {lead && <p className="lead">{lead}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, lead, children }: { eyebrow?: string; title: string; lead?: ReactNode; children?: ReactNode }) {
  return (
    <section className="section tint" style={{ paddingBottom: "clamp(36px, 5vw, 60px)" }}>
      <div className="container stack">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 style={{ fontSize: "clamp(32px, 4.6vw, 50px)", maxWidth: "20ch" }}>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

export function FinalCta() {
  return (
    <section className="section dark">
      <div className="container stack" style={{ justifyItems: "start" }}>
        <h2 style={{ maxWidth: "20ch" }}>Make financial operations more intelligent.</h2>
        <p className="lead">Explore an AI agent designed to connect business finance, verification and programmable payments.</p>
        <div className="actions">
          <SokosumiLink>Explore on Sokosumi</SokosumiLink>
          <Link href="/faq/" className="btn secondary">Read the FAQ</Link>
        </div>
        <p className="note-link">{site.status.summary}</p>
      </div>
    </section>
  );
}

export function Tag({ tone, children }: { tone: "good" | "warn" | "bad" | "neutral" | "teal"; children: ReactNode }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

/** A required detail nobody has provided yet. It's meant to stand out until it's filled in. */
export function Pending({ value, label }: { value: string | null; label: string }) {
  return value ? <>{value}</> : <span className="pending">[Ausstehend: {label}]</span>;
}
