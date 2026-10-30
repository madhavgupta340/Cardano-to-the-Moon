import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { PageHero } from "@/components/ui";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Contact", description: "Contact the team about the product, partnerships or technical support." };

export default function Contact() {
  return (
    <>
      <PageHero eyebrow="Contact" title="Get in touch." lead={site.contact.email ? <>Email us at <a href={`mailto:${site.contact.email}`}>{site.contact.email}</a>, or fill in the form.</> : "A business contact address hasn't been published yet."} />
      <section className="section" style={{ paddingTop: 36 }}>
        <div className="container narrow"><ContactForm /></div>
      </section>
    </>
  );
}
