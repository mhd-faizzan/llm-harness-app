import ast
import operator
import logging
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from ddgs import DDGS

logger = logging.getLogger(__name__)

_ALLOWED_OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
}


def _eval_node(node: ast.AST) -> float:
    if isinstance(node, ast.Constant):
        return node.value
    if isinstance(node, ast.BinOp):
        op_func = _ALLOWED_OPS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"operator {type(node.op).__name__} not allowed")
        return op_func(_eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp):
        op_func = _ALLOWED_OPS.get(type(node.op))
        if op_func is None:
            raise ValueError(f"operator {type(node.op).__name__} not allowed")
        return op_func(_eval_node(node.operand))
    raise ValueError(f"unsupported expression: {ast.dump(node)}")


def calculate(expression: str) -> str:
    try:
        tree = ast.parse(expression, mode="eval")
        result = _eval_node(tree.body)
        return str(result)
    except Exception as e:
        return f"error evaluating expression: {e}"


def count_letter(word: str, letter: str) -> str:
    count = word.lower().count(letter.lower())
    return f"'{letter}' appears {count} time(s) in '{word}'"


def get_current_time(timezone: str = "UTC") -> str:
    try:
        tz = ZoneInfo(timezone)
    except (ZoneInfoNotFoundError, ValueError):
        return f"unknown timezone: '{timezone}'. Use an IANA name like 'Europe/Berlin' or 'UTC'."

    now = datetime.now(tz)
    return now.strftime(f"%Y-%m-%d %H:%M:%S %Z (UTC%z), %A") + f" [{timezone}]"


def web_search(query: str) -> str:
    try:
        results = DDGS().text(query, max_results=3)
        if not results:
            return "no results found"
        return "\n".join(f"{r['title']}: {r['body']}" for r in results)
    except Exception as e:
        logger.error("web search failed: %s", str(e))
        return f"search failed: {e}"


TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "calculate",
            "description": "Evaluate an exact math expression.",
            "parameters": {
                "type": "object",
                "properties": {"expression": {"type": "string"}},
                "required": ["expression"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "count_letter",
            "description": "Count exact occurrences of a letter in a word.",
            "parameters": {
                "type": "object",
                "properties": {
                    "word": {"type": "string"},
                    "letter": {"type": "string"},
                },
                "required": ["word", "letter"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_current_time",
            "description": "Get the current date and time in a given timezone. Use this for any 'what time is it' or 'current date' question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "timezone": {
                        "type": "string",
                        "description": "IANA timezone name, e.g. 'Europe/Berlin', 'America/New_York', 'UTC'. Defaults to UTC.",
                    }
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "web_search",
            "description": "Search the web for current, real-time info.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"],
            },
        },
    },
]

TOOL_DISPATCH = {
    "calculate": calculate,
    "count_letter": count_letter,
    "get_current_time": get_current_time,
    "web_search": web_search,
}