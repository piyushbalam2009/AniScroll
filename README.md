# AniScroll

TypeScript anime discovery frontend and API for AniList + MyAnimeList metadata and playback of owned/licensed content.

## Setup in GitHub Codespaces

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open the Vercel dev URL. `npm run dev:web` runs only Vite; API routes require Vercel CLI.

## Environment

- `MAL_CLIENT_ID`: optional server-side MyAnimeList API client ID.
- `AUTHORIZED_MEDIA_HOSTS`: comma-separated HTTPS media/player hostnames you are authorized to use. Only these hosts are allowed by the playback API.
- `ENABLE_AUTHORIZED_SCRAPERS`: set to `true` only for provider integrations covered by your permission. Defaults to `false`.

## API routes

- `GET /api/health`
- `GET /api/search?q=naruto`
- `GET /api/anime/:id/episodes`
- `GET /api/episodes/:id/sources?audio=sub|dub`

## Licensed media

Edit `api/_lib/catalog.ts` or replace it with your CMS/database and authorized provider APIs. AniList and MAL metadata IDs are not automatically episode IDs; explicitly map a title to your licensed catalog. Add HLS/MP4/authorized embed sources with HTTPS URLs on your allowlisted media host. This branch includes opt-in, best-effort HTML adapters for ReAnime, HiAnime, and AnimePahe. See [README-SCRAPERS.md](README-SCRAPERS.md) for limitations and test steps. Adapters inspect only ordinary HTML links, video/source tags, and iframe URLs; they do not bypass access controls or DRM.

## Deploy to Vercel

Import this GitHub repository into Vercel. Set `MAL_CLIENT_ID`, `AUTHORIZED_MEDIA_HOSTS`, and (only when permitted) `ENABLE_AUTHORIZED_SCRAPERS` in Project Settings → Environment Variables, deploy, then check `/api/health`. Run `npm run typecheck` and `npm run build` before deployment.
