# strix/llm/backends/vertex_backend.py
#
# Native Google Cloud Vertex AI SDK backend for Strix.
#
# WHY THIS EXISTS
# ───────────────
# LiteLLM maintains an internal model registry. When you pass a model string it doesn't
# recognise (e.g. "vertex_ai/gemini-3.1-pro-preview"), it throws NotFoundError or
# BadRequestError before making a single network call. New Vertex models (Gemini 3.1,
# future releases) are often not in LiteLLM's registry until weeks after GA.
#
# This backend calls the Vertex AI SDK directly, so any model available in Vertex Model
# Garden works immediately — no waiting for a LiteLLM release.
#
# WHAT IT PRESERVES (nothing breaks)
# ────────────────────────────────────
# • SSE streaming to the frontend  — we yield LLMResponse objects with incrementally
#   growing `content` strings, identical to the LiteLLM backend. base_agent.py:373
#   calls tracer.update_streaming_content() on each yield, which drives SSE. Untouched.
#
# • XML tool-call parsing  — Strix uses a custom XML format (<function=X>…</function>)
#   that is parsed by strix/llm/utils.py AFTER the full response is assembled. This
#   backend accumulates text and calls the same parse_tool_invocations() at the end.
#   LiteLLM's native tool_calls feature is NEVER used by Strix. Untouched.
#
# • Docker sandbox  — sandbox lifecycle is managed entirely in strix/runtime/ and
#   base_agent._initialize_sandbox_and_state(). It has zero coupling to LLM calls.
#   Untouched.
#
# • Agent loop / state machine  — base_agent.agent_loop() calls self.llm.generate()
#   which calls _stream() which now routes here. The interface is identical. Untouched.
#
# ACTIVE VERTEX AI MODELS (March 2026)
# ──────────────────────────────────────
# Set STRIX_LLM to one of these values:
#
#   vertex_ai/gemini-3.1-pro-preview   ← RECOMMENDED: latest reasoning model, 1M context,
#                                         optimised for complex agentic / coding workflows
#   vertex_ai/gemini-2.5-pro           ← GA, high capability, 1M context, stable
#   vertex_ai/gemini-2.5-flash         ← GA, fast + balanced, lower cost
#   vertex_ai/gemini-2.0-flash         ← legacy stable, retiring June 2026
#
# REQUIRED ENVIRONMENT VARIABLES
# ────────────────────────────────
#   VERTEXAI_PROJECT   — GCP project ID  (e.g. "moyopal-453021")
#   VERTEXAI_LOCATION  — GCP region      (e.g. "us-central1" for Gemini,
#                                               "us-east5" for Claude on Vertex)
#
# AUTHENTICATION
# ──────────────
# On GCE VMs, Application Default Credentials (ADC) are used automatically via the
# VM's attached service account. The service account needs roles/aiplatform.user.
# Verify with: gcloud auth application-default print-access-token
#
# For local dev or non-GCE environments, set:
#   GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
#
# FALLBACK
# ─────────
# This backend is ONLY invoked when STRIX_LLM starts with "vertex_ai/".
# All other prefixes (anthropic/, openai/, gemini/, ollama/, strix/) continue to use
# the original LiteLLM path in llm.py. No existing functionality is affected.

from __future__ import annotations

import logging
import os
from collections.abc import AsyncIterator
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from strix.llm.llm import LLMResponse

logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Vertex AI SDK initialisation  (lazy, runs once per process)
# ──────────────────────────────────────────────────────────────────────────────

_vertex_initialized = False


def _ensure_vertex_init() -> None:
    """Initialise the Vertex AI SDK on first call. Thread-safe via GIL for the flag."""
    global _vertex_initialized  # noqa: PLW0603
    if _vertex_initialized:
        return

    import vertexai  # type: ignore[import]

    project = os.environ.get("VERTEXAI_PROJECT") or os.environ.get("GOOGLE_CLOUD_PROJECT")
    location = os.environ.get("VERTEXAI_LOCATION", "us-central1")

    if not project:
        raise RuntimeError(
            "VERTEXAI_PROJECT environment variable is required for vertex_ai/ models. "
            "Set it to your GCP project ID (e.g. export VERTEXAI_PROJECT=moyopal-453021)"
        )

    vertexai.init(project=project, location=location)
    logger.info(f"[VERTEX] SDK initialised | project={project} location={location}")
    _vertex_initialized = True


# ──────────────────────────────────────────────────────────────────────────────
# Message format conversion  (OpenAI → Vertex SDK Content objects)
# ──────────────────────────────────────────────────────────────────────────────

def _extract_text(content: str | list[Any]) -> str:
    """
    Extract plain text from a message content field.

    Strix messages use two formats:
      - str: plain text (most messages)
      - list: multi-part content, e.g. [{"type": "text", "text": "...", "cache_control": {...}}]
        This format is added by LLM._add_cache_control() for Anthropic prompt caching.
        Vertex AI doesn't use cache_control, so we just extract the text parts.
    """
    if isinstance(content, str):
        return content

    parts: list[str] = []
    for part in content:
        if isinstance(part, dict):
            if part.get("type") == "text":
                parts.append(part.get("text", ""))
            elif "text" in part:
                # Fallback: any dict with a "text" key
                parts.append(str(part["text"]))
    return "\n".join(parts)


def _convert_messages(
    messages: list[dict[str, Any]],
) -> tuple[str, list[Any]]:
    """
    Convert OpenAI-format conversation history into Vertex SDK Content objects.

    Returns:
        system_instruction  — extracted from the first system message (if any)
        vertex_messages     — list of vertexai.generative_models.Content objects

    OpenAI roles → Vertex roles:
        system    → extracted as system_instruction (not a Content object)
        user      → Content(role="user", ...)
        assistant → Content(role="model", ...)   ← Vertex uses "model" not "assistant"
    """
    from vertexai.generative_models import Content, Part  # type: ignore[import]

    system_instruction = ""
    vertex_messages: list[Any] = []

    for msg in messages:
        role: str = msg.get("role", "user")
        content = msg.get("content", "")
        text = _extract_text(content)

        if not text:
            # Skip empty messages — Vertex rejects them
            continue

        if role == "system":
            # Vertex AI handles system prompt via GenerativeModel(system_instruction=...)
            # Only the FIRST system message is used (Strix always has exactly one)
            if not system_instruction:
                system_instruction = text
            continue

        # Map OpenAI assistant → Vertex "model"
        vertex_role = "model" if role == "assistant" else "user"
        vertex_messages.append(Content(role=vertex_role, parts=[Part.from_text(text)]))

    return system_instruction, vertex_messages


# ──────────────────────────────────────────────────────────────────────────────
# Thinking / reasoning config
# ──────────────────────────────────────────────────────────────────────────────

# Models that support extended thinking on Vertex AI.
# Gemini 3.1 Pro and 2.5 Pro are reasoning-first models — enabling ThinkingConfig
# significantly improves quality for complex security analysis tasks.
_THINKING_MODELS = (
    "gemini-3.1",
    "gemini-2.5-pro",
)


def _is_thinking_model(model_id: str) -> bool:
    """Return True if this Vertex model supports/benefits from ThinkingConfig."""
    return any(m in model_id for m in _THINKING_MODELS)


def _get_thinking_budget(reasoning_effort: str) -> int:
    """
    Map Strix reasoning_effort string to Vertex ThinkingConfig thinking_budget tokens.

    Budget controls how many tokens the model spends reasoning before answering.
    Higher = better quality, higher cost, slower.
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
    Native Vertex AI SDK streaming generator.

    This is the drop-in replacement for LiteLLM's acompletion() call.
    It produces the exact same LLMResponse stream that base_agent._process_iteration()
    consumes. No changes needed anywhere else in the call stack.

    Args:
        model_id:          Vertex model name with "vertex_ai/" prefix already stripped.
                           e.g. "gemini-3.1-pro-preview", "gemini-2.5-pro"
        messages:          OpenAI-format conversation history from LLM._prepare_messages()
        timeout:           Request timeout in seconds
        reasoning_effort:  "low" | "medium" | "high" — controls thinking budget for
                           reasoning models. Maps to ThinkingConfig.thinking_budget.

    Yields:
        LLMResponse(content=accumulated_text)   — on each streaming chunk (drives SSE)
        LLMResponse(content=..., tool_invocations=..., thinking_blocks=...)  — final
    """
    # Import here to avoid making vertexai a hard import at module load time.
    # If SDK is not installed, error surfaces only when a vertex_ai/ model is used.
    from vertexai.generative_models import GenerationConfig, GenerativeModel  # type: ignore[import]

    # Import Strix types / utils — these are always available (same package)
    from strix.llm.llm import LLMResponse
    from strix.llm.utils import (
        _truncate_to_first_function,
        fix_incomplete_tool_call,
        normalize_tool_format,
        parse_tool_invocations,
    )

    _ensure_vertex_init()

    system_instruction, vertex_messages = _convert_messages(messages)

    if not vertex_messages:
        logger.warning("[VERTEX] No messages to send after conversion — yielding empty response")
        yield LLMResponse(content="", tool_invocations=None, thinking_blocks=None)
        return

    # ── Build GenerationConfig ────────────────────────────────────────────────
    gen_config_kwargs: dict[str, Any] = {
        "max_output_tokens": 8192,
        "temperature": 0.1,  # Low temp for deterministic security analysis
    }

    # Enable ThinkingConfig for reasoning models (Gemini 3.1 Pro, 2.5 Pro)
    # This enables chain-of-thought reasoning before the model produces output.
    # The thinking content is captured separately and does NOT appear in the
    # accumulated response text that gets parsed for tool calls.
    if _is_thinking_model(model_id):
        try:
            from vertexai.generative_models import ThinkingConfig  # type: ignore[import]
            budget = _get_thinking_budget(reasoning_effort)
            gen_config_kwargs["thinking_config"] = ThinkingConfig(thinking_budget=budget)
            logger.debug(f"[VERTEX] ThinkingConfig enabled | budget={budget} tokens")
        except ImportError:
            # Older SDK version — ThinkingConfig not yet available. Continue without it.
            logger.warning(
                "[VERTEX] ThinkingConfig not available in installed SDK version. "
                "pip install --upgrade google-cloud-aiplatform to enable thinking."
            )

    generation_config = GenerationConfig(**gen_config_kwargs)

    # ── Build model ───────────────────────────────────────────────────────────
    model = GenerativeModel(
        model_name=model_id,
        system_instruction=system_instruction or None,
    )

    logger.info(f"[VERTEX] Starting stream | model={model_id} messages={len(vertex_messages)}")

    # ── Stream response ───────────────────────────────────────────────────────
    accumulated = ""       # Output text (tool-call XML lives here)
    thinking_text = ""     # Thinking/reasoning content (separate from output)
    done_streaming = False

    try:
        response_stream = await model.generate_content_async(
            contents=vertex_messages,
            generation_config=generation_config,
            stream=True,
        )

        async for chunk in response_stream:
            # chunk.text returns ONLY the non-thinking output text.
            # For thinking models, the reasoning content is in parts with thought=True.
            # This mirrors how the LiteLLM backend handles thinking blocks for Anthropic.
            try:
                delta: str = chunk.text or ""
            except Exception:
                # Some chunks (usage metadata chunks) may not have .text
                delta = ""

            # Collect thinking content for the final LLMResponse.thinking_blocks field.
            # This is optional — Strix doesn't act on thinking_blocks, but it's logged
            # by the tracer for debugging / audit purposes.
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
            # Strix's XML tool-call format: <function=X>…</function>
            # Once we see the closing tag, stop accumulating — the model is done
            # with this tool call. Everything after would be a second call that
            # Strix doesn't support in a single response (truncated by
            # _truncate_to_first_function at the end anyway).
            if "</function>" in accumulated or "</invoke>" in accumulated:
                end_tag = "</function>" if "</function>" in accumulated else "</invoke>"
                pos = accumulated.find(end_tag)
                accumulated = accumulated[: pos + len(end_tag)]
                yield LLMResponse(content=accumulated)
                done_streaming = True
                continue

            # Yield incrementally — each yield triggers tracer.update_streaming_content()
            # in base_agent._process_iteration():373, which pushes to the SSE stream.
            yield LLMResponse(content=accumulated)

    except Exception as e:
        logger.error(f"[VERTEX] Streaming failed | model={model_id} error={e!r}")
        raise

    # ── Final yield with parsed tool invocations ──────────────────────────────
    # Mirrors the final yield in LLM._stream() (llm.py:200-206).
    # normalize_tool_format handles alternative XML formats the model might output.
    # parse_tool_invocations extracts <function=X><parameter=Y> into structured dicts
    # that base_agent._execute_actions() dispatches to actual tool handlers.
    accumulated = normalize_tool_format(accumulated)
    accumulated = fix_incomplete_tool_call(_truncate_to_first_function(accumulated))

    thinking_blocks = None
    if thinking_text:
        # Match the format Anthropic/Claude uses for thinking blocks so the tracer
        # can display them uniformly regardless of which backend produced them.
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
