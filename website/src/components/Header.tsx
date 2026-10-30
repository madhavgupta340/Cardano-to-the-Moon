"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { site } from "@/config/site";
import { Icon, Mark, SokosumiLink } from "./ui";

const NAV = [
  { href: "/product/", label: "Product" },
  { href: "/how-it-works/", label: "How it works" },
  { href: "/#use-cases", label: "Use cases" },
  { href: "/faq/", label: "FAQ" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  const close = () => setOpen(false);

  return (
    <>
      <p className="status-bar">{site.status.label} on the {site.status.network}. Synthetic data only. <Link href="/access/">See current status</Link></p>
      <header className="header">
        <div className="container header-in">
          <Link href="/" className="logo" aria-label={`${site.name} home`}><Mark /> {site.name}</Link>
          <nav className="nav" aria-label="Main">
            {NAV.map((n) => <Link key={n.href} href={n.href} aria-current={path === n.href ? "page" : undefined}>{n.label}</Link>)}
          </nav>
          <div className="nav-right">
            <a href={site.documentationUrl} target="_blank" rel="noopener">Documentation</a>
            <SokosumiLink className="btn primary small">Explore Agent</SokosumiLink>
          </div>
          <button type="button" className="menu-btn" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
            <Icon name={open ? "x" : "menu"} size={20} />
          </button>
        </div>
        <nav id="mobile-menu" className="mobile-menu" aria-label="Mobile" hidden={!open}>
          {NAV.map((n) => <Link key={n.href} href={n.href} onClick={close}>{n.label}</Link>)}
          <a href={site.documentationUrl} target="_blank" rel="noopener" onClick={close}>Documentation</a>
          <SokosumiLink>Explore Agent</SokosumiLink>
        </nav>
      </header>
    </>
  );
}
