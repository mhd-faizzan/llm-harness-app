import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from contextlib import asynccontextmanager

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


@app.post("/chat/{conversation_id}")
async def chat(conversation_id: str, body: dict):
    user_message = body["message"]

    async def event_stream():
        async with async_session() as session:
            exists = await session.get(Conversation, conversation_id)
            if not exists:
                session.add(Conversation(id=conversation_id))
                await session.commit()

            session.add(Message(conversation_id=conversation_id, role="user", content=user_message))
            await session.commit()

            final_content = ""
            async for event in run_harness(user_message, []):
                if event["type"] == "final":
                    final_content = event["content"]

                yield f"data: {json.dumps(event)}\n\n"

            session.add(Message(conversation_id=conversation_id, role="assistant", content=final_content))
            await session.commit()

    return StreamingResponse(event_stream(), media_type="text/event-stream")