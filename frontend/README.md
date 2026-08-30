# Frontend — LLM Harness Chat

A Claude/ChatGPT-style chat UI for the harness backend. Built to the spec in
`../DESIGN.md`.

**Stack:** React 19 · TypeScript (strict) · Vite · Tailwind CSS 4 · Radix UI
(`@radix-ui/react-dropdown-menu`) · react-markdown + remark-gfm + rehype-highlight
· lucide-react

## Scripts

```bash
npm run dev      # dev server on http://localhost:5173 (backend must be on :8000)
npm run build    # tsc -b && vite build
npm run lint     # oxlint
```

## Layout

```
src/
├── components/
│   ├── chat/          Sidebar, Header, MessageList, Message, Composer,
│   │                  ModelSelector, ToolTrace, Markdown, CodeBlock
│   └── ui/            IconButton (shared primitive, 44px hit target)
├── hooks/
│   ├── useChat.ts         streaming turn loop + abort/stop + regenerate
│   ├── useConversations.ts history list
│   ├── useAutoScroll.ts    pin-to-bottom while streaming
│   ├── useSidebar.ts       collapse (desktop) / drawer (mobile)
│   └── useTheme.ts         dark default, persisted
├── lib/
│   ├── models.ts     selectable models (sent with each request)
│   ├── time.ts       Today / Yesterday / Previous 7 days … grouping
│   ├── titles.ts     client-side conversation title overrides
│   └── utils.ts      cn() class merge
└── types/chat.ts     discriminated-union StreamEvent + message contracts
```

## Notes

- **Dark mode is the default.** Theme is stored in `localStorage` under
  `harness-theme` and applied before first paint by an inline script in
  `index.html`.
- The **model selector** is wired through to the request body (`{ message, model }`);
  the backend currently pins its own Groq model, so it is a forward-compatible
  no-op server-side today.
- **Inline title editing** (double-click the header title) persists locally only —
  the backend has no rename endpoint yet.
- Attachments/drag-and-drop from the DESIGN spec are stubbed (disabled button)
  pending a backend upload endpoint.
