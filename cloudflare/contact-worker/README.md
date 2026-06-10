# NechelesLaw contact Worker

Cloudflare Worker for `necheleslaw.com/contact-submit`.

Purpose:
- Receive the static contact form submission from `necheleslaw.com/contact/`.
- Send the inquiry through Resend server-side.
- Keep recipient addresses and the Resend API key out of public HTML/JavaScript.

Routes:
- `necheleslaw.com/contact-submit`
- `www.necheleslaw.com/contact-submit`

Secrets required in Cloudflare:
- `RESEND_API_KEY`
- `CONTACT_TO`

Public variables:
- `ALLOWED_ORIGINS`
- `CONTACT_FROM`

Deploy from `/root/necheleslaw-contact-worker` or copy these files into a Worker
project and run `wrangler deploy` after authenticating to the Cloudflare account
that owns `necheleslaw.com`.
