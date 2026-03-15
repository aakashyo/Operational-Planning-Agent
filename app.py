import os
import sys
import json
import time
import re
import asyncio
import random
import socket
import requests
from datetime import datetime
from typing import Dict, Any

from fastapi import FastAPI, Request
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Helper for clearer errors when running without the project's virtual environment
def _missing_dependency_message(exc: Exception, package_name: str):
    print(f"[ERROR] Missing required package: {package_name}")
    print(f"  {exc}")
    print("  → Make sure you are running inside the project virtual environment:")
    print("      Windows PowerShell:  .\\.venv\\Scripts\\Activate.ps1")
    print("      Windows cmd:        .\\.venv\\Scripts\\activate.bat")
    print("      macOS/Linux:        source .venv/bin/activate")
    print("  Then reinstall dependencies:")
    print("      pip install -r requirements.txt")
    sys.exit(1)

try:
    import google.generativeai as genai
except Exception as e:
    _missing_dependency_message(e, "google-generativeai")

# MCP Client Imports (optional)
MCP_AVAILABLE = True
try:
    from mcp import ClientSession, StdioServerParameters
    from mcp.client.stdio import stdio_client
except ImportError:
    MCP_AVAILABLE = False
    print("[WARN] MCP package not available. Live weather tools will be disabled.")

    # Provide stub classes/functions so app can still run without MCP installed.
    class ClientSession:
        def __init__(self, *args, **kwargs):
            pass
        async def __aenter__(self):
            return self
        async def __aexit__(self, exc_type, exc, tb):
            return False
        async def initialize(self):
            return
        async def call_tool(self, *args, **kwargs):
            return None

    class StdioServerParameters:
        def __init__(self, *args, **kwargs):
            pass

    async def stdio_client(*args, **kwargs):
        class Dummy:
            async def __aenter__(self):
                return (None, None)
            async def __aexit__(self, exc_type, exc, tb):
                return False
        return Dummy()

# ───────────────────────────────────────────
# GEMINI SETUP
# ───────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")  # Optional: used for additional external insights
GROQ_API_URL = os.getenv("GROQ_API_URL")  # Full endpoint for Groq service

if not GEMINI_API_KEY:
    print("[ERROR] GEMINI_API_KEY not found in environment variables or .env file.")
    # In a production environment, you might want to raise an error here
    # sys.exit(1)

if GROQ_API_KEY:
    print("[INFO] GROQ_API_KEY detected — Groq integrations can be enabled.")
    if not GROQ_API_URL:
        print("[WARN] GROQ_API_KEY is set but GROQ_API_URL is not. Set GROQ_API_URL to enable Groq calls.")

# Configure Gemini (primary language model)
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel("gemini-2.0-flash")

# ───────────────────────────────────────────
# RAG ENGINE (optional)
# ───────────────────────────────────────────
try:
    import torch
except Exception as e:
    print(f"[WARN] Optional dependency 'torch' not available ({e}). RAG embeddings will default to CPU if available.")
    torch = None

RAG_AVAILABLE = True
try:
    # LangChain v0.0+ unified imports
    from langchain.vectorstores import Chroma
    from langchain.embeddings import HuggingFaceEmbeddings
except Exception:
    try:
        # Older package layout (if installed)
        from langchain_chroma import Chroma
        from langchain_huggingface import HuggingFaceEmbeddings
    except Exception as e:
        print(f"[WARN] Optional RAG dependencies not installed: {e}. RAG semantic search will be disabled.")
        RAG_AVAILABLE = False
        Chroma = None
        HuggingFaceEmbeddings = None

class RAGEngine:
    def __init__(self, db_dir: str = "data/chroma_db"):
        self.db_dir = db_dir
        self.vectorstore = None

    def initialize(self):
        if not RAG_AVAILABLE:
            print("[RAG] Skipping initialization (required packages missing).")
            return

        if not os.path.exists(self.db_dir):
            print(f"[RAG] WARNING: Vector database not found at {self.db_dir}. Please run ingest.py first.")
            return

        device = "cpu"
        if torch is not None and getattr(torch, "cuda", None) is not None and torch.cuda.is_available():
            device = "cuda"
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
    def estimate_affected_population(query: str, location: str, disaster_type: str) -> dict:
        """Estimate affected population ratio based on user input and optional Groq API.

        Returns a dict:
          {
            "value": "X% of population" or "Unknown",
            "source": "user|groq|heuristic|unknown"
          }
        """
        # 1) Try to infer directly from the user query (explicit percent)
        import re
        pct_match = re.search(r"(\d{1,3}(?:\.\d+)?\s*%)(?!\w)", query)
        if pct_match:
            return {"value": pct_match.group(1), "source": "user"}

        # 2) Try Groq if configured
        if GROQ_API_KEY and GROQ_API_URL:
            try:
                prompt = (
                    "You are a disaster analytics engine. Examine the following scenario and provide a concise estimate of the "
                    "percentage of the local population affected (format: 'X% of population' or 'X-Y% of population').\n"
                    "If you cannot estimate reliably, respond with 'Unknown'.\n"
                    f"Scenario: {query}\n"
                    f"Location: {location}\n"
                    f"Disaster type: {disaster_type}\n"
                )
                resp = requests.post(
                    GROQ_API_URL,
                    headers={
                        "Authorization": f"Bearer {GROQ_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={"input": prompt},
                    timeout=10
                )
                if resp.ok and resp.text:
                    text = resp.text.strip().splitlines()[0].strip()
                    if "percent" in text.lower() or "%" in text or "unknown" in text.lower():
                        return {"value": text, "source": "groq"}
            except Exception as e:
                print(f"Groq API error (population estimate): {e}")

        # 3) Heuristic fallbacks (only if no better info available)
        fallbacks = {
            "flood": "15-30% of population",
            "cyclone": "20-40% of population",
            "earthquake": "10-25% of population",
            "drought": "30-60% of population",
            "fire": "5-15% of population",
            "pandemic": "10-50% of population",
            "tsunami": "20-50% of population",
            "landslide": "5-20% of population",
            "heatwave": "10-30% of population",
        }
        value = fallbacks.get(disaster_type.lower(), "Unknown")
        source = "unknown" if value == "Unknown" else "heuristic"
        return {"value": value, "source": source}

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
                h_lat = element.get('lat', lat + random.uniform(-0.05, 0.05))
                h_lng = element.get('lon', lng + random.uniform(-0.05, 0.05))
                hospitals.append({
                    "name": name, 
                    "distance": f"{round(random.uniform(0.5, 9.9), 1)} km", 
                    "beds": beds,
                    "icu": icu, 
                    "emergency": True, 
                    "speciality": "General Emergency",
                    "lat": float(h_lat),
                    "lng": float(h_lng)
                })
        except Exception as e:
            print(f"Overpass Error: {e}")
        
        # Fallback if Overpass fails or returns empty
        if not hospitals:
             hospitals = [
                {
                    "name": "General Hospital (Fallback)", 
                    "distance": "2.1 km", "beds": 50, "icu": 10, "emergency": True, "speciality": "Trauma & Emergency",
                    "lat": lat + random.uniform(-0.02, 0.02),
                    "lng": lng + random.uniform(-0.02, 0.02)
                },
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
                s_lat = element.get('lat', lat + random.uniform(-0.06, 0.06))
                s_lng = element.get('lon', lng + random.uniform(-0.06, 0.06))
                shelters.append({
                    "name": name, 
                    "distance": f"{round(random.uniform(0.5, 9.9), 1)} km", 
                    "capacity": cap,
                    "current": int(cap * random.uniform(0.1, 0.4)), 
                    "amenities": ["Water", "Sanitation", "First Aid", "Food"],
                    "lat": float(s_lat),
                    "lng": float(s_lng)
                })
        except Exception as e:
            print(f"Overpass Error: {e}")
            
        if not shelters:
             shelters = [
                 {
                     "name": "Government School (Fallback)", "distance": "1.2 km", "capacity": 200, "current": 50, "amenities": ["Water", "Sanitation"],
                     "lat": lat + random.uniform(-0.03, 0.03),
                     "lng": lng + random.uniform(-0.03, 0.03)
                 }
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
    def _groq_chat(system_prompt: str, user_prompt: str, max_tokens: int = 1024) -> str:
        """Internal helper: call Groq's OpenAI-compatible chat completions endpoint."""
        if not GROQ_API_KEY:
            return ""
        groq_url = "https://api.groq.com/openai/v1/chat/completions"
        try:
            resp = requests.post(
                groq_url,
                headers={
                    "Authorization": f"Bearer {GROQ_API_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": max_tokens,
                    "temperature": 0.7
                },
                timeout=15
            )
            if resp.ok:
                data = resp.json()
                return data["choices"][0]["message"]["content"].strip()
            else:
                print(f"[Groq] API error {resp.status_code}: {resp.text[:200]}")
                return ""
        except Exception as e:
            print(f"[Groq] Request failed: {e}")
            return ""

    @staticmethod
    def get_groq_insights(query: str) -> str:
        """Fetch a brief supplemental insight summary from Groq for the given query."""
        if not GROQ_API_KEY:
            return ""
        system = (
            "You are an expert disaster response analyst. Given a disaster scenario, "
            "provide 3-5 concise operational insights that a field commander should know. "
            "Each insight must be a complete sentence. Be specific and actionable."
        )
        result = MCPTools._groq_chat(system, query, max_tokens=512)
        if result:
            print("[Groq] Supplemental insights fetched successfully.")
        return result

    @staticmethod
    def get_groq_disaster_context(disaster_type: str, location: str, query: str) -> str:
        """Generate a rich, disaster-type-specific intelligence block using Groq.
        Returns a detailed multi-section text that gets injected into the Gemini prompt
        to make every report section deeply descriptive and operationally useful.
        """
        if not GROQ_API_KEY:
            return ""

        disaster_system_prompts = {
            "flood": (
                "You are an expert flood disaster response coordinator trained by NDRF and NDMA India. "
                "Your knowledge covers riverine floods, flash floods, urban flooding, and dam breach scenarios."
            ),
            "cyclone": (
                "You are an expert cyclone and tropical storm emergency director with 20 years of experience "
                "in the Bay of Bengal and Arabian Sea cyclone management, including landfall operations and "
                "coastal evacuation protocols for Indian coastal states."
            ),
            "earthquake": (
                "You are an expert seismic disaster response specialist with deep knowledge of the Indian "
                "subcontinent's tectonic zones, building collapse rescue operations, aftershock protocols, "
                "and USAR (Urban Search and Rescue) team management."
            ),
            "drought": (
                "You are a drought and water scarcity emergency specialist with expertise in India's arid "
                "regions, MGNREGA emergency works, water tanker logistics, crop failure management, and "
                "livestock protection during severe droughts."
            ),
            "fire": (
                "You are a wildfire and structural fire emergency director experienced in Indian forest "
                "fire management, industrial fire suppression, urban fire containment, and fire evacuation "
                "planning for densely populated Indian cities."
            ),
            "pandemic": (
                "You are a public health emergency specialist and epidemiologist with experience managing "
                "disease outbreaks in India, including contact tracing, quarantine protocols, vaccine "
                "distribution, and coordination with the Ministry of Health and ICMR."
            ),
            "tsunami": (
                "You are an Indian Ocean tsunami response expert, experienced with the 2004 Indian Ocean "
                "tsunami, INCOIS early warning systems, coastal evacuation protocols, and post-tsunami "
                "Search and Rescue operations for India's eastern and western coastlines."
            ),
            "landslide": (
                "You are a geological hazard and landslide response expert with expertise in the Western "
                "Ghats, Himalayas, and Northeast India slide-prone zones, including debris removal, "
                "road clearance, and community displacement management."
            ),
            "heatwave": (
                "You are an extreme heat and heatwave emergency coordinator experienced with India's Heat "
                "Action Plans, managing heat-related illness mass casualty events, coordinating cooling "
                "centres, ORS distribution, and protecting vulnerable populations during extreme heat."
            ),
            "industrial": (
                "You are an industrial hazmat and chemical emergency response expert trained in CBRN "
                "(Chemical, Biological, Radiological, Nuclear) incidents, gas leak containment, factory "
                "explosion response, and environmental decontamination procedures in India."
            ),
        }

        system = disaster_system_prompts.get(
            disaster_type.lower(),
            "You are an expert general disaster response coordinator with comprehensive knowledge of Indian "
            "emergency management systems, NDRF protocols, and multi-hazard response."
        )

        user = (
            f"Disaster Type: {disaster_type.upper()}\n"
            f"Location: {location}\n"
            f"Scenario: {query}\n\n"
            "Generate a comprehensive disaster intelligence briefing with ALL of the following sections. "
            "Each point must be a complete, detailed sentence of at least 20 words. Be highly specific:\n\n"
            "**HAZARD PROFILE** (3 paragraphs describing the disaster's behavior, progression phases, and unique dangers in this location)\n\n"
            "**CIVILIAN SURVIVAL PRIORITIES** (exactly 10 numbered, detailed survival actions specific to this disaster type — each a full descriptive sentence)\n\n"
            "**FIELD OPERATOR TACTICAL CHECKLIST** (exactly 10 numbered, detailed tactical steps for rescue teams — include specific equipment, team sizes, and timelines)\n\n"
            "**MEDICAL TRIAGE PROTOCOL** (5 detailed points on injuries/conditions specific to this disaster type, triage categories, and treatment priorities)\n\n"
            "**MONITORING METRICS AND THRESHOLDS** (5 specific measurable metrics with critical threshold values that operators must track during this disaster)"
        )

        print(f"[Groq] Fetching {disaster_type.upper()} disaster intelligence for {location}...")
        result = MCPTools._groq_chat(system, user, max_tokens=2048)
        if result:
            print(f"[Groq] Disaster context fetched: {len(result)} characters")
        return result

    @staticmethod
    def get_geo_coords(location: str, disaster_type: str = "general") -> dict:
        coords = {
            "chennai": {"lat": 13.0827, "lng": 80.2707}, "mumbai": {"lat": 19.0760, "lng": 72.8777},
            "delhi": {"lat": 28.7041, "lng": 77.1025}, "kolkata": {"lat": 22.5726, "lng": 88.3639},
            "bangalore": {"lat": 12.9716, "lng": 77.5946}, "hyderabad": {"lat": 17.3850, "lng": 78.4867},
            "pune": {"lat": 18.5204, "lng": 73.8567}, "ahmedabad": {"lat": 23.0225, "lng": 72.5714},
        }
        
        # Calculate dynamic radius based on disaster type
        radius = 5
        dt = disaster_type.lower()
        if any(x in dt for x in ["cyclone", "tsunami", "earthquake"]): radius = 50
        elif "flood" in dt: radius = 25
        elif any(x in dt for x in ["fire", "industrial", "spill", "leak"]): radius = 3
        elif "pandemic" in dt: radius = 100
        
        # Match from hardcoded list first (fast path)
        for city, c in coords.items():
            if city in location.lower():
                return {**c, "label": location, "radius_km": radius}

        # Dynamic Geocoding via Nominatim if city is unknown
        try:
            print(f"Attempting live geocoding for: {location}")
            headers = {'User-Agent': 'OperationalPlanningAgent/1.0 (test@example.com)'}
            enc_location = requests.utils.quote(location)
            resp = requests.get(f"https://nominatim.openstreetmap.org/search?q={enc_location}&format=json&limit=1", headers=headers, timeout=5)
            if resp.status_code == 200 and resp.json():
                geo_data = resp.json()[0]
                return {
                    "lat": float(geo_data["lat"]), 
                    "lng": float(geo_data["lon"]), 
                    "label": geo_data.get("display_name", location).split(",")[0], 
                    "radius_km": radius
                }
        except Exception as e:
            print(f"Nominatim Geocoding Error: {e}")

        # Final Fallback — center of India
        return {"lat": 20.5937, "lng": 78.9629, "label": location, "radius_km": radius}

    @staticmethod
    def extract_location_from_query(query: str) -> str:
        """Extract the best candidate location name from free-form query text.
        Scans all proper-noun candidates (title-cased tokens, multi-word combos)
        and returns the most specific one found. Does NOT geocode here."""
        import re
        # Common disaster/English words to skip
        skip_words = {
            "cyclone", "flood", "earthquake", "fire", "tsunami", "storm", "disaster",
            "tell", "me", "the", "nearest", "hospital", "shelter", "help", "emergency",
            "please", "find", "what", "how", "is", "are", "happening", "category", "alert",
            "high", "low", "medium", "critical", "approaching", "coast", "area", "zone",
            "severe", "affected", "due", "landslide", "heatwave", "drought", "pandemic",
            "epidemic", "outbreak", "industrial", "chemical", "spill", "leak", "response",
            "major", "minor", "major", "update", "status", "plan", "alert", "report",
        }
        # Tokenize: split by whitespace and punctuation except hyphens within words
        tokens = re.split(r'[\s,;:.!?()\[\]"]+', query)
        
        # Build candidates: multi-word proper nouns first, then single proper nouns
        candidates = []
        i = 0
        while i < len(tokens):
            word = tokens[i].strip()
            if not word:
                i += 1
                continue
            # Try to build 2-word proper noun candidates greedily
            if i + 1 < len(tokens):
                next_word = tokens[i+1].strip()
                if (word and word[0].isupper() and next_word and next_word[0].isupper()
                    and word.lower() not in skip_words and next_word.lower() not in skip_words):
                    candidates.append(f"{word} {next_word}")
            # Also collect single proper nouns
            if word and word[0].isupper() and word.lower() not in skip_words and len(word) > 2:
                candidates.append(word)
            i += 1
        
        if candidates:
            # Prefer the longest candidate (more specific locations rank higher)
            candidates.sort(key=len, reverse=True)
            return candidates[0]
        return "Affected Area"


# ───────────────────────────────────────────
# GEMINI PROMPT
# ───────────────────────────────────────────
SYSTEM_PROMPT = """You are an expert disaster response AI and senior emergency command director with 25 years of field experience. Generate an EXHAUSTIVE, DEEPLY DESCRIPTIVE, 12-section operational plan that reads like a real-world classified emergency operations briefing prepared for a national crisis command centre.

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
    "hazardSeverity": "string — MINIMUM 4 full sentences. Describe: (1) what makes this specific disaster dangerous at this location, (2) the progression timeline from onset to peak, (3) secondary cascading hazards, (4) historical precedent or comparison to similar events in India.",
    "predictedImpacts": ["list of 6-8 major impacts — each item must be a COMPLETE SENTENCE describing the impact, affected population, infrastructure element, and expected severity. Example: 'Severe inundation of low-lying residential zones within 0-2 km of the riverbank is expected to displace an estimated 50,000 residents within the first 6 hours of the flood event.'"],
    "environmentalConditions": "string — MINIMUM 3 full sentences. Describe current weather, how it actively worsens the disaster, visibility for rescue ops, and operational constraints for response teams."
  },
  "weatherConditions": "string — MINIMUM 3 full sentences. Provide a thorough analysis of the weather data: temperature stability, wind direction impact on spread/evacuation, precipitation effects on ground conditions, and forecast trajectory over next 48 hours.",
  "ndmaGuidelineInsights": ["list of 6-8 NDMA insights — each must be a complete actionable sentence drawn from official protocols. Include specific teams (NDRF, SDRF), specific timelines, and expected outcomes per protocol."],
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
  "governmentAdvisories": ["list of 5-7 official alerts — each must be a full sentence from a named authority (e.g., NDMA, IMD, CWC, INCOIS) with specific actions, locations, and deadlines."],
  "actionPlanForCivilians": {
    "generalInstructions": ["8-10 detailed civilian survival instructions — each instruction must be a COMPLETE DESCRIPTIVE SENTENCE with a clear action, the reason for it, the timing, and what to avoid. Example: 'Immediately move all family members and critical documents to the upper floors or roof of your building if floodwaters are rising, as ground-floor submersion may occur within 2-3 hours of a heavy rainfall event.'"],
    "evacuationRoutes": "string — MINIMUM 4 full sentences describing: (1) primary evacuation corridors by road designation, (2) alternative routes if primary is blocked, (3) assembly points with specific locations, (4) special instructions for vehicles, elderly, and disabled persons.",
    "safetyPrecautions": ["8-10 critical safety precautions — each must be a full, specific sentence that explains not just WHAT to do but WHY, referencing the specific hazard of this disaster type."]
  },
  "actionPlanForRescueOperators": {
    "deploymentStrategies": ["6-8 team deployment directives — each must specify: team type (NDRF/SDRF/Fire/Medical), exact zone of operation, number of personnel, equipment required, and success metric. Write as complete sentences."],
    "evacuationPlans": ["4-5 mass evacuation execution steps — each must be a complete sentence describing transport type, priority population, destination, and coordination mechanism."],
    "medicalTriageProcedures": ["5-6 triage procedure steps — each specifically tailored to the injuries and medical conditions caused by THIS disaster type. Include triage categories (Red/Yellow/Green), specific conditions to watch for, and treatment priorities."],
    "supplyDistribution": ["4-5 supply logistics steps — each must specify: which supplies, which agency distributes, target beneficiary count, distribution point locations, and timeline."]
  },
  "emergencyContacts": [
    {"department": "string", "number": "string"}
  ],
  "essentialSuppliesKit": ["list of 10-12 essential items — each item must include a brief justification specific to this disaster type. Example: 'Waterproof torch with extra batteries — critical for navigating flooded areas and signalling rescue boats during night operations.'"],
  "continuousMonitoring": {
    "metricsToTrack": ["6-8 specific measurable monitoring metrics — each must name the metric, the critical threshold value, monitoring frequency, and responsible agency. Example: 'River water level at Gauge Station XYZ: issue evacuation order when level exceeds 8.5m danger mark; monitor every 30 minutes via CWC automated telemetry.'"],
    "updateFrequency": "string — describe the full update cycle: e.g., 'Situation reports every 2 hours to EOC; aerial reconnaissance every 6 hours; hospital capacity updates every 4 hours; weather model updates every 3 hours from IMD.'"
  }
}

CRITICAL RULES:
- EVERY text field MUST be multiple complete sentences — never a single phrase or bullet fragment.
- EVERY list item MUST be a complete sentence of at least 15 words — never a fragment like 'Evacuate immediately'.
- Generate content UNIQUELY tailored to the specific disaster type AND the specific location given.
- The disaster type and location directly determine ALL tactical decisions, hazard profiles, evacuation routes, triage priorities, and supply needs.
- DO NOT generate generic or interchangeable content that could apply to any disaster. If it is a cyclone, write about storm surge, wind damage, fishing communities, and coastal evacuation — not generic 'evacuate to safety' language.
- Integrate the Groq Disaster Intelligence Block, MCP weather data, and NDMA RAG protocols deeply into every relevant section.
- The report must be operationally actionable — a field commander should be able to issue orders to teams directly from this document.
- Always return valid JSON. Do not include ```json fences.
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
        if not MCP_AVAILABLE:
            return "Live weather unavailable: MCP module not installed."

        try:
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool("get_live_weather", arguments={"lat": lat, "lng": lng})
                    if result and getattr(result, 'content', None) and len(result.content) > 0:
                        return result.content[0].text
                    return "No weather data returned from MCP tool."
        except Exception as e:
            return f"Failed to connect to MCP Weather Server: {e}"

    async def run(self, query: str, live_lat: float = None, live_lng: float = None, location_hint: str = None) -> dict:
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

        # Step 2: Location extraction — use the explicit location hint if provided, otherwise scan the query
        location = location_hint.strip() if location_hint and location_hint.strip() else self.tools.extract_location_from_query(query)
        print(f"Extracted candidate location name: '{location}'")
        
        if live_lat is not None and live_lng is not None:
             # Use live location directly, skip geocoding
             radius = 5
             dt = detected_type.lower()
             if any(x in dt for x in ["cyclone", "tsunami", "earthquake"]): radius = 50
             elif "flood" in dt: radius = 25
             elif any(x in dt for x in ["fire", "industrial", "spill", "leak"]): radius = 3
             elif "pandemic" in dt: radius = 100
             geo = {"lat": live_lat, "lng": live_lng, "label": "Your Live Location", "radius_km": radius}
             steps.append({"type": "tool", "label": "Live Geolocation Active",
                            "details": f"Using coordinates shared by user: ({geo['lat']:.4f}, {geo['lng']:.4f}) | Response Radius: {geo['radius_km']}km",
                            "timestamp": ts()})
        else:
            geo = self.tools.get_geo_coords(location, detected_type)
            steps.append({"type": "tool", "label": "Geolocation & Area Mapping",
                           "details": f"Resolved '{location}' → ({geo['lat']:.4f}, {geo['lng']:.4f}) | Response Radius: {geo['radius_km']}km",
                           "timestamp": ts()})

        # Step 3: RAG retrieval
        protocols = self.rag.retrieve(query)
        steps.append({"type": "retrieval", "label": "Knowledge Base Search",
                       "details": f"Retrieved relevant {detected_type} protocols from NDMA RAG context.",
                       "timestamp": ts()})

        # Step 3b: Groq disaster-specific intelligence context
        groq_disaster_context = self.tools.get_groq_disaster_context(detected_type, location, query)
        if groq_disaster_context:
            steps.append({
                "type": "tool", "label": "Groq Disaster Intelligence",
                "details": f"Generated {detected_type.upper()}-specific intelligence block ({len(groq_disaster_context)} chars) covering hazard profile, civilian priorities, tactical checklist, triage protocol, and monitoring metrics.",
                "timestamp": ts()
            })

        # Step 3c: Optional Groq supplemental insights
        groq_insights = self.tools.get_groq_insights(query)
        if groq_insights:
            steps.append({"type": "tool", "label": "Groq Supplemental Insights", "details": groq_insights[:300] + ("..." if len(groq_insights) > 300 else ""), "timestamp": ts()})

        # Step 3c: Estimate affected population ratio (use Groq if available, else heuristic)
        affected = self.tools.estimate_affected_population(query, location, detected_type)
        affected_ratio = affected.get("value")
        affected_source = affected.get("source")
        steps.append({
            "type": "tool",
            "label": "Affected Population Estimate",
            "details": f"Estimated affected population: {affected_ratio} (source: {affected_source})",
            "timestamp": ts()
        })

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
            f"Protocols from knowledge base (RAG): {protocols}\n"
            f"Estimated affected population ratio: {affected_ratio}\n"
        )

        if groq_disaster_context:
            user_prompt += (
                f"\n\n=== GROQ DISASTER INTELLIGENCE BLOCK ({detected_type.upper()}) ===\n"
                f"{groq_disaster_context}\n"
                f"=== END GROQ INTELLIGENCE BLOCK ===\n\n"
                "IMPORTANT: Use the Groq intelligence block above to make every section of this report deeply descriptive "
                "and disaster-type specific. Draw from the Hazard Profile for riskAnalysis, from the Civilian Survival Priorities "
                "for actionPlanForCivilians, from the Field Operator Tactical Checklist for actionPlanForRescueOperators, "
                "from the Medical Triage Protocol for medicalTriageProcedures, and from the Monitoring Metrics for continuousMonitoring.\n"
            )

        if groq_insights:
            user_prompt += f"Additional Groq Insights: {groq_insights}\n"

        user_prompt += (
            f"\nGenerate an EXHAUSTIVE, HIGHLY DESCRIPTIVE operational response plan strictly for a {detected_type.upper()} scenario at {location}. "
            f"Include the impactRadiusKM as {geo['radius_km']} in the JSON output. "
            f"Every text field must be multi-sentence prose. Every list item must be a complete, actionable sentence."
        )

        plan: dict = {}

        try:
            response = gemini_model.generate_content(
                [{"role": "user", "parts": [{"text": SYSTEM_PROMPT + "\n\n" + user_prompt}]}],
                generation_config=genai.types.GenerationConfig(temperature=0.75, max_output_tokens=8192)
            )
            text = response.text.strip()
            # Strip markdown code fences if present
            text = re.sub(r'^```json\s*', '', text)
            text = re.sub(r'^```\s*', '', text)
            text = re.sub(r'\s*```$', '', text)
            plan = json.loads(text)
            # Override or include the estimated affected population ratio (based on user query / Groq / heuristic)
            if isinstance(plan, dict) and plan.get("incidentSummary"):
                plan["incidentSummary"]["estimatedAffectedPopulation"] = affected_ratio
        except Exception as e:
            print(f"[Gemini Error] {e}")
            plan = {
                "incidentSummary": {
                    "disasterType": detected_type.upper(),
                    "location": location,
                    "severityLevel": "HIGH",
                    "impactRadiusKM": geo.get("radius_km", 5),
                    "estimatedAffectedPopulation": affected_ratio
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
    lat: float = None
    lng: float = None
    location: str = None  # Optional explicit location hint, e.g., city name or address

@app.get("/resources")
async def get_resources():
    return resource_state

@app.post("/plan")
async def generate_plan(request: PlanRequest):
    result = await agent.run(request.query, request.lat, request.lng, request.location)
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

def _find_open_port(start: int, end: int) -> int | None:
    for p in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("0.0.0.0", p))
                return p
            except OSError:
                continue
    return None


if __name__ == "__main__":
    preferred_port = int(os.getenv("PORT", os.getenv("APP_PORT", "8000")))
    max_port = preferred_port + 10

    port = _find_open_port(preferred_port, max_port)
    if port is None:
        print(f"[ERROR] Could not bind to any port between {preferred_port} and {max_port}.")
        sys.exit(1)

    print(f"🚀 Operational Planning Agent (Gemini-powered) starting on http://0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
