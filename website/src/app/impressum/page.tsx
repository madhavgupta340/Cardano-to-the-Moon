import type { Metadata } from "next";
import { PageHero, Pending } from "@/components/ui";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Impressum", robots: { index: false } };

export default function Impressum() {
  const l = site.legal;
  return (
    <div lang="de">
      <PageHero title="Impressum" />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="container narrow legal">
          <p className="notice bad"><strong>Entwurf, nicht vollständig.</strong> Markierte Angaben fehlen noch und müssen vor der Veröffentlichung ergänzt werden. Diese Vorlage ersetzt keine Rechtsberatung und muss rechtlich geprüft werden.</p>
          <h2>Angaben gemäß § 5 DDG</h2>
          <p>
            <Pending value={l.companyName} label="vollständiger Firmenname" /><br />
            <Pending value={l.legalForm} label="Rechtsform" /><br />
            <Pending value={l.address} label="vollständige Geschäftsanschrift" />
          </p>
          <h2>Vertreten durch</h2>
          <p><Pending value={l.representative} label="vertretungsberechtigte Person, falls zutreffend" /></p>
          <h2>Kontakt</h2>
          <p>
            E-Mail: <Pending value={l.email} label="E-Mail-Adresse" /><br />
            Telefon: <Pending value={l.phone} label="Telefonnummer oder andere schnelle Kontaktmöglichkeit" />
          </p>
          <h2>Registereintrag</h2>
          <p><Pending value={l.register} label="Registergericht und Registernummer, falls eingetragen" /></p>
          <h2>Umsatzsteuer-ID</h2>
          <p><Pending value={l.vatId} label="USt-IdNr. nach § 27a UStG, falls vorhanden" /></p>
          <h2>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p><Pending value={l.contentResponsible} label="Name und Anschrift, falls zutreffend" /></p>
          <h2>Weitere Angaben</h2>
          <p><span className="pending">[Zu prüfen: weitere Pflichtangaben je nach Tätigkeit, zum Beispiel Aufsichtsbehörde oder Erlaubnisse bei Zahlungsdiensten]</span></p>
        </div>
      </section>
    </div>
  );
}
