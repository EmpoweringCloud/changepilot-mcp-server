import { apiGet, ClientConfig } from "../client.js";

export async function listTaxonomyProducts(cfg: ClientConfig) {
  return apiGet(cfg, "/reporting/taxonomy/products");
}

export async function listTaxonomyStatuses(cfg: ClientConfig) {
  return apiGet(cfg, "/reporting/taxonomy/statuses");
}

export async function listTaxonomyChangeCategories(cfg: ClientConfig) {
  return apiGet(cfg, "/reporting/taxonomy/change-categories");
}
