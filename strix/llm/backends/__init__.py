# strix/llm/backends/__init__.py
#
# LLM backend routing layer.
#
# Strix supports multiple LLM backends:
#   - LiteLLM (default):  handles Anthropic, OpenAI, Ollama, OpenRouter, Gemini AI Studio, etc.
#   - Vertex AI Native:   direct Google Cloud Vertex AI SDK — used when STRIX_LLM starts with
#                         "vertex_ai/". Bypasses LiteLLM entirely to avoid model-registry
#                         NotFoundError / BadRequestError that LiteLLM throws for new Vertex
#                         models it hasn't catalogued yet (e.g. gemini-3.1-pro-preview).
#
# Routing decision is made in strix/llm/llm.py → LLM._stream().
# Neither backend affects the Docker sandbox, agent loop, or SSE streaming pipeline.
