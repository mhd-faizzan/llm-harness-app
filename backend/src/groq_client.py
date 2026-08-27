import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "openai/gpt-oss-120b"


async def stream_chat(messages: list, tools: list):
    stream = await client.chat.completions.create(
        model=MODEL,
        messages=messages,
        tools=tools,
        stream=True,
    )

    tool_calls = {}
    content = ""

    async for chunk in stream:
        delta = chunk.choices[0].delta

        if delta.content:
            content += delta.content
            yield {"type": "content", "text": delta.content}

        if delta.tool_calls:
            for tc in delta.tool_calls:
                if tc.index not in tool_calls:
                    tool_calls[tc.index] = {"id": tc.id, "name": "", "arguments": ""}
                if tc.function.name:
                    tool_calls[tc.index]["name"] += tc.function.name
                if tc.function.arguments:
                    tool_calls[tc.index]["arguments"] += tc.function.arguments

    if tool_calls:
        for tc in tool_calls.values():
            yield {
                "type": "tool_call",
                "id": tc["id"],
                "name": tc["name"],
                "arguments": json.loads(tc["arguments"]),
            }
    else:
        yield {"type": "done", "content": content}