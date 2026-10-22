import type { Anime, Episode, StreamSource, AudioType } from "../../../src/types";
import type { ProviderAdapter } from "./types";
import { decodeProviderId, fetchPage, parseEpisodes, parseSearch, parseSources, type HtmlProviderConfig } from "./html";

const configs: HtmlProviderConfig[] = [
  { id: "hianime", name: "HiAnime", baseUrl: "https://hianime.at", searchPath: q => "/search?keyword=" + encodeURIComponent(q) },
  { id: "reanime", name: "ReAnime", baseUrl: "https://reanime.to", searchPath: q => "/search?keyword=" + encodeURIComponent(q) },
  { id: "animepahe", name: "AnimePahe", baseUrl: "https://animepahe.ng", searchPath: q => "/?s=" + encodeURIComponent(q) },
];
class ScrapedHtmlProvider implements ProviderAdapter {
  readonly id: string;
  constructor(private readonly config: HtmlProviderConfig) { this.id = config.id; }
  async search(query: string): Promise<Anime[]> {
    if (!query.trim() || query.length > 100) return [];
    const { html, finalUrl } = await fetchPage(new URL(this.config.searchPath(query), this.config.baseUrl));
    return parseSearch(this.config, html, finalUrl, query);
  }
  async getEpisodes(animeId: string): Promise<Episode[]> {
    const url = decodeProviderId(animeId, this.config.id);
    if (!url) return [];
    const { html, finalUrl } = await fetchPage(url);
    return parseEpisodes(this.config, html, finalUrl, animeId);
  }
  async getSources(episodeId: string, audio: AudioType): Promise<StreamSource[]> {
    const url = decodeProviderId(episodeId, this.config.id);
    if (!url) return [];
    const { html, finalUrl } = await fetchPage(url);
    return parseSources(this.config, html, finalUrl, episodeId, audio);
  }
}
const enabled = process.env.ENABLE_AUTHORIZED_SCRAPERS === "true";
export const scrapedProviders: ProviderAdapter[] = enabled ? configs.map(config => new ScrapedHtmlProvider(config)) : [];
