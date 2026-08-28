import json
import asyncio
from datetime import datetime, timezone

from src.groq_client import stream_chat
from src.tools.tools import TOOL_SCHEMAS, TOOL_DISPATCH

SYSTEM_PROMPT = (
    "You are a helpful assistant with access to tools. "
    "Use web_search for anything current or recent. Use calculate for math. "
    "Use count_letter for letter counting. "
    "Use get_current_time for the current date or time in any timezone; never web_search for that. "
    "When you call web_search you MUST provide a non-empty 'query' string. "
    "Do not repeat the same search query. After at most a few searches, answer "
    "the user directly with what you found, even if the information is partial. "
    "The current date is {today} (UTC)."
)

MAX_ITERATIONS = 6


async def _force_answer(messages: list, note: str):
    """Last-resort pass: no tools, so the model must answer from what it has."""
    messages = messages + [{
        "role": "user",
        "content": "Stop searching. Answer now using the information you already have.",
    }]

    buffer = ""
    async for event in stream_chat(messages, tools=None):
        if event["type"] == "content":
            buffer += event["text"]
            yield {"type": "content", "text": event["text"]}
        elif event["type"] == "error":
            break

    yield {"type": "final", "content": buffer or note}


async def run_harness(user_message: str, history: list):
    system_prompt = SYSTEM_PROMPT.format(today=datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    messages = [{"role": "system", "content": system_prompt}] + history + [
        {"role": "user", "content": user_message}
    ]

    for _ in range(MAX_ITERATIONS):
        tool_calls_made = []
        content_buffer = ""
        stream_error = None

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

            elif event["type"] == "error":
                stream_error = event["message"]

        if stream_error is not None:
            # The model call broke mid-stream (often a malformed tool call).
            # If we already gathered context, salvage an answer; else report.
            if len(messages) > 2:
                async for event in _force_answer(messages, f"[model call failed: {stream_error}]"):
                    yield event
            else:
                yield {"type": "final", "content": f"[model call failed: {stream_error}]"}
            return

        if not tool_calls_made:
            yield {"type": "final", "content": content_buffer}
            return

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
            if func is None:
                result = f"unknown tool: {tc['name']}"
            else:
                try:
                    result = await asyncio.to_thread(func, **tc["arguments"])
                except TypeError as e:
                    result = f"invalid arguments for {tc['name']}: {e}"
                except Exception as e:
                    result = f"tool {tc['name']} failed: {e}"

            yield {"type": "tool_result", "name": tc["name"], "result": result}

            messages.append({
                "role": "tool",
                "tool_call_id": tc["id"],
                "content": result,
            })

    async for event in _force_answer(messages, "hit max iterations, stopping here"):
        yield event
