import { lazy, Suspense } from "react";

// react-markdown + rehype-highlight + highlight.js are heavy (~450kB raw).
// Split them into their own chunk so the initial paint / empty state stays lean;
// the chunk loads the first time an assistant message renders and is cached after.
const Markdown = lazy(() =>
  import("./Markdown").then((m) => ({ default: m.Markdown }))
);

export function MarkdownAsync({ children }: { children: string }) {
  return (
    <Suspense
      fallback={
        <div className="prose-msg whitespace-pre-wrap">{children}</div>
      }
    >
      <Markdown>{children}</Markdown>
    </Suspense>
  );
}
