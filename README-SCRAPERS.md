# Authorized provider scraper adapters

This branch adds best-effort HTML adapters for ReAnime, HiAnime, and AnimePahe. They are **off by default** and inspect ordinary, directly exposed HTML links, video/source tags, and iframe URLs. They do not execute provider scripts, reverse-engineer obfuscated payloads, call undocumented extraction APIs, bypass access controls, or defeat DRM.

## Enable a permitted integration test

Set these Vercel environment variables only after confirming your permission covers automated requests to the relevant sites:

```env
ENABLE_AUTHORIZED_SCRAPERS=true
AUTHORIZED_MEDIA_HOSTS=your-authorized-media.example,player-you-are-authorized-to-embed.example
```

Search paths and HTML selectors are initial conventions, not verified provider contracts. Empty results mean the adapter needs a provider-specific, permission-approved route/selector update; do not bypass bot protection or login requirements.

- Scrapers are disabled unless `ENABLE_AUTHORIZED_SCRAPERS=true`.
- Only HTTPS pages on each adapter's configured host are fetched; cross-host redirects are rejected.
- Requests time out after 9 seconds and HTML is capped at 4 MB.
- Playback URLs must pass the existing `AUTHORIZED_MEDIA_HOSTS` allowlist.
- Only direct media and iframe URLs exposed in standard HTML are discovered. Embedded players may disallow framing or require provider authorization.
- Live page compatibility has not yet been validated in this environment.

## Smoke test

```bash
npm install
npm run typecheck
npm run build
ENABLE_AUTHORIZED_SCRAPERS=true npm run dev
curl 'http://localhost:3000/api/search?q=black%20clover'
```
