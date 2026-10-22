import * as cheerio from "cheerio";
import type { Anime, Episode, StreamSource, AudioType } from "../../../src/types";

export interface HtmlProviderConfig {
  id: "reanime" | "hianime" | "animepahe";
  name: string;
  baseUrl: string;
  searchPath: (query: string) => string;
}
const headers = { "user-agent": "AniScroll/0.1 (authorized metadata integration)", "accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8" };

export async function fetchPage(url: URL): Promise<{ html: string; finalUrl: URL }> {
  const response = await fetch(url, { headers, redirect: "follow", signal: AbortSignal.timeout(9000) });
  if (!response.ok) throw new Error("Provider returned HTTP " + response.status);
  const finalUrl = new URL(response.url);
  if (finalUrl.hostname !== url.hostname) throw new Error("Provider redirected outside its configured host");
  const html = await response.text();
  if (html.length > 4_000_000) throw new Error("Provider page exceeded the 4 MB parsing limit");
  return { html, finalUrl };
}
const cleanText = (value: string | undefined) => (value || "").replace(/\s+/g, " ").trim();
function absolute(value: string | undefined, base: URL): URL | undefined {
  if (!value) return undefined;
  try { const url = new URL(value, base); return url.protocol === "https:" && !url.username && !url.password ? url : undefined; }
  catch { return undefined; }
}
export function parseSearch(config: HtmlProviderConfig, html: string, base: URL, query: string): Anime[] {
  const $ = cheerio.load(html), seen = new Set<string>(), results: Anime[] = [];
  const selectors = ".flw-item,.film_list-wrap .item,.anime-card,.poster,.search-result,article,[data-anime-id],.anime-list .item";
  for (const node of $(selectors).toArray()) {
    const card = $(node);
    const link = card.find("a[href]").toArray().map(a => absolute($(a).attr("href"), base)).find(u => u && u.hostname === base.hostname);
    if (!link) continue;
    const title = cleanText(card.find("[title]").first().attr("title") || card.find(".film-name,.dynamic-name,.name,.title,h3,h4").first().text() || card.find("a").first().text());
    if (!title || title.length > 180 || seen.has(link.pathname + link.search)) continue;
    seen.add(link.pathname + link.search);
    const image = absolute(card.find("img").first().attr("data-src") || card.find("img").first().attr("data-lazy-src") || card.find("img").first().attr("src"), base);
    results.push({ id: config.id + ":" + encodeURIComponent(link.pathname + link.search), provider: config.id, title, englishTitle: title, posterUrl: image?.href, description: cleanText(card.find(".description,.film-description,p").first().text()) || undefined });
    if (results.length >= 20) break;
  }
  if (!results.length) $("a[href]").each((_i, el) => {
    if (results.length >= 20) return;
    const link = absolute($(el).attr("href"), base), title = cleanText($(el).attr("title") || $(el).text());
    if (!link || link.hostname !== base.hostname || !title || title.length > 180 || !title.toLowerCase().includes(query.toLowerCase()) || seen.has(link.pathname + link.search)) return;
    seen.add(link.pathname + link.search);
    results.push({ id: config.id + ":" + encodeURIComponent(link.pathname + link.search), provider: config.id, title, englishTitle: title });
  });
  return results;
}
export function parseEpisodes(config: HtmlProviderConfig, html: string, base: URL, animeId: string): Episode[] {
  const $ = cheerio.load(html), seen = new Set<string>(), episodes: Episode[] = [];
  const selectors = ".ss-list a[href],.episode-list a[href],.episodes a[href],.eps-item a[href],.ep-item a[href],.detail-infor-content a[href],a[href*='/watch/'],a[href*='-episode-'],a[href*='episode']";
  $(selectors).each((_i, el) => {
    const link = absolute($(el).attr("href"), base);
    if (!link || link.hostname !== base.hostname || link.pathname === base.pathname && link.search === base.search) return;
    const label = cleanText($(el).attr("title") || $(el).text() || $(el).attr("aria-label"));
    const match = (label + " " + link.pathname).match(/(?:episode|ep)[\s._-]*(\d+(?:\.\d+)?)/i) || label.match(/^\s*(\d+(?:\.\d+)?)\s*$/);
    if (!match || seen.has(link.pathname + link.search)) return;
    const number = Number(match[1]);
    if (!Number.isFinite(number) || number < 0 || number > 10000) return;
    seen.add(link.pathname + link.search);
    episodes.push({ id: config.id + ":" + encodeURIComponent(link.pathname + link.search), animeId, number, title: label || "Episode " + number, audioOptions: ["sub", "dub"] });
  });
  return episodes.sort((a,b) => a.number-b.number).slice(0,500);
}
export function parseSources(config: HtmlProviderConfig, html: string, base: URL, episodeId: string, audio: AudioType): StreamSource[] {
  const $ = cheerio.load(html), sources: StreamSource[] = [], seen = new Set<string>();
  const add = (raw: string | undefined, label: string, forced?: "hls" | "mp4" | "embed") => {
    const url = absolute(raw, base);
    if (!url || seen.has(url.href)) return;
    const path = url.pathname.toLowerCase();
    const playbackType = forced || (path.endsWith(".m3u8") ? "hls" : path.endsWith(".mp4") ? "mp4" : "embed");
    seen.add(url.href);
    sources.push({ id: config.id + ":" + (sources.length + 1) + ":" + encodeURIComponent(url.href), provider: config.id, serverName: cleanText(label) || config.name + " source " + (sources.length + 1), audio, playbackType, playbackUrl: url.href });
  };
  $("video[src],video source[src],source[src]").each((_i, el) => add($(el).attr("src"), $(el).attr("label") || $(el).attr("title") || "Direct video"));
  $("iframe[src]").each((_i, el) => add($(el).attr("src"), $(el).attr("title") || $(el).attr("data-server") || "Embedded player", "embed"));
  $("a[href]").each((_i, el) => { const href = $(el).attr("href"); if (href && /\.(m3u8|mp4)(?:$|\?)/i.test(href)) add(href, $(el).text() || "Direct video"); });
  // Intentionally do not execute scripts, decode obfuscated payloads, or call undocumented endpoints.
  return sources.filter(s => s.playbackUrl.startsWith("https://")).slice(0,20);
}
export function decodeProviderId(id: string, expected: HtmlProviderConfig["id"]): URL | undefined {
  const prefix = expected + ":";
  if (!id.startsWith(prefix)) return undefined;
  try {
    const base = new URL(providerBase(expected)), url = new URL(decodeURIComponent(id.slice(prefix.length)), base);
    return url.hostname === base.hostname && url.protocol === "https:" ? url : undefined;
  } catch { return undefined; }
}
export function providerBase(id: HtmlProviderConfig["id"]): string {
  switch (id) { case "reanime": return "https://reanime.to"; case "hianime": return "https://hianime.at"; case "animepahe": return "https://animepahe.ng"; }
}
