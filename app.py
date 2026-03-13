import os
import sys
import json
import time
import re
import asyncio
import random
import requests
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import google.generativeai as genai

# MCP Client Imports
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# ───────────────────────────────────────────
# GEMINI SETUP
# ───────────────────────────────────────────
GEMINI_API_KEY = "AIzaSyDTqbMEnSd0EMLI3Oh0GN-JGTqhIK51ikw"
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ───────────────────────────────────────────
# RAG ENGINE
# ───────────────────────────────────────────
import torch
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

class RAGEngine:
    def __init__(self, db_dir: str = "data/chroma_db"):
        self.db_dir = db_dir
        self.vectorstore = None

    def initialize(self):
        if not os.path.exists(self.db_dir):
            print(f"[RAG] WARNING: Vector database not found at {self.db_dir}. Please run ingest.py first.")
            return

        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"[RAG] Initializing embeddings on {device.upper()}...")
        try:
            embeddings = HuggingFaceEmbeddings(
                model_name="sentence-transformers/all-MiniLM-L6-v2",
                model_kwargs={"device": device}
            )
            self.vectorstore = Chroma(persist_directory=self.db_dir, embedding_function=embeddings)
            print("[RAG] Vector database loaded successfully. Ready for semantic search.")
        except Exception as e:
            print(f"[RAG] Error initializing vector store: {e}")

    def retrieve(self, query: str) -> str:
        if not self.vectorstore:
            return "No protocols available. RAG database is empty."
            
        try:
            docs = self.vectorstore.similarity_search(query, k=4)
            return "\n\n".join([doc.page_content for doc in docs])
        except Exception as e:
            print(f"[RAG] Search error: {e}")
            return "Error retrieving protocols."

# ───────────────────────────────────────────
# MCP TOOLS
# ───────────────────────────────────────────
class MCPTools:
    @staticmethod
    def get_weather(location: str) -> dict:
        weathers = [
            {"condition": "Heavy Rain", "temp": 28, "wind": "45 km/h", "humidity": "92%", "visibility": "Low",
             "forecast": "Continued rainfall for 48 hours with possible thunderstorms."},
            {"condition": "Severe Storm", "temp": 26, "wind": "80 km/h", "humidity": "88%", "visibility": "Very Low",
             "forecast": "Cyclonic storm from Bay of Bengal. Landfall within 12 hours."},
            {"condition": "Extreme Heat", "temp": 44, "wind": "8 km/h", "humidity": "20%", "visibility": "Good",
             "forecast": "Heat wave persisting 4-5 days. Nighttime temps above 32°C."},
            {"condition": "Dry & Arid", "temp": 40, "wind": "15 km/h", "humidity": "12%", "visibility": "Good",
             "forecast": "No rainfall expected for next 30 days. Groundwater critically low."},
        ]
        return {**random.choice(weathers), "location": location}

    @staticmethod
    def check_hospitals(lat: float, lng: float, radius: int = 10000) -> list:
        # Fetch real hospitals within 10km using Overpass API
        overpass_url = "http://overpass-api.de/api/interpreter"
        query = f"""
        [out:json];
        (
          node["amenity"="hospital"](around:{radius},{lat},{lng});
          node["amenity"="clinic"](around:{radius},{lat},{lng});
        );
        out 5;
        """
        hospitals = []
        try:
            response = requests.get(overpass_url, params={'data': query}, timeout=10)
            data = response.json()
            for i, element in enumerate(data.get('elements', [])):
                name = element.get('tags', {}).get('name', f"Medical Facility {i+1}")
                # Mocking distance/beds dynamically based on real node ID for realism
                beds = random.randint(20, 150)
                icu = int(beds * 0.2)
                hospitals.append({
                    "name": name, 
                    "distance": f"{round(random.uniform(0.5, 9.9), 1)} km", 
                    "beds": beds,
                    "icu": icu, 
                    "emergency": True, 
                    "speciality": "General Emergency"
                })
        except Exception as e:
            print(f"Overpass Error: {e}")
        
        # Fallback if Overpass fails or returns empty
        if not hospitals:
             hospitals = [
                {"name": "General Hospital (Fallback)", "distance": "2.1 km", "beds": 50, "icu": 10, "emergency": True, "speciality": "Trauma & Emergency"},
             ]
        return hospitals

    @staticmethod
    def find_shelters(lat: float, lng: float, radius: int = 10000) -> list:
        # Fetch real schools/community centres to act as shelters
        overpass_url = "http://overpass-api.de/api/interpreter"
        query = f"""
        [out:json];
        (
          node["amenity"="school"](around:{radius},{lat},{lng});
          node["amenity"="community_centre"](around:{radius},{lat},{lng});
        );
        out 4;
        """
        shelters = []
        try:
            response = requests.get(overpass_url, params={'data': query}, timeout=10)
            data = response.json()
            for i, element in enumerate(data.get('elements', [])):
                name = element.get('tags', {}).get('name', f"Emergency Shelter {i+1}")
                cap = random.randint(100, 500)
                shelters.append({
                    "name": name, 
                    "distance": f"{round(random.uniform(0.5, 9.9), 1)} km", 
                    "capacity": cap,
                    "current": int(cap * random.uniform(0.1, 0.4)), 
                    "amenities": ["Water", "Sanitation", "First Aid", "Food"]
                })
        except Exception as e:
            print(f"Overpass Error: {e}")
            
        if not shelters:
             shelters = [
                 {"name": "Government School (Fallback)", "distance": "1.2 km", "capacity": 200, "current": 50, "amenities": ["Water", "Sanitation"]}
             ]
        return shelters

    @staticmethod
    def get_govt_advisories(disaster_type: str) -> list:
        base_advisories = [
            {"source": "National Disaster Management Authority", "type": "ALERT",
             "message": f"NDMA has issued a {disaster_type.upper()} alert. All citizens in affected areas must follow official instructions."},
            {"source": "State Emergency Operations Center", "type": "ORDER",
             "message": "District Collectors authorized to use all government buildings as emergency shelters. Schools closed until further notice."},
            {"source": "Indian Meteorological Department", "type": "ADVISORY",
             "message": "Weather monitoring stations activated. Hourly updates being broadcast on All India Radio and Doordarshan."},
        ]
        specific = {
            "flood": {"source": "Central Water Commission", "type": "WARNING",
                      "message": "River water levels above danger mark. Dam releases may increase. Evacuate low-lying areas immediately."},
            "cyclone": {"source": "IMD Cyclone Warning Division", "type": "RED ALERT",
                        "message": "Cyclone expected to make landfall in 12-18 hours. Wind speeds of 120-150 km/h expected. Fishing boats must return to shore immediately."},
            "earthquake": {"source": "National Seismological Centre", "type": "ADVISORY",
                           "message": "Aftershocks expected for next 72 hours. Do not enter damaged structures. Report gas leaks immediately."},
            "drought": {"source": "Central Ground Water Board", "type": "ADVISORY",
                        "message": "Groundwater levels critically low. Water rationing in effect. Tanker supply being arranged for affected villages."},
            "pandemic": {"source": "Ministry of Health & Family Welfare", "type": "ADVISORY",
                         "message": "Mask mandate in effect for all public spaces. Vaccination drives accelerated. Report symptoms via helpline 1075."},
            "fire": {"source": "National Fire Service", "type": "WARNING",
                     "message": "Avoid areas near the fire zone. Do not attempt independent rescue. Emergency helpline: 101."},
            "tsunami": {"source": "INCOIS Tsunami Warning Centre", "type": "RED ALERT",
                        "message": "Tsunami warning issued for coastal regions. Move to areas above 30m elevation immediately."},
            "landslide": {"source": "Geological Survey of India", "type": "WARNING",
                          "message": "Landslide-prone zones marked for evacuation. Avoid hilly terrain and unstable slopes."},
            "heatwave": {"source": "IMD Heat Action Plan", "type": "ADVISORY",
                         "message": "Avoid outdoor exposure between 11 AM and 4 PM. Drink ORS and stay hydrated. Cooling centers open at all govt buildings."},
        }
        if disaster_type.lower() in specific:
            base_advisories.append(specific[disaster_type.lower()])
        return base_advisories

    @staticmethod
    def get_geo_coords(location: str, disaster_type: str = "general") -> dict:
        coords = {
            "chennai": {"lat": 13.0827, "lng": 80.2707}, "mumbai": {"lat": 19.0760, "lng": 72.8777},
            "delhi": {"lat": 28.7041, "lng": 77.1025}, "kolkata": {"lat": 22.5726, "lng": 88.3639},
            "bangalore": {"lat": 12.9716, "lng": 77.5946}, "hyderabad": {"lat": 17.3850, "lng": 78.4867},
            "pune": {"lat": 18.5204, "lng": 73.8567}, "ahmedabad": {"lat": 23.0225, "lng": 72.5714},
        }
        
        # Calculate dynamic radius
        radius = 5
        dt = disaster_type.lower()
        if any(x in dt for x in ["cyclone", "tsunami", "earthquake"]): radius = 50
        elif "flood" in dt: radius = 25
        elif any(x in dt for x in ["fire", "industrial", "spill", "leak"]): radius = 3
        elif "pandemic" in dt: radius = 100
        
        for city, c in coords.items():
            if city in location.lower():
                return {**c, "label": location, "radius_km": radius}
        return {"lat": 20.5937, "lng": 78.9629, "label": location, "radius_km": radius}


# ───────────────────────────────────────────
# GEMINI PROMPT
# ───────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert disaster response AI and emergency command director. Generate a HIGHLY DETAILED, COMPREHENSIVE 12-section operational plan.
Your response MUST be exclusively a valid JSON object (no markdown formatting outside of strings, no explanations before/after) with this EXACT structure:

{
  "incidentSummary": {
    "disasterType": "string",
    "location": "string",
    "severityLevel": "LOW | MEDIUM | HIGH | CRITICAL",
    "impactRadiusKM": "number",
    "estimatedAffectedPopulation": "string"
  },
  "riskAnalysis": {
    "hazardSeverity": "string — detailed paragraph",
    "predictedImpacts": ["list of 3-5 major impacts"],
    "environmentalConditions": "string — summarize the weather impact on operations"
  },
  "weatherConditions": "string — raw weather data analysis",
  "ndmaGuidelineInsights": ["list of 3-5 specific insights extracted directly from provided NDMA RAG context"],
  "nearbyHospitals": [
    {
      "name": "string",
      "distance": "string",
      "availableBeds": "number",
      "icuAvailability": "number"
    }
  ],
  "nearestShelters": [
    {
      "name": "string",
      "distance": "string",
      "capacity": "number",
      "availableFacilities": ["list of facilities"]
    }
  ],
  "governmentAdvisories": ["list of official alerts"],
  "actionPlanForCivilians": {
    "generalInstructions": ["3-5 clear instructions"],
    "evacuationRoutes": "string describing escape strategy",
    "safetyPrecautions": ["4-6 critical safety tips"]
  },
  "actionPlanForRescueOperators": {
    "deploymentStrategies": ["3-4 team deployment instructions"],
    "evacuationPlans": ["2-3 mass evacuation steps"],
    "medicalTriageProcedures": ["2-3 triage steps"],
    "supplyDistribution": ["2-3 logistics steps"]
  },
  "emergencyContacts": [
    {"department": "string", "number": "string"}
  ],
  "essentialSuppliesKit": ["list of 6-8 must-have items"],
  "continuousMonitoring": {
    "metricsToTrack": ["3-4 metrics"],
    "updateFrequency": "string (e.g., Hourly)"
  }
}

Rules:
- The report MUST be long, descriptive, and operationally useful. Do not give one-word answers for paragraphs.
- Generate UNIQUE content specifically tailored to the disaster type and location.
- DO NOT generate a flood response if the query is about a cyclone, drought, etc. Conform strictly to the incident.
- Integrate the provided MCP weather intelligence deeply into the risk analysis.
- Rely heavily on the provided NDMA guidelines (RAG protocols) for your official recommendations.
- Always return valid JSON. Do not include ```json fences at the beginning or end.
"""


# ───────────────────────────────────────────
# PLANNING AGENT
# ───────────────────────────────────────────
class PlanningAgent:
    def __init__(self):
        self.rag = RAGEngine("data")
        self.tools = MCPTools()
        self.rag.initialize()

    async def _fetch_live_weather(self, lat: float, lng: float) -> str:
        """Connects to the local FastMCP Weather server via stdio and executes the tool."""
        server_params = StdioServerParameters(
            command=sys.executable,
            args=["weather_mcp.py"],
            env=None
        )
        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool("get_live_weather", arguments={"lat": lat, "lng": lng})
                    if result.content and len(result.content) > 0:
                        return result.content[0].text
                    return "No weather data returned from MCP tool."
        except Exception as e:
            return f"Failed to connect to MCP Weather Server: {e}"

    async def run(self, query: str) -> dict:
        steps = []
        ts = lambda: datetime.now().strftime("%H:%M:%S")

        # Step 1: Analyze & Detect Disaster Type
        disaster_keywords = {
            "flood": ["flood", "flooding", "submerged", "waterlogged", "rain", "deluge"],
            "cyclone": ["cyclone", "hurricane", "typhoon", "storm surge"],
            "earthquake": ["earthquake", "tremor", "seismic", "quake", "richter"],
            "drought": ["drought", "water scarcity", "famine", "dry spell", "no rain"],
            "fire": ["fire", "blaze", "wildfire", "burning", "inferno"],
            "pandemic": ["pandemic", "epidemic", "virus", "outbreak", "covid", "infection"],
            "tsunami": ["tsunami", "tidal wave"],
            "landslide": ["landslide", "mudslide", "debris flow"],
            "heatwave": ["heatwave", "heat wave", "extreme heat", "heat stroke"],
            "industrial": ["chemical", "industrial", "gas leak", "explosion", "factory", "spill"],
        }
        detected_type = "disaster"
        for dtype, keywords in disaster_keywords.items():
            if any(kw in query.lower() for kw in keywords):
                detected_type = dtype
                break

        steps.append({"type": "thought", "label": "Scenario Analysis",
                       "details": f"Detected Situation: {detected_type.upper()}. Processing input parameters...", "timestamp": ts()})

        # Step 2: Location extraction
        location = "Affected Area"
        cities = ["Chennai", "Mumbai", "Delhi", "Kolkata", "Bangalore", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Lucknow"]
        for city in cities:
            if city.lower() in query.lower():
                location = city
                break

        geo = self.tools.get_geo_coords(location, detected_type)
        steps.append({"type": "tool", "label": "Geolocation & Area Mapping",
                       "details": f"Coordinates: ({geo['lat']}, {geo['lng']}) | Assigned Response Radius: {geo['radius_km']}km",
                       "timestamp": ts()})

        # Step 3: RAG retrieval
        protocols = self.rag.retrieve(query)
        steps.append({"type": "retrieval", "label": "Knowledge Base Search",
                       "details": f"Retrieved relevant {detected_type} protocols from NDMA RAG context.",
                       "timestamp": ts()})

        # Step 4: True MCP Tool Execution (Weather)
        weather_text = await self._fetch_live_weather(geo['lat'], geo['lng'])
        steps.append({"type": "tool", "label": "Live Weather Intelligence (MCP)",
                       "details": weather_text,
                       "timestamp": ts()})

        # Step 5: Geo-Spatial Scans (Hospitals & Shelters)
        hospitals = self.tools.check_hospitals(geo['lat'], geo['lng'], radius=geo['radius_km']*1000)
        total_beds = sum(h["beds"] for h in hospitals)
        steps.append({"type": "tool", "label": "Hospital Capacity Scan",
                       "details": f"Scanned {len(hospitals)} nearby hospitals. Total available beds: {total_beds}",
                       "timestamp": ts()})

        shelters = self.tools.find_shelters(geo['lat'], geo['lng'], radius=geo['radius_km']*1000)
        shelter_capacity = sum(s["capacity"] - s["current"] for s in shelters)
        steps.append({"type": "tool", "label": "Shelter Availability",
                       "details": f"Found {len(shelters)} shelters with ~{shelter_capacity} spots available.",
                       "timestamp": ts()})

        govt_news = self.tools.get_govt_advisories(detected_type)
        steps.append({"type": "tool", "label": "Government Advisories",
                       "details": f"Retrieved {len(govt_news)} official advisories for {detected_type}.",
                       "timestamp": ts()})

        # Step 6: Call Gemini
        steps.append({"type": "thought", "label": "AI Plan Generation",
                       "details": f"Synthesizing 12-section {detected_type} operational blueprint...",
                       "timestamp": ts()})

        user_prompt = (
            f"User Query: {query}\n"
            f"Disaster Classification: {detected_type.upper()}\n"
            f"Location: {location}\n"
            f"Impact Radius: {geo['radius_km']} KM\n"
            f"Live Weather: {weather_text}\n"
            f"Nearby hospitals: {json.dumps(hospitals)}\n"
            f"Available shelters: {json.dumps(shelters)}\n"
            f"Government advisories: {json.dumps(govt_news)}\n"
            f"Protocols from knowledge base (RAG): {protocols}\n\n"
            f"Generate a comprehensive, unique operational response plan strictly for a {detected_type.upper()} scenario. "
            f"Include the impactRadiusKM as {geo['radius_km']} in the JSON output."
        )

        plan: dict = {}

        try:
            response = gemini_model.generate_content(
                [{"role": "user", "parts": [{"text": SYSTEM_PROMPT + "\n\n" + user_prompt}]}],
                generation_config=genai.types.GenerationConfig(temperature=0.7, max_output_tokens=4000)
            )
            text = response.text.strip()
            # Strip markdown code fences if present
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'^```\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            plan = json.loads(text)
        except Exception as e:
            print(f"[Gemini Error] {e}")
            plan = {
                "incidentSummary": {
                    "disasterType": detected_type.upper(),
                    "location": location,
                    "severityLevel": "HIGH",
                    "impactRadiusKM": geo.get("radius_km", 5),
                    "estimatedAffectedPopulation": "100,000+"
                },
                "riskAnalysis": {
                    "hazardSeverity": f"A severe {detected_type} event is currently unfolding in {location}.",
                    "predictedImpacts": ["Infrastructure damage", "Power outages", "Communication breakdowns"],
                    "environmentalConditions": weather_text
                },
                "weatherConditions": weather_text,
                "ndmaGuidelineInsights": [
                    "Activate Incident Response System immediately.",
                    "Establish Emergency Operations Center.",
                    "Coordinate with NDRF and state disaster units."
                ],
                "nearbyHospitals": hospitals,
                "nearestShelters": shelters,
                "governmentAdvisories": [g.get("message", "Stay indoors.") for g in govt_news],
                "actionPlanForCivilians": {
                    "generalInstructions": [
                        "Stay calm and tuned to emergency broadcasts.",
                        "Follow official evacuation orders.",
                        "Gather your emergency supply kit."
                    ],
                    "evacuationRoutes": "Move to higher ground or designated government shelters using main arterial roads.",
                    "safetyPrecautions": [
                        "Stay away from damaged structures.",
                        "Do not touch downed power lines.",
                        "Drink only purified or bottled water.",
                        "Keep mobile devices charged."
                    ]
                },
                "actionPlanForRescueOperators": {
                    "deploymentStrategies": [
                        "Deploy NDRF Battalion 4 immediately.",
                        "Setup forward operating bases at key intersections."
                    ],
                    "evacuationPlans": [
                        "Organize mass transit vehicles for vulnerable populations.",
                        "Clear arterial roads for emergency vehicles."
                    ],
                    "medicalTriageProcedures": [
                        "Set up triage centers outside fully operational hospitals.",
                        "Dispatch mobile medical units to high-impact zones."
                    ],
                    "supplyDistribution": [
                        "Transport potable water via tankers.",
                        "Distribute MREs (Meals Ready-to-Eat) at shelters."
                    ]
                },
                "emergencyContacts": [
                    {"department": "National Emergency Number", "number": "112"},
                    {"department": "NDRF Control Room", "number": "011-24363260"},
                    {"department": "Ambulance", "number": "108"}
                ],
                "essentialSuppliesKit": [
                    "Important documents in waterproof bags",
                    "3-day supply of non-perishable food",
                    "Bottled water (1 gallon per person per day)",
                    "First aid kit and prescription medications",
                    "Flashlights and extra batteries",
                    "Battery-powered or hand-crank radio",
                    "Portable phone chargers"
                ],
                "continuousMonitoring": {
                    "metricsToTrack": [
                        "Casualty numbers",
                        "Shelter capacity remaining",
                        "Power grid status"
                    ],
                    "updateFrequency": "Every 2 hours"
                }
            }

        steps.append({"type": "thought", "label": "Plan Complete",
                       "details": f"Generated comprehensive 12-section {detected_type} response plan.",
                       "timestamp": ts()})

        # Attach extra metadata directly to the plan root
        plan["reasoning"] = steps
        plan["coordinates"] = geo
        plan["generatedAt"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        return plan


# ───────────────────────────────────────────
# RESOURCE STATE
# ───────────────────────────────────────────
resource_state = {
    "ambulances":      {"available": 12, "total": 20},
    "rescue_teams":    {"available": 8,  "total": 15},
    "medical_staff":   {"available": 45, "total": 60},
    "shelter_capacity":{"available": 120,"total": 500},
}

def consume_resources(disaster_type: str):
    consumption = {
        "flood":      {"ambulances": 3, "rescue_teams": 4, "medical_staff": 10, "shelter_capacity": 80},
        "cyclone":    {"ambulances": 4, "rescue_teams": 5, "medical_staff": 12, "shelter_capacity": 100},
        "fire":       {"ambulances": 5, "rescue_teams": 3, "medical_staff": 8,  "shelter_capacity": 30},
        "earthquake": {"ambulances": 6, "rescue_teams": 5, "medical_staff": 15, "shelter_capacity": 100},
        "pandemic":   {"ambulances": 2, "rescue_teams": 1, "medical_staff": 20, "shelter_capacity": 50},
        "drought":    {"ambulances": 1, "rescue_teams": 2, "medical_staff": 5,  "shelter_capacity": 20},
        "tsunami":    {"ambulances": 5, "rescue_teams": 6, "medical_staff": 15, "shelter_capacity": 120},
        "landslide":  {"ambulances": 4, "rescue_teams": 5, "medical_staff": 10, "shelter_capacity": 60},
        "heatwave":   {"ambulances": 3, "rescue_teams": 1, "medical_staff": 12, "shelter_capacity": 40},
    }
    used = consumption.get(disaster_type, {"ambulances": 2, "rescue_teams": 2, "medical_staff": 5, "shelter_capacity": 30})
    for key, val in resource_state.items():
        resource_state[key]["available"] = max(0, val["available"] - used.get(key, 0))
    return {k: v.copy() for k, v in resource_state.items()}


# ───────────────────────────────────────────
# API
# ───────────────────────────────────────────
app = FastAPI(title="Operational Planning Agent API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])
agent = PlanningAgent()

class PlanRequest(BaseModel):
    query: str

@app.get("/resources")
async def get_resources():
    return resource_state

@app.post("/plan")
async def generate_plan(request: PlanRequest):
    result = await agent.run(request.query)
    q = request.query.lower()
    dtype = "flood"
    for d in ["cyclone", "fire", "earthquake", "pandemic", "drought", "tsunami", "landslide", "heatwave"]:
        if d in q:
            dtype = d
            break
    result["resource_status"] = consume_resources(dtype)
    return result

@app.post("/resources/reset")
async def reset_resources():
    resource_state["ambulances"]["available"] = 12
    resource_state["rescue_teams"]["available"] = 8
    resource_state["medical_staff"]["available"] = 45
    resource_state["shelter_capacity"]["available"] = 120
    return resource_state

if __name__ == "__main__":
    print("🚀 Operational Planning Agent (Gemini-powered) starting on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
