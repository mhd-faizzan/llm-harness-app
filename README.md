# LLM Harness Chat

A ChatGPT-style chat app, but the model actually checks its work instead of guessing.

## What's the problem this solves

Ask any LLM "how many r's are in strawberry" or "what's the news today" and it'll often just make something up that sounds right. That's because the model has no memory of right-now, and no real way to count letters one by one, it just predicts the next word.

This app gives the model tools it can actually call mid-conversation:
- a calculator, for exact math
- a letter counter, for exact string counting
- a live web search, for anything happening right now

So instead of guessing, the model stops and checks. You can literally watch it happen in the UI, small "searching web" / "calculating" chips show up before the answer.

## How it works

1. You type a message
2. It goes to the backend (FastAPI + Groq)
3. The model decides if it needs a tool or can just answer
4. If it needs a tool, it calls it, gets a real result back, and keeps going
5. This loops until it has a real answer, not a guess
6. Everything streams back to you live, word by word

That loop (call model → check if it wants a tool → run the tool → feed the result back → repeat) is what people call an "agent harness." It's the same basic idea behind tools like Claude Code, just built here from scratch so it's easy to see what's actually happening under the hood.

## Tech stack

**Backend:** Python, FastAPI, Groq API, SQLite (for saving chat history locally)
**Frontend:** React, TypeScript, Vite

## Running it locally

You need two terminals open at the same time.

**Terminal 1 — backend:**
```bash
cd backend
uv run uvicorn app:app --reload --port 8000
```

**Terminal 2 — frontend:**
```bash
cd frontend
npm run dev
```

Then open `http://localhost:5173` in your browser.

You'll also need a free Groq API key in `backend/.env`:
```
GROQ_API_KEY=your_key_here
```
Get one at [console.groq.com/keys](https://console.groq.com/keys)

## Project structure

```
llm-harness-app/
├── backend/
│   ├── src/
│   │   ├── tools/       tools the model can call
│   │   ├── db/          chat history storage
│   │   ├── harness.py   the actual agent loop
│   │   └── groq_client.py
│   └── app.py           the API server
└── frontend/
    └── src/
        ├── components/  chat UI pieces
        └── hooks/        streaming + theme logic
```

## Why I built this

I wanted to actually understand what's happening inside tools like Claude Code or ChatGPT plugins instead of just using them. Turns out it's not magic, it's just a loop with good bookkeeping. Building it from scratch made that click.