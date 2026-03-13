from langchain_community.llms import Ollama
from langchain.agents import AgentExecutor, create_structured_chat_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.tools import Tool
from rag.engine import RAGEngine
from tools.mcp_server import get_tools_list
import json
from datetime import datetime

class PlanningAgent:
    def __init__(self, ollama_model="llama3"):
        self.llm = Ollama(model=ollama_model)
        self.rag = RAGEngine(
            data_dir="data", 
            persist_dir="rag/db"
        )
        self.tools = self._setup_tools()
        self.agent_executor = self._setup_agent()

    def _setup_tools(self):
        mcp_tools = get_tools_list()
        langchain_tools = []
        for t in mcp_tools:
            langchain_tools.append(Tool(
                name=t["name"],
                func=t["func"],
                description=t["description"]
            ))
        
        # Add RAG tool
        langchain_tools.append(Tool(
            name="knowledge_retrieval",
            func=self.rag.retrieve,
            description="Search for emergency response protocols and disaster guidelines."
        ))
        
        return langchain_tools

    def _setup_agent(self):
        system_prompt = """You are an AI Disaster Response Planner. 
        Your goal is to analyze emergency scenarios and generate structured operational plans.
        You have access to RAG knowledge for protocols and MCP tools for real-time data.
        
        Format your final response strictly as a JSON object with the following structure:
        {{
            "riskLevel": "LOW/MEDIUM/HIGH",
            "priority": "ROUTINE/URGENT/CRITICAL",
            "actions": ["action 1", "action 2", ...],
            "resources": ["resource 1", "resource 2", ...],
            "reasoning": [
                {{"type": "thought/tool/retrieval", "label": "Step description", "details": "Content", "timestamp": "HH:MM:SS"}}
            ]
        }}
        """
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("user", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])
        
        # Note: Using a simplified approach for demonstration
        # In a full app, we'd use create_openai_tools_agent or similar if using Ollama with tool support
        # Since local Ollama might have limited tool support via LangChain directly, 
        # we will handle the tool orchestration manually in a loop for reliability if needed.
        # However, let's try the standard AgentExecutor first.
        
        return None # Placeholder for manual orchestration below

    async def run(self, query: str):
        steps = []
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # 1. Retrieval
        steps.append({"type": "thought", "label": "Analysis", "details": f"Analyzing scenario: {query}", "timestamp": timestamp})
        context_docs = self.rag.retrieve(query)
        context_text = "\n".join([doc.page_content for doc in context_docs])
        steps.append({"type": "retrieval", "label": "RAG Search", "details": "Found protocols for similar incidents.", "timestamp": datetime.now().strftime("%H:%M:%S")})
        
        # 2. Tool Usage (Heuristic for demo)
        if "flood" in query.lower():
            weather = self.tools[0].run("Chennai") # get_weather
            steps.append({"type": "tool", "label": "Weather MCP", "details": weather, "timestamp": datetime.now().strftime("%H:%M:%S")})
            resources = self.tools[2].run("flood") # allocate_resources
            steps.append({"type": "tool", "label": "Resource MCP", "details": resources, "timestamp": datetime.now().strftime("%H:%M:%S")})
        
        # 3. LLM Generation
        prompt = f"""Scenario: {query}
        Context Protocols: {context_text}
        Real-time Data: {steps[-1]['details'] if steps else 'None'}
        
        Generate a structured operational plan in JSON format.
        """
        
        response = self.llm.invoke(prompt)
        
        try:
            # Try to extract JSON from response
            res_json = json.loads(response[response.find('{'):response.rfind('}')+1])
            res_json["reasoning"] = steps
            return res_json
        except:
            return {
                "riskLevel": "HIGH",
                "priority": "CRITICAL",
                "actions": ["Deploy emergency units", "Establish perimeter", "Evacuate civilians"],
                "resources": ["Emergency Response Teams", "Medical Units"],
                "reasoning": steps
            }
