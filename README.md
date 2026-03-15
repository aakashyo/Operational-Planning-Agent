# Operational Planning Agent

> **Status: This project is currently under active development. Features may be incomplete, unstable, or subject to change without notice.**

Operational Planning Agent is a disaster response and emergency command system. It uses Google Gemini AI to generate comprehensive operational plans, integrates real-time weather data through the Model Context Protocol (MCP), fetches disaster-type-specific intelligence via the Groq API, and provides semantic search over official NDMA protocols using Retrieval-Augmented Generation (RAG).

## Key Features

| Feature | Description |
| :--- | :--- |
| **Gemini 2.0 Integration** | Generates detailed 12-section operational plans tailored to specific disaster types and locations. |
| **Groq AI Intelligence** | Generates disaster-type-specific intelligence blocks (hazard profiles, tactical checklists, triage protocols, monitoring metrics) using `llama-3.1-8b-instant`, injected into the Gemini prompt for deeply descriptive reports. |
| **RAG System** | Performs semantic search over official NDMA guidelines to provide localized and expert recommendations. |
| **MCP Integration** | Incorporates real-time weather intelligence via a dedicated FastMCP server. |
| **Risk Analysis** | Evaluates environmental conditions, hospital availability, and shelter capacity in real-time. |
| **Interactive Dashboard** | A responsive interface for disaster monitoring, resource tracking, and plan visualization. |

## Technical Specification

| Component | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python) |
| **Primary AI Model** | Google Gemini 2.0 Flash |
| **Secondary AI Model** | Groq (llama-3.1-8b-instant) |
| **Vector Database** | ChromaDB |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) |
| **Frontend Framework** | React + Vite |
| **Styling** | Tailwind CSS + Framer Motion |
| **Geospatial** | Leaflet + Overpass API |

## Project Structure

| Path | Description |
| :--- | :--- |
| `app.py` | Main FastAPI application and Planning Agent logic. |
| `ingest.py` | Pipeline for processing and indexing protocol documents for RAG. |
| `weather_mcp.py` | FastMCP server implementation for weather tools. |
| `frontend/` | React-based user interface source code. |
| `data/` | Vector database storage and source documents. |
| `rag/` | Core implementation of the RAG engine. |
| `tools/` | Custom MCP tool definitions and server configurations. |

## Installation and Setup

### Prerequisites
- Python 3.9 or higher
- Node.js 18 or higher
- Valid Google Gemini API Key
- Valid Groq API Key (obtain free at https://console.groq.com)

### Backend Configuration
1. Initialize a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   ```
2. Install required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`.
   - Open `.env` and enter your **Gemini API Key** and **Groq API Key**.
   ```bash
   cp .env.example .env
   ```
4. (Optional) Index documents for RAG:
   ```bash
   python ingest.py
   ```
5. Start the backend server:
   ```bash
   python app.py
   ```

### Frontend Configuration
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Launch the development server:
   ```bash
   npm run dev
   ```

---

Developed for emergency command centers and disaster management professionals. This project is in active development and not yet production-ready.