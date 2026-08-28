import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager
from sqlalchemy import select

from src.db.database import init_db, async_session
from src.db.models import Conversation, Message
from src.harness import run_harness


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/conversations")
async def list_conversations():
    async with async_session() as session:
        result = await session.execute(select(Conversation).order_by(Conversation.created_at.desc()))
        conversations = result.scalars().all()
        return [{"id": c.id, "title": c.title, "created_at": c.created_at.isoformat()} for c in conversations]


@app.get("/conversations/{conversation_id}/messages")
async def list_messages(conversation_id: str):
    async with async_session() as session:
        result = await session.execute(
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
        )
        messages = result.scalars().all()
        return [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at.isoformat(),
            }
            for m in messages
        ]


@app.post("/chat/{conversation_id}")
async def chat(conversation_id: str, body: dict):
    user_message = body["message"]

    async def event_stream():
        async with async_session() as session:
            exists = await session.get(Conversation, conversation_id)
            if not exists:
                title = user_message.strip().splitlines()[0][:60] or "New Chat"
                session.add(Conversation(id=conversation_id, title=title))
                await session.commit()

            session.add(Message(conversation_id=conversation_id, role="user", content=user_message))
            await session.commit()

            final_content = ""
            try:
                async for event in run_harness(user_message, []):
                    if event["type"] == "final":
                        final_content = event["content"]

                    yield f"data: {json.dumps(event)}\n\n"
            except Exception as e:
                final_content = f"[server error: {e}]"
                yield f"data: {json.dumps({'type': 'final', 'content': final_content})}\n\n"

            session.add(Message(conversation_id=conversation_id, role="assistant", content=final_content))
            await session.commit()

    return StreamingResponse(event_stream(), media_type="text/event-stream")