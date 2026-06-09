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

## Contact form backend

Created a dedicated local backend:

- Directory: `/root/necheleslaw-contact`
- Service: `necheleslaw-contact.service`
- Local endpoint: `http://127.0.0.1:8791/contact`
- Health endpoint: `http://127.0.0.1:8791/health`
- Secret env file: `/root/necheleslaw-contact/.env`
- Email provider: Resend
- Sender configured as: `Necheles Law Website <contact@necheleslaw.com>`
- Recipients configured as: `srn@necheleslaw.com,gstern@necheleslaw.com`
- Subject configured as exactly: `NECHELESLAW.COM WEBSITE INQUIRY`

Verified:

- Resend initially rejected non-test recipients until domain DNS was authorized.
- Resend DNS records for `send.necheleslaw.com` and `resend._domainkey.necheleslaw.com` were added and verified.
- Root `necheleslaw.com` MX remained pointed to Microsoft 365: `necheleslaw-com.mail.protection.outlook.com`.
- After Resend verification, a controlled backend test to the real recipients returned `{"ok": true}`.
- User confirmed the test email was received.

## Cloudflare tunnel

Created a dedicated tunnel for the `.com` contact backend:

- Tunnel name: `necheleslaw-com-contact`
- Tunnel ID: `610760cb-b4bf-45bc-a86b-63ff5d448d81`
- Tunnel config: `/root/necheleslaw-contact/cloudflared.yml`
- Tunnel service: `necheleslaw-com-contact-tunnel.service`
- Intended hostname: `contact.necheleslaw.com`
- Current services checked active on 2026-06-09:
  - `necheleslaw-contact.service`
  - `necheleslaw-com-contact-tunnel.service`

Important caution:

- During routing, `cloudflared tunnel route dns necheleslaw-com-contact contact.necheleslaw.com` reported that it added `contact.necheleslaw.com.nycequities.net` to the existing `compliance` tunnel, because the local Cloudflare certificate appears tied to the `nycequities.net` zone.
- The dedicated `.com` tunnel service itself is running, but future work should verify and clean up any accidental `contact.necheleslaw.com.nycequities.net` route if it exists.

## Current public contact page state

Important:

- The public static contact page has not yet been fully rewired to post to the backend endpoint.
- Current contact page file: `/root/necheleslaw-static-site/contact/index.html`
- It still uses a JavaScript `mailto:` fallback that dynamically builds the recipient addresses at runtime.
- The raw lawyer email addresses are not embedded in page source, but a browser executing the script can still construct a mailto link.
- To complete the real contact-form implementation, change the public form script to `fetch()` the backend endpoint after confirming `https://contact.necheleslaw.com/contact` is publicly reachable with a valid certificate and correct CORS behavior.

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
- `/root/necheleslaw-contact/contact_server.py`
- `/root/necheleslaw-contact/.env`
- `/root/necheleslaw-contact/cloudflared.yml`
- `/etc/systemd/system/necheleslaw-contact.service`
- `/etc/systemd/system/necheleslaw-com-contact-tunnel.service`

