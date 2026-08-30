import type { ModelOption } from "@/types/chat";

/**
 * Selectable models. The backend currently pins its own Groq model, so this is
 * primarily a UI affordance — the chosen id is still sent with each request so
 * the server can honour it once it supports routing.
 */
export const MODELS: [ModelOption, ...ModelOption[]] = [
  {
    id: "llama-3.3-70b-versatile",
    label: "Llama 3.3 70B",
    description: "Balanced default — fast tool use",
    provider: "groq",
  },
  {
    id: "llama-3.1-8b-instant",
    label: "Llama 3.1 8B",
    description: "Fastest, lighter reasoning",
    provider: "groq",
  },
  {
    id: "openai/gpt-oss-120b",
    label: "GPT-OSS 120B",
    description: "Strongest reasoning, slower",
    provider: "groq",
  },
];

export const DEFAULT_MODEL_ID = MODELS[0].id;

export function getModel(id: string): ModelOption {
  return MODELS.find((m) => m.id === id) ?? MODELS[0];
}
