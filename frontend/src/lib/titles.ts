/**
 * Client-side conversation title overrides.
 *
 * The backend derives a title from the first message and has no rename
 * endpoint yet, so user edits are persisted locally and layered on top of the
 * server value wherever titles are shown.
 */
const KEY = "harness-title-overrides";

type Overrides = Record<string, string>;

// Reject keys that could pollute Object.prototype if the store is ever fed
// untrusted ids.
const UNSAFE_KEYS = new Set(["__proto__", "prototype", "constructor"]);

function read(): Overrides {
  const store: Overrides = Object.create(null) as Overrides;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "{}") as unknown;
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (!UNSAFE_KEYS.has(k) && typeof v === "string") store[k] = v;
      }
    }
  } catch {
    // corrupt / unavailable storage — start empty
  }
  return store;
}

export function getTitleOverride(id: string): string | undefined {
  if (UNSAFE_KEYS.has(id)) return undefined;
  return read()[id];
}

export function setTitleOverride(id: string, title: string) {
  if (UNSAFE_KEYS.has(id)) return;
  const all = read();
  const trimmed = title.trim();
  if (trimmed) all[id] = trimmed;
  else delete all[id];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("harness:titles"));
  } catch {
    // ignore persistence failures
  }
}
