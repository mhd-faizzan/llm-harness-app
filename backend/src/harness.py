import json
from src.groq_client import stream_chat
from src.tools.tools import TOOL_SCHEMAS, TOOL_DISPATCH

SYSTEM_PROMPT = "You are a helpful assistant with access to tools. Use web_search for anything current or recent. Use calculate for math. Use count_letter for letter counting."

MAX_ITERATIONS = 6


async def run_harness(user_message: str, history: list):
    messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history + [
        {"role": "user", "content": user_message}
    ]

    for _ in range(MAX_ITERATIONS):
        tool_calls_made = []
        content_buffer = ""

        async for event in stream_chat(messages, TOOL_SCHEMAS):
            if event["type"] == "content":
                content_buffer += event["text"]
                yield {"type": "content", "text": event["text"]}

            elif event["type"] == "tool_call":
                tool_calls_made.append(event)
                yield {"type": "tool_start", "name": event["name"], "args": event["arguments"]}

            elif event["type"] == "done":
                yield {"type": "final", "content": content_buffer}
                return

        if tool_calls_made:
            messages.append({
                "role": "assistant",
                "tool_calls": [
                    {
                        "id": tc["id"],
                        "type": "function",
                        "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])},
                    }
                    for tc in tool_calls_made
                ],
            })

            for tc in tool_calls_made:
                func = TOOL_DISPATCH.get(tc["name"])
                result = func(**tc["arguments"]) if func else "unknown tool"

                yield {"type": "tool_result", "name": tc["name"], "result": result}

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": result,
                })

    yield {"type": "final", "content": "hit max iterations, stopping here"}