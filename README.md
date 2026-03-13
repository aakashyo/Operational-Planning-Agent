# Operational Planning Agent 🚨

Operational Planning Agent is a HIGH-TECH, Gemini-powered disaster response and emergency command system. It leverages advanced AI to generate comprehensive operational plans, integrate live weather data via MCP, and provide semantic search over NDMA protocols using RAG.

## 🌟 Key Features

- **Gemini 2.0 Flash Integration**: Generates detailed 12-section operational blueprints tailored to specific disasters and locations.
- **RAG (Retrieval-Augmented Generation)**: Semantic search over official NDMA guidelines and protocols for localized, expert advice.
- **MCP (Model Context Protocol)**: Real-time weather intelligence integration via a specialized FastMCP server.
- **Dynamic Risk Analysis**: Analyzes environmental conditions, hospital capacities, and shelter availability in real-time.
- **Interactive Dashboard**: A premium, responsive UI built with React, Vite, and Tailwind CSS, featuring live maps and agent reasoning visualization.

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **AI Models**: Google Gemini 2.0 Flash
- **Vector Database**: ChromaDB (for RAG)
- **Embeddings**: HuggingFace (all-MiniLM-L6-v2)
- **MCP**: FastMCP for live tool integration

### Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS + Framer Motion (Animations)
- **Maps**: Leaflet (via React-Leaflet)
- **Icons**: Lucide-React

## 🚀 Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- Gemini API Key

### Backend Setup
1. Navigate to the root directory.
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the data ingestion script (optional, if you have new PDFs):
   ```bash
   python ingest.py
   ```
5. Start the API server:
   ```bash
   python app.py
   ```

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `app.py`: Main FastAPI entry point and Planning Agent logic.
- `ingest.py`: RAG pipeline for processing and indexing PDF documents.
- `weather_mcp.py`: FastMCP server for live weather tools.
- `frontend/`: React source code, components, and assets.
- `data/`: Local storage for the vector database and source protocols.
- `rag/`: Core RAG engine implementation.
- `tools/`: MCP server and custom tool definitions.

---
Built with ❤️ for emergency responders and disaster management teams.