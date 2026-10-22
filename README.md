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
- `AUTHORIZED_MEDIA_HOSTS`: comma-separated HTTPS hostnames you own or are licensed to use. Only those hosts are allowed by the source API.

## API routes

- `GET /api/health`
- `GET /api/search?q=naruto`
- `GET /api/anime/:id/episodes`
- `GET /api/episodes/:id/sources?audio=sub|dub`

## Licensed media

Edit `api/_lib/catalog.ts` or replace it with your CMS/database and authorized provider APIs. AniList and MAL metadata IDs are not automatically episode IDs; explicitly map a title to your licensed catalog. Add HLS/MP4/authorized embed sources with HTTPS URLs on your allowlisted media host. This repository does not scrape third-party streaming sites or bypass access restrictions.

## Deploy to Vercel

Import this GitHub repository into Vercel. Set `MAL_CLIENT_ID` and `AUTHORIZED_MEDIA_HOSTS` in Project Settings → Environment Variables, deploy, then check `/api/health`.
