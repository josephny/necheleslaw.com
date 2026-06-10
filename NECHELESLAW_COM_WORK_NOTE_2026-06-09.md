# necheleslaw.com work note - 2026-06-09

## Site recovery and hosting

- Recovered `necheleslaw.com` from the Wayback snapshot after the old Cloudflare origin was broken.
- Static site repo: `/root/necheleslaw-static-site`
- GitHub repo: `josephny/necheleslaw.com`
- Hosting: GitHub Pages for `necheleslaw.com`, behind Cloudflare.
- The `.com` site is separate from `necheleslaw.net`.

Recent site commits:

- `9e742ea` - Recover necheleslaw.com static site from Wayback
- `ab5a0e8` - Fix static contact form fallback
- `b3a5b97` - Obfuscate public attorney email addresses
- `c14128d` - Use image-rendered attorney email addresses
- `462cb3b` - Submit contact form to backend endpoint
- `c3a830c` - Submit contact form through Cloudflare Worker
- `2ec2a95` - Add Cloudflare Worker contact source

## Contact form

Current design:

- The public form posts to `/contact-submit` on the same hostname.
- Cloudflare Worker: `necheleslaw-contact`
- Worker routes:
  - `necheleslaw.com/contact-submit`
  - `www.necheleslaw.com/contact-submit`
- Worker source kept in repo: `/root/necheleslaw-static-site/cloudflare/contact-worker`
- Deployment working directory used on 2026-06-10: `/root/necheleslaw-contact-worker`
- Secrets stored in Cloudflare Worker secrets, not in public HTML:
  - `RESEND_API_KEY`
  - `CONTACT_TO`
- Public Worker vars:
  - `ALLOWED_ORIGINS=https://necheleslaw.com,https://www.necheleslaw.com`
  - `CONTACT_FROM=Necheles Law Website <contact@necheleslaw.com>`
- Subject configured as exactly: `NECHELESLAW.COM WEBSITE INQUIRY`

Verified on 2026-06-10:

- `wrangler deploy --dry-run` passed.
- Worker deployed as version `d1cb496d-9a93-4020-9b3b-6059410ebe04`.
- `POST https://necheleslaw.com/contact-submit` returned `{"ok":true}`.
- `POST https://www.necheleslaw.com/contact-submit` returned `{"ok":true}`.
- Live `https://necheleslaw.com/contact/` contains `/contact-submit`.
- Live page no longer contains `mailto`, `email program`, or the old tunnel endpoint.
- Bad origins are rejected.

Earlier local backend, now retired:

- Directory: `/root/necheleslaw-contact`
- Service: `necheleslaw-contact.service`
- Local endpoint: `http://127.0.0.1:8791/contact`
- Health endpoint: `http://127.0.0.1:8791/health`
- Secret env file: `/root/necheleslaw-contact/.env`
- Email provider: Resend
- Sender configured as: `Necheles Law Website <contact@necheleslaw.com>`
- Recipients configured as: `srn@necheleslaw.com,gstern@necheleslaw.com`
- Status on 2026-06-10: `necheleslaw-contact.service` is inactive and disabled.

Verified:

- Resend initially rejected non-test recipients until domain DNS was authorized.
- Resend DNS records for `send.necheleslaw.com` and `resend._domainkey.necheleslaw.com` were added and verified.
- Root `necheleslaw.com` MX remained pointed to Microsoft 365: `necheleslaw-com.mail.protection.outlook.com`.
- After Resend verification, a controlled backend test to the real recipients returned `{"ok": true}`.
- User confirmed the test email was received.

## Cloudflare tunnel cleanup

The tunnel approach was abandoned in favor of the Cloudflare Worker. Do not use
`nycequities.net` or any other unrelated domain for `necheleslaw.com`.

Removed/disabled on 2026-06-10:

- Tunnel name: `necheleslaw-com-contact`
- Tunnel ID: `610760cb-b4bf-45bc-a86b-63ff5d448d81`
- Tunnel config: `/root/necheleslaw-contact/cloudflared.yml`
- Tunnel service: `necheleslaw-com-contact-tunnel.service`
- Status on 2026-06-10:
  - `necheleslaw-com-contact-tunnel.service` is inactive and disabled.
  - `cloudflared tunnel list` no longer shows `necheleslaw-com-contact`.
  - `necheleslaw.com` contact form does not use a tunnel.

## Email-address scraping reduction

Scrubbed the static site so lawyer email addresses are not present in bot-scrapable plain text.

Changed:

- Removed raw `srn@necheleslaw.com` and `gstern@necheleslaw.com` from static HTML.
- Removed lawyer-specific `mailto:` links from attorney pages and archived WordPress JSON artifacts.
- Replaced visible attorney email text with PNG-rendered email images:
  - `/assets/email/susan-necheles-email.png`
  - `/assets/email/gedalia-stern-email.png`
- PNG image metadata was stripped so the raw email strings are not embedded as text inside the image files.

Verified:

- `rg` scan did not find raw `srn@...`, `gstern@...`, `[at] / [dot]` text, or lawyer `mailto:` links in `/root/necheleslaw-static-site`.
- `strings` scan did not find raw email strings in the PNG files.
- Live `https://necheleslaw.com/attorneys/` served image tags for the attorney emails.

## Files most likely to matter next

- `/root/necheleslaw-static-site/contact/index.html`
- `/root/necheleslaw-static-site/cloudflare/contact-worker/src/index.js`
- `/root/necheleslaw-static-site/cloudflare/contact-worker/wrangler.toml`
- `/root/necheleslaw-static-site/cloudflare/contact-worker/README.md`
