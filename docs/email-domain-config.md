# Email Domain Config

For production, keep authentication links and email sender identity aligned with
`engleet.com`.

## Vercel Environment Variables

- `NEXT_PUBLIC_SITE_URL=https://www.engleet.com`
- `NEXT_PUBLIC_AUTH_EMAIL_DOMAIN=engleet.com`
- `NEXT_PUBLIC_AUTH_SENDER_EMAIL=noreply@engleet.com`
- `NEXT_PUBLIC_SUPPORT_EMAIL=support@engleet.com`

## Supabase Auth

Set these in Supabase Auth URL configuration:

- Site URL: `https://www.engleet.com`
- Redirect URLs:
  - `https://www.engleet.com/auth/callback`
  - `http://localhost:3000/auth/callback`

## Sender Domain

If you use Supabase built-in emails on the free plan, sender branding is limited.
For production-grade sender identity, connect a transactional email provider
such as Resend, verify `engleet.com`, and configure SPF, DKIM, and DMARC DNS
records.

Recommended DNS posture:

- SPF includes the chosen email provider.
- DKIM is enabled for the sending domain.
- DMARC starts at `p=none` for monitoring, then moves toward `quarantine` or
  `reject` after delivery is verified.
