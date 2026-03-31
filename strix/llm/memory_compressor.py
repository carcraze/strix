import logging
from typing import Any

import litellm

from strix.config.config import Config, resolve_llm_config


logger = logging.getLogger(__name__)


# Token budget — Gemini 2.5 Pro has 1M context. We use 200k to stay cost-effective
# while giving the security agent ample room for deep multi-phase scans.
# Increase to 500_000 for subscription (deep) scans if needed.
MAX_TOTAL_TOKENS = 200_000
MIN_RECENT_MESSAGES = 20  # Security agents need more recent turns to avoid re-testing

SUMMARY_PROMPT_TEMPLATE = """You are the Zentinel Engine memory compression module.
Your job is to compress conversation history from an autonomous security assessment
while preserving ALL operationally critical information so the agent can continue
without losing any ground.

SECURITY-CRITICAL — MUST PRESERVE (verbatim where possible):
- Every confirmed vulnerability: exact endpoint, parameter, payload, HTTP method, response
- CVSS scores and severity ratings already determined
- Proof-of-Concept payloads that have been validated
- Credentials, tokens, API keys, and secrets discovered during the scan
- Exact file paths, line numbers, and code snippets with vulnerabilities
- CVE IDs and affected dependency versions
- Infrastructure details: IPs, ports, services, technologies, version numbers
- Authentication bypass techniques that worked
- Endpoints already tested AND their results (to avoid duplicate testing)
- Failed attack attempts and dead ends (critical — saves wasted iterations)
- Decisions made about testing approach and next steps planned

COMPRESSION GUIDELINES:
- Verbose tool stdout/stderr → keep only findings and anomalies, discard clean output
- Repetitive scan output → consolidate into "X endpoints tested, N findings"
- Keep exact technical artifacts: URLs, hashes, tokens, paths, parameter names
- Preserve error messages verbatim — they often contain vulnerability indicators
- Compress repeated identical tool calls into a summary with results
- Never discard a FINDING_N block — always preserve in full

OUTPUT FORMAT:
<context_summary message_count='{count}'>
SCAN PROGRESS: [what phases are complete]
CONFIRMED FINDINGS: [list each with severity + endpoint + proof]
TESTED & CLEAN: [endpoints/components verified safe]
DISCOVERED ASSETS: [subdomains, endpoints, technologies, credentials]
NEXT PLANNED: [what the agent intended to do next]
RAW DETAILS: [any verbatim technical data not captured above]
</context_summary>

CONVERSATION SEGMENT TO COMPRESS:
{conversation}"""


def _count_tokens(text: str, model: str) -> int:
    try:
        count = litellm.token_counter(model=model, text=text)
        return int(count)
    except Exception:
        logger.exception("Failed to count tokens")
        return len(text) // 4  # Rough estimate


def _get_message_tokens(msg: dict[str, Any], model: str) -> int:
    content = msg.get("content", "")
    if isinstance(content, str):
        return _count_tokens(content, model)
    if isinstance(content, list):
        return sum(
            _count_tokens(item.get("text", ""), model)
            for item in content
            if isinstance(item, dict) and item.get("type") == "text"
        )
    return 0


def _extract_message_text(msg: dict[str, Any]) -> str:
    content = msg.get("content", "")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, dict):
                if item.get("type") == "text":
                    parts.append(item.get("text", ""))
                elif item.get("type") == "image_url":
                    parts.append("[IMAGE]")
        return " ".join(parts)

    return str(content)


def _summarize_messages(
    messages: list[dict[str, Any]],
    model: str,
    timeout: int = 30,
) -> dict[str, Any]:
    if not messages:
        empty_summary = "<context_summary message_count='0'>{text}</context_summary>"
        return {
            "role": "user",
            "content": empty_summary.format(text="No messages to summarize"),
        }

    formatted = []
    for msg in messages:
        role = msg.get("role", "unknown")
        text = _extract_message_text(msg)
        formatted.append(f"{role}: {text}")

    conversation = "\n".join(formatted)
    prompt = SUMMARY_PROMPT_TEMPLATE.format(conversation=conversation)

    _, api_key, api_base = resolve_llm_config()

    try:
        completion_args: dict[str, Any] = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "timeout": timeout,
        }
        if api_key:
            completion_args["api_key"] = api_key
        if api_base:
            completion_args["api_base"] = api_base

        response = litellm.completion(**completion_args)
        summary = response.choices[0].message.content or ""
        if not summary.strip():
            return messages[0]
        # Summary already contains the <context_summary> wrapper from the prompt template
        # If not, wrap it for consistency
        if "<context_summary" not in summary:
            summary = f"<context_summary message_count='{len(messages)}'>\n{summary}\n</context_summary>"
        return {
            "role": "user",
            "content": summary,
        }
    except Exception:
        logger.exception("Failed to summarize messages")
        return messages[0]


def _handle_images(messages: list[dict[str, Any]], max_images: int) -> None:
    image_count = 0
    for msg in reversed(messages):
        content = msg.get("content", [])
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict) and item.get("type") == "image_url":
                    if image_count >= max_images:
                        item.update(
                            {
                                "type": "text",
                                "text": "[Previously attached image removed to preserve context]",
                            }
                        )
                    else:
                        image_count += 1


class MemoryCompressor:
    def __init__(
        self,
        max_images: int = 3,
        model_name: str | None = None,
        timeout: int | None = None,
    ):
        self.max_images = max_images
        # Use a dedicated fast/cheap compressor model if configured (STRIX_COMPRESSOR_LLM).
        # Falls back to the main scan model. For cost efficiency, point this at a fast model
        # (e.g. vertex_ai/gemini-2.5-flash) while the main scan uses gemini-2.5-pro.
        self.model_name = (
            model_name
            or Config.get("strix_compressor_llm")
            or Config.get("strix_llm")
        )
        self.timeout = timeout or int(Config.get("strix_memory_compressor_timeout") or "120")

        if not self.model_name:
            raise ValueError("STRIX_LLM environment variable must be set and not empty")

    def compress_history(
        self,
        messages: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """Compress conversation history to stay within token limits.

        Strategy:
        1. Handle image limits first
        2. Keep all system messages
        3. Keep minimum recent messages
        4. Summarize older messages when total tokens exceed limit

        The compression preserves:
        - All system messages unchanged
        - Most recent messages intact
        - Critical security context in summaries
        - Recent images for visual context
        - Technical details and findings
        """
        if not messages:
            return messages

        _handle_images(messages, self.max_images)

        system_msgs = []
        regular_msgs = []
        for msg in messages:
            if msg.get("role") == "system":
                system_msgs.append(msg)
            else:
                regular_msgs.append(msg)

        recent_msgs = regular_msgs[-MIN_RECENT_MESSAGES:]
        old_msgs = regular_msgs[:-MIN_RECENT_MESSAGES]

        # Type assertion since we ensure model_name is not None in __init__
        model_name: str = self.model_name  # type: ignore[assignment]

        total_tokens = sum(
            _get_message_tokens(msg, model_name) for msg in system_msgs + regular_msgs
        )

        if total_tokens <= MAX_TOTAL_TOKENS * 0.9:
            return messages

        compressed = []
        chunk_size = 10
        for i in range(0, len(old_msgs), chunk_size):
            chunk = old_msgs[i : i + chunk_size]
            summary = _summarize_messages(chunk, model_name, self.timeout)
            if summary:
                compressed.append(summary)

        return system_msgs + compressed + recent_msgs
