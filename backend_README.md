# Operational Planning Agent - Backend and Intelligence Engine

This document details the backend architecture and AI components that power the Operational Planning Agent.

## Module Overview

| Module | Responsibility |
| :--- | :--- |
| **Planning Agent (`app.py`)** | Orchestrates geolocation, RAG retrieval, and AI synthesis. |
| **Intelligence Logic** | Leverages Gemini 2.0 for high-fidelity operational planning. |
| **RAG Engine (`rag/`)** | Manages vector indexing and semantic retrieval of NDMA protocols. |
| **MCP Server (`weather_mcp.py`)** | Provides tool-based access to real-time environmental data. |

## API Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/plan` | POST | Generates a full operational response plan for a given scenario. |
| `/resources` | GET | Returns the current status of all emergency resources. |
| `/resources/reset` | POST | Reset resource availability to baseline levels. |

## System Dependencies

| Library | Function |
| :--- | :--- |
| **FastAPI** | High-performance web framework for the API layer. |
| **Google Generative AI** | Interface for Gemini model interactions. |
| **ChromaDB** | Local vector storage for protocol knowledge. |
| **HuggingFace** | Transformer-based embeddings for similarity search. |
| **MCP SDK** | SDK for implementing Model Context Protocol tools. |

## Performance and Scaling
The backend is designed for rapid response generation. Semantic search is optimized through local vector caching, and tool execution is handled asynchronously to minimize latency during emergency simulations.
