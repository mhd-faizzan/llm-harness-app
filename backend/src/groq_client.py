import os
import json
from groq import AsyncGroq
from dotenv import load_dotenv

load_dotenv()

client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
MODEL = "openai/gpt-oss-120b"


async def stream_chat(messages: list, tools: list | None = None):
    try:
        kwargs = {"model": MODEL, "messages": messages, "stream": True}
        if tools:
            kwargs["tools"] = tools

        stream = await client.chat.completions.create(**kwargs)

        tool_calls = {}
        content = ""

        async for chunk in stream:
            if not chunk.choices:
                continue
            delta = chunk.choices[0].delta

            if delta.content:
                content += delta.content
                yield {"type": "content", "text": delta.content}

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    if tc.index not in tool_calls:
                        tool_calls[tc.index] = {"id": tc.id, "name": "", "arguments": ""}
                    if tc.id:
                        tool_calls[tc.index]["id"] = tc.id
                    if tc.function and tc.function.name:
                        tool_calls[tc.index]["name"] += tc.function.name
                    if tc.function and tc.function.arguments:
                        tool_calls[tc.index]["arguments"] += tc.function.arguments
    except Exception as e:
        yield {"type": "error", "message": str(e)}
        return

    if tool_calls:
        for tc in tool_calls.values():
            if not tc["name"]:
                continue
            try:
                args = json.loads(tc["arguments"]) if tc["arguments"].strip() else {}
            except (json.JSONDecodeError, AttributeError):
                args = {}
            yield {
                "type": "tool_call",
                "id": tc["id"],
                "name": tc["name"],
                "arguments": args,
            }
    else:
        yield {"type": "done", "content": content}
