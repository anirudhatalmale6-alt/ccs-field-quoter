# Canadian Comfort Solutions — Field Quoter

A field-sales quoting app for home comfort systems. A technician sits with the
customer, builds a proposal from the product catalogue, shows a monthly payment,
sends it to the customer's phone, and books the installation — in one visit.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build into dist/
npm run preview  # serve the production build locally
```

First sign-in is `admin` / `admin`. Change it before you go live.

## What's in here

| Screen | What it does |
| --- | --- |
| Dashboard | Open quotes, pipeline value, installs booked |
| Quotes | Pipeline board — drafts, sent, signed, scheduled, cancelled. Search, duplicate, delete |
| Quote wizard | 9 steps: home details, seven product sections, summary |
| Summary | Line items, discount, tax, financing, share, finalise, book |
| Schedule | Week board — every finalised quote lands here with its arrival window |
| Financing | Standalone rate calculator |
| Product catalogue | Add, edit, remove products and prices. Import/export as JSON |
| Team | Add staff, set their password and role, see what each role can do |

## The pieces worth knowing about

### `src/brand.ts`

Every bit of branding lives in this one file — company name, logo path, phone,
email, address, colours, tax rate. Change it and the login screen, sidebar,
quote header, customer-facing page and printed PDF all follow.

Drop your logo in at `public/logo.png` and it replaces the "CCS" mark
everywhere. If the file is missing the app falls back to the initials mark, so
nothing breaks.

### `src/lib/finance.ts`

The financing engine. Five plans — standard, deferred start, 12 × 0%, rate
buydown and stretch — with the published rate-factor table, the amortisation
maths, the $1,000 minimum, the 240-month term that only unlocks above $10,000,
and the $99.95 registration fee.

`npm run verify:finance` runs a differential test of 7,790 combinations
(every plan × term × amount × down payment × buydown rate × deferral period).
It currently passes with zero mismatches.

### `src/lib/catalog.ts`

119 products across 11 categories from 12 brands, plus 68 repair services.

Pricing follows one rule: **the customer is quoted the sale price if one is set,
otherwise the regular price.** Cost price is internal and never shown.

The catalogue ships as a seed file and is then kept in browser storage so the
admin editor can change it with no deploy. To move it to a shared database,
replace the `load` and `persist` functions at the top of the file — nothing else
needs to change.

### `src/lib/auth.ts`

Three roles. Manage people under **Team** in the sidebar (admin only). The
permission check runs both on the sidebar link and inside the screen itself, so
typing the URL in directly doesn't get anyone past it.

| Role | Create quotes | See everyone's quotes | Schedule | Edit catalogue | Manage users |
| --- | --- | --- | --- | --- | --- |
| Sales technician | ✓ | | ✓ | | |
| Manager | ✓ | ✓ | ✓ | ✓ | |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ |

### Sharing a quote

Every quote gets a public link at `/q/<token>` that needs no login. The share
buttons open the technician's own SMS or email app with the message and link
already filled in, so there is no per-message cost and no SMS provider account
to maintain. "Print / PDF" uses the browser's own print-to-PDF.

## Deploying

It's a static build — anything that serves files will host it. The only
requirement is a **single-page-app fallback** so deep links like `/quotes` and
`/q/abc123` return `index.html` instead of a 404.

`public/_redirects` already handles this on Netlify. On Apache use a
`.htaccess` rewrite; on nginx use `try_files $uri /index.html`.

```bash
npm run build      # then upload the contents of dist/
```

## Data storage

Right now everything (quotes, users, catalogue) is stored in the browser, which
means it works offline and needs no server, but each device holds its own data.

To share data across the team, the three modules that touch storage —
`lib/quotes.ts`, `lib/catalog.ts`, `lib/auth.ts` — each read and write through a
small set of functions at the top of the file. Point those at a hosted database
and the rest of the app is unchanged.
