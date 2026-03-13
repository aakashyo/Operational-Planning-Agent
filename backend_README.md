# Operational Planning Agent - Backend & RAG 🧠

The engine powering the disaster response coordination, featuring Gemini integration, RAG pipelines, and MCP live tools.

## 🏗️ Components

### 1. Planning Agent (`app.py`)
The orchestrator that coordinates between:
- **Geolocation**: Translating natural language locations to coordinates.
- **RAG Retrieval**: Fetching specific protocols for the detected disaster type.
- **MCP Weather**: Interfacing with the local MCP server for live environmental data.
- **Gemini AI**: Synthesizing all data into a structured operational plan.

### 2. RAG Engine (`rag/engine.py`)
A semantic search system using:
- **ChromaDB**: High-performance vector database.
- **HuggingFace Embeddings**: `all-MiniLM-L6-v2` for dense vector representation.
- **Ingestion Pipeline (`ingest.py`)**: Processes PDFs and text files into manageable, searchable chunks.

### 3. MCP Weather Server (`weather_mcp.py`)
A specialized Model Context Protocol server that provides:
- **`get_live_weather` tool**: Fetching real-time weather conditions for any given coordinates.

## 🔧 API Endpoints

- `GET /resources`: Returns current availability of emergency resources.
- `POST /plan`: Generates a full operational plan from a user query.
- `POST /resources/reset`: Resets resource levels to default for simulation.

## 📦 Requirements

- Python 3.9+
- `fastapi`, `uvicorn`, `google-generativeai`
- `langchain`, `chromadb`, `sentence-transformers`
- `mcp` (Model Context Protocol SDK)

---
All backend services are configured to run on `port 8000` by default.
