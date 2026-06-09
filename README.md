# necheleslaw.com Static Recovery

Static recovery of the March 17, 2026 Wayback Machine capture of `https://necheleslaw.com/`.

Source snapshot:

`https://web.archive.org/web/20260317070306/https://necheleslaw.com/`

This repository is intended for GitHub Pages hosting at `necheleslaw.com`.

Recovery notes:

- Main WordPress pages, images, Avada/Fusion CSS, JavaScript, fonts, sitemaps, and JSON metadata were recovered from the Internet Archive.
- The live site was returning Cloudflare 521 while Cloudflare pointed at a broken Network Solutions origin.
- `recovery-download.log` records which archived URLs were successfully recovered and which failed.
- `recovery-cdx.json` is the Wayback CDX inventory used during recovery.

Deployment target:

- GitHub Pages custom domain: `necheleslaw.com`
- Cloudflare DNS should point `necheleslaw.com` and `www.necheleslaw.com` to GitHub Pages unless a Cloudflare Tunnel deployment is deliberately chosen instead.
