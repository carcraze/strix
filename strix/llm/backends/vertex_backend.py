# strix/llm/backends/vertex_backend.py
#
# Native Google AI (Vertex) backend for Strix — uses the new `google-genai` SDK.
#
# WHY THIS EXISTS
# ───────────────
# LiteLLM maintains an internal model registry. When you pass a model string it doesn't
# recognise (e.g. "vertex_ai/gemini-3.1-pro-preview"), it throws NotFoundError or
# BadRequestError before making a single network call. New Vertex models are often not
# in LiteLLM's registry until weeks after GA.
#
# This backend calls the Google AI SDK directly, so any model available in Vertex Model
# Garden works immediately — no waiting for a LiteLLM release.
#
# SDK MIGRATION NOTE
# ──────────────────
# The old `vertexai.generative_models` SDK is deprecated as of June 24, 2025 and will
# be removed on June 24, 2026. This backend uses the new `google-genai` SDK instead:
#   pip install google-genai
#
# Old (deprecated): from vertexai.generative_models import GenerativeModel
# New (this file):  from google import genai; client.aio.models.generate_content_stream()
#
# WHAT IT PRESERVES (nothing breaks)
# ────────────────────────────────────
# • SSE streaming to the frontend  — yields LLMResponse with incrementally growing
#   `content` strings. base_agent.py:373 calls tracer.update_streaming_content() on
#   each yield, driving the SSE pipeline. Untouched.
#
# • XML tool-call parsing  — Strix uses a custom XML format (<function=X>…</function>)
#   parsed by strix/llm/utils.py AFTER the full response is assembled.
#   LiteLLM's native tool_calls feature is NEVER used by Strix. Untouched.
#
# • Docker sandbox  — managed entirely in strix/runtime/. Zero coupling to LLM calls.
#
# • Agent loop / state machine  — base_agent.agent_loop() interface is identical.
#
# ACTIVE VERTEX AI MODELS (March 2026)
# ──────────────────────────────────────
# Set STRIX_LLM to one of these:
#
#   vertex_ai/gemini-2.5-pro           ← GA, high capability, 1M context  ✅ CONFIRMED WORKING
#   vertex_ai/gemini-2.5-flash         ← GA, fast + balanced, lower cost
#   vertex_ai/gemini-3.1-pro-preview   ← Preview (requires allowlist access)
#   vertex_ai/gemini-2.0-flash         ← Legacy, retiring June 2026
#
# REQUIRED ENVIRONMENT VARIABLES
# ────────────────────────────────
#   VERTEXAI_PROJECT   — GCP project ID  (e.g. "moyopal-453021")
#   VERTEXAI_LOCATION  — GCP region      (e.g. "us-central1")
#
# AUTHENTICATION
# ──────────────
# On GCE VMs, Application Default Credentials (ADC) via the VM's service account.
# The service account needs roles/aiplatform.user.
# Verify: gcloud auth application-default print-access-token
#
# FALLBACK
# ─────────
# Only invoked when STRIX_LLM starts with "vertex_ai/".
# All other prefixes use the original LiteLLM path in llm.py unchanged.

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from strix.llm.llm import LLMResponse

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Client — lazy initialised once per process
# ──────────────────────────────────────────────────────────────────────────────

_client: Any = None


def _get_client() -> Any:
    """Return a cached google-genai Vertex AI client, creating it on first call."""
    global _client  # noqa: PLW0603
    if _client is not None:
        return _client

    from google import genai  # type: ignore[import]

    project = os.environ.get("VERTEXAI_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    location = os.environ.get("VERTEXAI_LOCATION", "us-central1")

    if not project:
        raise RuntimeError(
            "VERTEXAI_PROJECT environment variable is required for vertex_ai/ models. "
            "Set it to your GCP project ID (e.g. export VERTEXAI_PROJECT=moyopal-453021)"
        )

    # vertexai=True routes all calls through Vertex AI instead of Google AI Studio.
    # Auth uses Application Default Credentials (ADC) — works automatically on GCE VMs.
    _client = genai.Client(vertexai=True, project=project, location=location)
    logger.info(f"[VERTEX] google-genai client initialised | project={project} location={location}")
    return _client


# ──────────────────────────────────────────────────────────────────────────────
# Message format conversion  (OpenAI → google-genai Content objects)
# ──────────────────────────────────────────────────────────────────────────────

def _extract_text(content: str | list[Any]) -> str:
    """
    Extract plain text from a message content field.

    Strix messages use two formats:
      - str: plain text (most messages)
      - list: multi-part, e.g. [{"type": "text", "text": "...", "cache_control": {...}}]
        Added by LLM._add_cache_control() for Anthropic prompt caching.
        Vertex AI doesn't use cache_control — we just extract the text.
    """
    if isinstance(content, str):
        return content

    parts: list[str] = []
    for part in content:
        if isinstance(part, dict):
            if part.get("type") == "text":
                parts.append(part.get("text", ""))
            elif "text" in part:
                parts.append(str(part["text"]))
    return "\n".join(parts)


def _convert_messages(messages: list[dict[str, Any]]) -> tuple[str, list[Any]]:
    """
    Convert OpenAI-format conversation history to google-genai Content objects.

    Returns:
        system_instruction — extracted from the first system message
        genai_contents     — list of google.genai.types.Content objects

    Role mapping:
        system    → system_instruction param (not a Content object)
        user      → Content(role="user", ...)
        assistant → Content(role="model", ...)  ← genai uses "model" not "assistant"
    """
    from google.genai import types  # type: ignore[import]

    system_instruction = ""
    genai_contents: list[Any] = []

    for msg in messages:
        role: str = msg.get("role", "user")
        text = _extract_text(msg.get("content", ""))

        if not text:
            continue  # Skip empty messages — Vertex rejects them

        if role == "system":
            if not system_instruction:
                system_instruction = text
            continue

        genai_role = "model" if role == "assistant" else "user"
        genai_contents.append(
            types.Content(role=genai_role, parts=[types.Part.from_text(text=text)])
        )

    return system_instruction, genai_contents


# ──────────────────────────────────────────────────────────────────────────────
# Thinking / reasoning config
# ──────────────────────────────────────────────────────────────────────────────

# Models that support extended thinking (chain-of-thought reasoning before output).
# Gemini 2.5 Pro and 3.1 Pro are reasoning-first models — ThinkingConfig significantly
# improves quality for complex multi-step security analysis.
_THINKING_MODELS = ("gemini-3.1", "gemini-2.5-pro")


def _is_thinking_model(model_id: str) -> bool:
    return any(m in model_id for m in _THINKING_MODELS)


def _get_thinking_budget(reasoning_effort: str) -> int:
    """
    Map Strix reasoning_effort to ThinkingConfig.thinking_budget (token count).
    Higher budget = deeper reasoning, higher cost, slower response.
    """
    return {"low": 2048, "medium": 8192, "high": 24576}.get(reasoning_effort, 8192)


# ──────────────────────────────────────────────────────────────────────────────
# Main streaming generator
# ──────────────────────────────────────────────────────────────────────────────

async def vertex_stream(
    model_id: str,
    messages: list[dict[str, Any]],
    timeout: int = 300,
    reasoning_effort: str = "high",
) -> AsyncIterator[LLMResponse]:
    """
    Native google-genai Vertex AI streaming generator.

    Drop-in replacement for LiteLLM's acompletion() call in strix/llm/llm.py.
    Produces the exact same LLMResponse stream that base_agent._process_iteration()
    consumes. No changes needed anywhere else in the call stack.

    Args:
        model_id:          Vertex model name with "vertex_ai/" prefix stripped.
                           e.g. "gemini-2.5-pro", "gemini-3.1-pro-preview"
        messages:          OpenAI-format conversation history from LLM._prepare_messages()
        timeout:           Request timeout in seconds
        reasoning_effort:  "low" | "medium" | "high" — maps to ThinkingConfig budget

    Yields:
        LLMResponse(content=accumulated_text)               — each chunk (drives SSE)
        LLMResponse(content=..., tool_invocations=..., ...) — final with parsed tools
    """
    from google.genai import types  # type: ignore[import]
    from strix.llm.llm import LLMResponse
    from strix.llm.utils import (
        _truncate_to_first_function,
        fix_incomplete_tool_call,
        normalize_tool_format,
        parse_tool_invocations,
    )

    client = _get_client()
    system_instruction, genai_contents = _convert_messages(messages)

    if not genai_contents:
        logger.warning("[VERTEX] No messages after conversion — yielding empty response")
        yield LLMResponse(content="", tool_invocations=None, thinking_blocks=None)
        return

    # ── Build GenerateContentConfig ───────────────────────────────────────────
    config_kwargs: dict[str, Any] = {
        "temperature": 0.1,
        "max_output_tokens": 8192,
    }

    if system_instruction:
        config_kwargs["system_instruction"] = system_instruction

    # Enable ThinkingConfig for reasoning models (Gemini 2.5 Pro, 3.1 Pro).
    # thinking_budget controls how many tokens the model spends reasoning internally
    # before producing output. The thinking text is captured separately and does NOT
    # appear in the accumulated response parsed for XML tool calls.
    if _is_thinking_model(model_id):
        budget = _get_thinking_budget(reasoning_effort)
        config_kwargs["thinking_config"] = types.ThinkingConfig(thinking_budget=budget)
        logger.debug(f"[VERTEX] ThinkingConfig enabled | budget={budget} tokens")

    config = types.GenerateContentConfig(**config_kwargs)

    logger.info(f"[VERTEX] Starting stream | model={model_id} messages={len(genai_contents)}")

    # ── Stream response ───────────────────────────────────────────────────────
    accumulated = ""       # Output text (tool-call XML lives here)
    thinking_text = ""     # Reasoning content (separate from output)
    done_streaming = False

    try:
        # client.aio is the async interface of the google-genai SDK.
        # generate_content_stream returns an async generator of GenerateContentResponse chunks.
        async for chunk in await client.aio.models.generate_content_stream(
            model=model_id,
            contents=genai_contents,
            config=config,
        ):
            # chunk.text returns only the non-thinking output text.
            # For thinking models the reasoning is in thought=True parts — captured below.
            try:
                delta: str = chunk.text or ""
            except Exception:
                delta = ""

            # Collect thinking content for thinking_blocks in the final LLMResponse.
            # Strix doesn't act on thinking_blocks but the tracer logs them for debugging.
            try:
                for part in chunk.candidates[0].content.parts:
                    if getattr(part, "thought", False) and part.text:
                        thinking_text += part.text
            except (IndexError, AttributeError):
                pass

            if not delta or done_streaming:
                continue

            accumulated += delta

            # ── Tool-call detection (identical logic to LiteLLM backend) ─────
            # Strix XML format: <function=X><parameter=Y>value</parameter></function>
            # Stop accumulating after first complete call — model is done with this turn.
            if "</function>" in accumulated or "</invoke>" in accumulated:
                end_tag = "</function>" if "</function>" in accumulated else "</invoke>"
                pos = accumulated.find(end_tag)
                accumulated = accumulated[: pos + len(end_tag)]
                yield LLMResponse(content=accumulated)
                done_streaming = True
                continue

            # Each yield triggers tracer.update_streaming_content() in
            # base_agent._process_iteration():373, which pushes content to the SSE stream.
            yield LLMResponse(content=accumulated)

    except Exception as e:
        logger.error(f"[VERTEX] Streaming failed | model={model_id} error={e!r}")
        raise

    # ── Final yield with parsed tool invocations ──────────────────────────────
    accumulated = normalize_tool_format(accumulated)
    accumulated = fix_incomplete_tool_call(_truncate_to_first_function(accumulated))

    thinking_blocks = None
    if thinking_text:
        thinking_blocks = [{"type": "thinking", "thinking": thinking_text}]

    logger.debug(
        f"[VERTEX] Stream complete | chars={len(accumulated)} "
        f"thinking_chars={len(thinking_text)} "
        f"has_tool_call={bool(parse_tool_invocations(accumulated))}"
    )

    yield LLMResponse(
        content=accumulated,
        tool_invocations=parse_tool_invocations(accumulated),
        thinking_blocks=thinking_blocks,
    )
