# Admin invoicing setup

The site includes a private invoicing tool at `/admin/` for Eddie to create and email invoices.

## What it does

- Sign in with a password (not linked from the public site)
- Enter customer name, address, email, work completed, and amount
- Sends a branded invoice email to the customer
- Sends a copy to `egnelson41@yahoo.co.uk` via BCC
- Keeps a history of recent invoices in the admin page

## One-time Cloudflare setup

These steps are done once in the Cloudflare dashboard (or with Wrangler).

### 1. Create the D1 database

```powershell
npx wrangler d1 create painter-decorator-invoices
```

Copy the `database_id` from the output into `wrangler.toml`, replacing the placeholder.

Apply the migration:

```powershell
npx wrangler d1 migrations apply painter-decorator-invoices --remote
```

### 2. Add Worker secrets

In Cloudflare: **Workers & Pages → your worker → Settings → Variables**

Add these **secrets** (encrypted):

| Name | Purpose |
|------|---------|
| `ADMIN_PASSWORD` | Password Eddie uses to sign in |
| `SESSION_SECRET` | Random string (e.g. 32+ characters) used to sign login cookies |
| `RESEND_API_KEY` | API key from [resend.com](https://resend.com) for sending email |

Add these **plain text** variables (optional but recommended):

| Name | Example value |
|------|---------------|
| `BUSINESS_NAME` | `E.g. Nelson, Painter and Decorator` |
| `BUSINESS_EMAIL` | `egnelson41@yahoo.co.uk` |
| `BUSINESS_PHONE` | `07813 888572` |
| `RESEND_FROM` | `Eddie Nelson <invoices@yourdomain.com>` (after domain verification) |

Until a domain is verified with Resend, emails send from `onboarding@resend.dev` with **Reply-To** set to the Yahoo address.

### 3. Resend account

1. Sign up at [resend.com](https://resend.com) (free tier is enough to start)
2. Create an API key
3. For production: verify your custom domain in Resend and set `RESEND_FROM`

### 4. Deploy

Push to GitHub as usual. Cloudflare should pick up `wrangler.toml` and deploy the Worker with static assets.

If the GitHub integration does not detect the Worker automatically, connect Wrangler deploy or add a build step in the Cloudflare dashboard.

## Using it

1. Bookmark: `https://painter-decorator-site.snelson633.workers.dev/admin/`
2. Sign in with the admin password
3. Fill in the form and click **Send invoice**

The page is not linked from the public navigation, so customers will not find it.

## Local development

```powershell
npm install -g wrangler
wrangler secret put ADMIN_PASSWORD
wrangler secret put SESSION_SECRET
wrangler secret put RESEND_API_KEY
wrangler d1 migrations apply painter-decorator-invoices --local
wrangler dev
```

Then open `http://localhost:8787/admin/`.

## Notes

- Invoice numbers are auto-generated (`INV-2026-001`, etc.)
- Amounts are stored in pence for accuracy
- VAT is not included in this first version — add later if needed
- The admin area is hidden from search engines via `noindex`
