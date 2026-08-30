import type { Conversation } from "@/types/chat";

export type HistoryBucket =
  | "Today"
  | "Yesterday"
  | "Previous 7 days"
  | "Previous 30 days"
  | "Older";

const BUCKET_ORDER: HistoryBucket[] = [
  "Today",
  "Yesterday",
  "Previous 7 days",
  "Previous 30 days",
  "Older",
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function bucketFor(iso: string, reference = new Date()): HistoryBucket {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "Older";
  const dayMs = 86_400_000;
  const today = startOfDay(reference);
  const diffDays = Math.round((today - startOfDay(then)) / dayMs);

  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays <= 7) return "Previous 7 days";
  if (diffDays <= 30) return "Previous 30 days";
  return "Older";
}

export interface HistoryGroup {
  bucket: HistoryBucket;
  items: Conversation[];
}

/** Group conversations (already newest-first) into labelled date buckets. */
export function groupConversations(items: Conversation[]): HistoryGroup[] {
  const map = new Map<HistoryBucket, Conversation[]>();
  for (const item of items) {
    const bucket = bucketFor(item.createdAt);
    const list = map.get(bucket) ?? [];
    list.push(item);
    map.set(bucket, list);
  }
  return BUCKET_ORDER.filter((b) => map.has(b)).map((bucket) => ({
    bucket,
    items: map.get(bucket)!,
  }));
}
