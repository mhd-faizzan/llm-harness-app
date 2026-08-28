import type { ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

const COMPONENTS = {
  a(props: { href?: string; children?: ReactNode }) {
    return (
      <a href={props.href} target="_blank" rel="noreferrer noopener">
        {props.children}
      </a>
    );
  },
  table(props: { children?: ReactNode }) {
    return (
      <div className="md-table-wrap">
        <table>{props.children}</table>
      </div>
    );
  },
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={COMPONENTS}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
