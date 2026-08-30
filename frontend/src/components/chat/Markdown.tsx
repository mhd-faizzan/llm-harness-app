import { memo, isValidElement } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import { CodeBlock } from "./CodeBlock";

/**
 * Sanitize schema: the default (safe) allow-list, extended only to keep the
 * `class` attributes that `rehype-highlight` adds for syntax colouring. Class
 * names cannot execute, and raw HTML is still stripped (no `rehype-raw`).
 */
const schema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "span"],
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
  },
};

/** Recursively flatten React children to a plain string (for copy-to-clipboard). */
function toText(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(toText).join("");
  if (isValidElement(node)) {
    return toText((node.props as { children?: ReactNode }).children);
  }
  return "";
}

const components = {
  a(props: ComponentPropsWithoutRef<"a">) {
    return <a {...props} target="_blank" rel="noreferrer noopener" />;
  },
  table(props: ComponentPropsWithoutRef<"table">) {
    return (
      <div className="md-table-wrap scrollable">
        <table {...props} />
      </div>
    );
  },
  pre(props: ComponentPropsWithoutRef<"pre">) {
    const child = props.children;
    if (isValidElement(child)) {
      const codeProps = child.props as {
        className?: string;
        children?: ReactNode;
      };
      return (
        <CodeBlock className={codeProps.className} raw={toText(codeProps.children)}>
          {codeProps.children}
        </CodeBlock>
      );
    }
    return <pre {...props} />;
  },
};

export const Markdown = memo(function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-msg">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
          [rehypeSanitize, schema],
        ]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
});
