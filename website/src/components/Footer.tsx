import Link from "next/link";
import { site, SOKOSUMI_AGENT_URL } from "@/config/site";
import { Mark } from "./ui";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="stack" style={{ gap: 12 }}>
            <Link href="/" className="logo"><Mark a="#FFFFFF" b="#39B4A8" /> {site.name}</Link>
            <p style={{ maxWidth: "38ch" }}>An AI financial operations agent that checks invoices against company records, under rules you set.</p>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><Link href="/product/">Product</Link></li>
              <li><Link href="/how-it-works/">How it works</Link></li>
              <li><Link href="/faq/">FAQ</Link></li>
              <li><a href={site.documentationUrl} target="_blank" rel="noopener">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4>Access</h4>
            <ul>
              <li><Link href="/access/">Access the agent</Link></li>
              <li>{SOKOSUMI_AGENT_URL ? <a href={SOKOSUMI_AGENT_URL} target="_blank" rel="noopener">Sokosumi listing</a> : <Link href="/access/">Sokosumi listing (not published yet)</Link>}</li>
              <li><Link href="/contact/">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><Link href="/impressum/">Impressum</Link></li>
              <li><Link href="/datenschutz/">Datenschutzerklärung</Link></li>
            </ul>
            {site.social.length > 0 && (
              <ul>{site.social.map((s) => <li key={s.href}><a href={s.href} target="_blank" rel="noopener">{s.label}</a></li>)}</ul>
            )}
          </div>
        </div>
        <div className="footer-end">
          <span>© {site.copyrightYear} {site.legal.companyName ?? site.name}</span>
          <span>{site.status.label}. Cardano Preprod test network only.</span>
        </div>
      </div>
    </footer>
  );
}
