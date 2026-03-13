# Operational Planning Agent

Operational Planning Agent is a sophisticated disaster response and emergency command system. It utilizes Google Gemini AI to generate comprehensive operational plans, integrates real-time weather data through the Model Context Protocol (MCP), and provides semantic search over official NDMA protocols using Retrieval-Augmented Generation (RAG).

## Key Features

| Feature | Description |
| :--- | :--- |
| **Gemini 2.0 Integration** | Generates detailed 12-section operational plans tailored to specific disaster types and locations. |
| **RAG System** | Performs semantic search over official NDMA guidelines to provide localized and expert recommendations. |
| **MCP Integration** | Incorporates real-time weather intelligence via a dedicated FastMCP server. |
| **Risk Analysis** | Evaluates environmental conditions, hospital availability, and shelter capacity in real-time. |
| **Interactive Dashboard** | A responsive interface for disaster monitoring, resource tracking, and plan visualization. |

## Technical Specification

| Component | Technology |
| :--- | :--- |
| **Backend Framework** | FastAPI (Python) |
| **AI Architecture** | Google Gemini 2.0 Flash |
| **Vector Database** | ChromaDB |
| **Embeddings** | HuggingFace (all-MiniLM-L6-v2) |
| **Frontend Framework** | React + Vite |
| **Styling** | Tailwind CSS + Framer Motion |
| **Geospatial** | Leaflet |

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
3. (Optional) Index documents:
   ```bash
   python ingest.py
   ```
4. Start the server:
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
Developed for emergency command centers and disaster management professionals.