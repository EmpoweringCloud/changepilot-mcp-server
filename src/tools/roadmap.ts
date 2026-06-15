import { z } from "zod";
import { apiGet, ClientConfig } from "../client.js";

const ROADMAP_SORT = [
  "roadmapId",
  "title",
  "dateAdded",
  "lastModified",
  "rolloutStart",
  "status",
  "product",
] as const;

const ROADMAP_STATUSES = [
  "In development",
  "Rolling out",
  "Launched",
  "Cancelled",
] as const;

export const listRoadmapItemsSchema = {
  q: z.string().optional(),
  status: z.array(z.enum(ROADMAP_STATUSES)).optional(),
  product: z.array(z.string()).optional(),
  platform: z.array(z.string()).optional(),
  cloudInstance: z.array(z.string()).optional(),
  dateAddedFrom: z.string().optional(),
  dateAddedTo: z.string().optional(),
  rolloutStartFrom: z.string().optional(),
  rolloutStartTo: z.string().optional(),
  sort: z.enum(ROADMAP_SORT).optional().default("dateAdded"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(500).optional().default(50),
};

export async function listRoadmapItems(cfg: ClientConfig, args: Record<string, unknown>) {
  return apiGet(cfg, "/reporting/roadmap/items", args);
}

export const getRoadmapItemSchema = {
  roadmapId: z.string().describe("Numeric Microsoft 365 Roadmap ID, e.g. '395820'"),
};

export async function getRoadmapItem(cfg: ClientConfig, args: { roadmapId: string }) {
  return apiGet(cfg, `/reporting/roadmap/items/${encodeURIComponent(args.roadmapId)}`);
}

export const getRoadmapItemHistorySchema = {
  roadmapId: z.string(),
};

export async function getRoadmapItemHistory(cfg: ClientConfig, args: { roadmapId: string }) {
  return apiGet(cfg, `/reporting/roadmap/items/${encodeURIComponent(args.roadmapId)}/history`);
}

export const listRoadmapDateChangesSchema = {
  q: z.string().optional(),
  product: z.array(z.string()).optional(),
  status: z.array(z.enum(ROADMAP_STATUSES)).optional(),
  from: z.string().optional().describe("Lower bound on the event timestamp (ISO date)"),
  to: z.string().optional().describe("Upper bound on the event timestamp (ISO date)"),
  sort: z.enum(["roadmapId", "title", "status", "product", "dateOfUpdate"]).optional().default("dateOfUpdate"),
  order: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().int().min(1).optional().default(1),
  pageSize: z.number().int().min(1).max(500).optional().default(50),
};

export async function listRoadmapDateChanges(cfg: ClientConfig, args: Record<string, unknown>) {
  return apiGet(cfg, "/reporting/roadmap/date-changes", args);
}

export async function getRoadmapMeta(cfg: ClientConfig) {
  return apiGet(cfg, "/reporting/roadmap/meta");
}
