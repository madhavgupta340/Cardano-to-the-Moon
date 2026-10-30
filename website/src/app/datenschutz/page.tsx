import type { Metadata } from "next";
import { PageHero, Pending } from "@/components/ui";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Datenschutzerklärung", robots: { index: false } };

export default function Datenschutz() {
  const l = site.legal;
  return (
    <div lang="de">
      <PageHero title="Datenschutzerklärung" />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="container narrow legal">
          <p className="notice bad"><strong>Entwurf, nicht vollständig.</strong> Diese Vorlage beschreibt den aktuellen technischen Stand der Website. Markierte Angaben müssen vor der Veröffentlichung ergänzt und bestätigt werden. Sie ersetzt keine Rechtsberatung und muss rechtlich geprüft werden.</p>

          <h2>1. Verantwortlicher</h2>
          <p><Pending value={l.companyName} label="Name des Verantwortlichen" /><br /><Pending value={l.address} label="Anschrift" /><br />Kontakt für Datenschutzanfragen: <Pending value={l.privacyContact} label="E-Mail-Adresse" /></p>

          <h2>2. Hosting und Server-Logfiles</h2>
          <p>Diese Website wird gehostet bei: <Pending value={l.hostingProvider} label="Hosting-Anbieter, Sitz und Auftragsverarbeitungsvertrag" />.</p>
          <p>Beim Aufruf der Website kann der Hosting-Anbieter technisch notwendige Daten verarbeiten, zum Beispiel IP-Adresse, Datum und Uhrzeit, aufgerufene Seite, Referrer und Browser-Informationen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt im sicheren und stabilen Betrieb der Website.</p>
          <p><span className="pending">[Zu bestätigen: tatsächlich erhobene Daten und Speicherdauer der Logfiles beim gewählten Anbieter]</span></p>

          <h2>3. Kontaktformular und E-Mail</h2>
          <p>Das Kontaktformular prüft Eingaben derzeit nur in Ihrem Browser. Es überträgt und speichert keine Daten, und Nachrichten werden nicht versendet.</p>
          <p>Wenn Sie uns per E-Mail schreiben, verarbeiten wir Ihre Angaben zur Bearbeitung Ihrer Anfrage. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b oder f DSGVO. <span className="pending">[Zu ergänzen, sobald ein Formulardienst angebunden ist: Anbieter, Empfänger und Speicherdauer]</span></p>

          <h2>4. Cookies, Analyse und ähnliche Technologien</h2>
          <p>In der aktuellen Fassung setzt der Code dieser Website keine eigenen Cookies, nutzt keine Analyse- oder Marketing-Dienste und speichert keine Daten im Browser. Deshalb wird derzeit kein Einwilligungsbanner angezeigt. <span className="pending">[Vor Veröffentlichung auf der Live-Website und beim Hosting-Anbieter zu bestätigen]</span></p>
          <p>Werden später Dienste ergänzt, die eine Einwilligung nach § 25 TDDDG erfordern, müssen diese Erklärung angepasst und eine Einwilligung eingeholt werden, bevor sie aktiv werden.</p>

          <h2>5. Schriftarten und eingebettete Inhalte</h2>
          <p>Die Schriftart wird von dieser Website selbst ausgeliefert. Dabei wird keine Verbindung zu Google-Servern aufgebaut. Es sind keine externen Inhalte wie Videos oder Karten eingebettet.</p>

          <h2>6. Externe Links</h2>
          <p>Diese Website verlinkt auf externe Angebote, zum Beispiel GitHub und künftig Sokosumi. Erst wenn Sie einen solchen Link anklicken, gelangen Sie auf die Seite des jeweiligen Anbieters, für die dessen Datenschutzhinweise gelten.</p>

          <h2>7. Blockchain-Daten</h2>
          <p>Diese Website schreibt keine Daten auf eine Blockchain. Transaktionen auf einer öffentlichen Blockchain sind grundsätzlich öffentlich einsehbar und können in der Regel nicht gelöscht werden.</p>

          <h2>8. Speicherdauer</h2>
          <p>Personenbezogene Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen. <span className="pending">[Konkrete Fristen zu ergänzen]</span></p>

          <h2>9. Ihre Rechte</h2>
          <p>Sie haben nach Maßgabe der DSGVO insbesondere folgende Rechte:</p>
          <ul>
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch gegen die Verarbeitung (Art. 21 DSGVO)</li>
            <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO)</li>
          </ul>

          <h2>10. Stand</h2>
          <p><span className="pending">[Datum der geprüften Fassung zu ergänzen]</span></p>
        </div>
      </section>
    </div>
  );
}
