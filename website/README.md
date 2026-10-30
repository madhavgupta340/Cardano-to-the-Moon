# Veridano website

The marketing and product site, built with Next.js and TypeScript as a static export. It has its own `package.json`, separate from the root.

## Run it

Requires Node.js 24. From this folder:

```sh
npm ci
npm run dev
```

Then open http://localhost:4180.

To test the static site, run `npm run build`, then `npm run preview`. The output in `out/` can go on any static host.

## Edit the details

Company details, legal details and product status are all in `src/config/site.ts`. A `null` value means "not provided yet", and the site shows a clear placeholder rather than inventing a value.

Set these when building:

| Variable | Use |
| --- | --- |
| `NEXT_PUBLIC_SOKOSUMI_AGENT_URL` | The official Sokosumi listing. Until it's set, all CTAs go to the Access page. |
| `NEXT_PUBLIC_SITE_URL` | The live site address, used for Open Graph links. |

## Before publishing

- Fill in every `[Ausstehend]` and `[Zu prüfen]` item on the Impressum and Datenschutzerklärung pages, then have them legally reviewed. They're templates and aren't legally complete.
- Keep `status` in `src/config/site.ts` up to date, and update the feature stages in `src/app/product/page.tsx` and the FAQ when payments are connected.
- Connect the contact form to a mail service, or keep its "not sent" message. If you add one, update the privacy policy too.
- If you add analytics or anything else that needs consent, add a consent banner so it doesn't run before consent.
