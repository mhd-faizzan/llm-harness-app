import ast
import operator
import logging

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
    "web_search": web_search,
}