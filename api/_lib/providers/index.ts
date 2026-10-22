import { LicensedCatalogProvider } from "./licensed";
import { scrapedProviders } from "./scraped";
export const providers = [new LicensedCatalogProvider(), ...scrapedProviders];