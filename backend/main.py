from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from agents.planning_agent import PlanningAgent
import os

app = FastAPI(title="Operational Planning Agent API")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlanRequest(BaseModel):
    query: str

class PlanResponse(BaseModel):
    riskLevel: str
    priority: str
    actions: List[str]
    resources: List[str]
    reasoning: List[dict]

# Initialize Agent
agent = None

@app.on_event("startup")
async def startup_event():
    global agent
    # Ensure data directory and RAG engine are ready
    if not os.path.exists("data"):
        os.makedirs("data")
    agent = PlanningAgent()
    agent.rag.initialize()

@app.post("/plan", response_model=PlanResponse)
async def generate_plan(request: PlanRequest):
    try:
        result = await agent.run(request.query)
        return result
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
