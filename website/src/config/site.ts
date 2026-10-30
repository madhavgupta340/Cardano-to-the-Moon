// The one place to edit company details. A null value means "not provided yet":
// the site then shows a clear placeholder and never invents a value.

/** The official Sokosumi listing. Until it's set, every CTA goes to the Access page instead. */
export const SOKOSUMI_AGENT_URL: string | null = process.env.NEXT_PUBLIC_SOKOSUMI_AGENT_URL || null;

export const site = {
  name: "Veridano",
  tagline: "From invoice verification to intelligent financial execution.",
  description:
    "An AI financial operations agent that checks supplier invoices against company records, holds exceptions for a person and prepares authorised payments on Cardano infrastructure.",
  url: process.env.NEXT_PUBLIC_SITE_URL || null,
  documentationUrl: "https://github.com/madhavgupta340/Cardano-to-the-Moon#readme",
  x402Url: null as string | null,
  copyrightYear: 2026,
  social: [] as { label: string; href: string }[],

  contact: {
    email: null as string | null,
  },

  // Everything the German legal pages need. Fill these in before publishing.
  legal: {
    companyName: null as string | null,
    legalForm: null as string | null,
    representative: null as string | null,
    address: null as string | null,
    email: null as string | null,
    phone: null as string | null,
    register: null as string | null,
    vatId: null as string | null,
    contentResponsible: null as string | null,
    hostingProvider: null as string | null,
    privacyContact: null as string | null,
  },

  // Keep this honest as things change. It feeds the banner, Access page and FAQ.
  status: {
    label: "Prototype",
    network: "Cardano Preprod test network",
    summary:
      "Veridano is a prototype that uses synthetic invoices. It isn't available for production use, and supplier payments aren't connected yet.",
    capabilities: [
      { name: "AI invoice extraction", state: "Working in the prototype", done: true },
      { name: "Rule-based checks against company records", state: "Working in the prototype", done: true },
      { name: "Running a batch as a Sokosumi Task", state: "Tested without payment", done: true },
      { name: "Review dashboard", state: "Working in the prototype", done: true },
      { name: "Paid agent access through Masumi", state: "In development", done: false },
      { name: "Supplier payments through x402", state: "In development, no payment recorded", done: false },
      { name: "Accounting and ERP connections", state: "Not available", done: false },
    ],
  },
};
