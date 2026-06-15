import { z } from "zod";
import { apiGet, ClientConfig } from "../client.js";

// Tool schemas mirror the .NET DTOs in Reports/Models/.  We keep the shapes
// shallow on purpose: the LLM lists items, then asks for a detail record
// when it needs the rich fields.

const MC_SORT = [
  "mcid",
  "title",
  "dateAdded",
  "lastModified",
  "deployStartDate",
  "deployEndDate",
  "previewDate",
  "productCategory",
  "adminImpact",
  "userImpact",
] as const;

export const listMessageCenterItemsSchema = {
  q: z.string().optional().describe("Free-text search across MCID, title, description"),
  product: z.array(z.string()).optional().describe("Filter to one or more product labels (e.g. 'Microsoft Teams')"),
  productCategory: z.array(z.string()).optional(),
  changeCategory: z.array(z.string()).optional().describe("e.g. 'Plan for change', 'Prevent or fix issue'"),
  adminImpact: z.array(z.enum(["High", "Medium", "Low"])).optional(),
  userImpact: z.array(z.enum(["High", "Medium", "Low"])).optional(),
  hasPreviewDate: z.boolean().optional(),
  dateAddedFrom: z.string().optional().describe("ISO 8601 date or datetime"),
  dateAddedTo: z.string().optional(),
  lastModifiedFrom: z.string().optional(),
  lastModifiedTo: z.string().optional(),
  deployStartFrom: z.string().optional(),
  deployStartTo: z.string().optional(),
  sort: z.enum(MC_SORT).optional().default("lastModified"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(500).optional().default(50),
};

export async function listMessageCenterItems(cfg: ClientConfig, args: Record<string, unknown>) {
  return apiGet(cfg, "/reporting/message-center/items", args);
}

export const getMessageCenterItemSchema = {
  mcid: z.string().describe("The Microsoft Message Center ID, e.g. MC1387806"),
};

export async function getMessageCenterItem(cfg: ClientConfig, args: { mcid: string }) {
  return apiGet(cfg, `/reporting/message-center/items/${encodeURIComponent(args.mcid)}`);
}

export const getMessageCenterItemEventsSchema = {
  mcid: z.string(),
};

export async function getMessageCenterItemEvents(cfg: ClientConfig, args: { mcid: string }) {
  return apiGet(cfg, `/reporting/message-center/items/${encodeURIComponent(args.mcid)}/events`);
}

export async function getMessageCenterMeta(cfg: ClientConfig) {
  return apiGet(cfg, "/reporting/message-center/meta");
}
