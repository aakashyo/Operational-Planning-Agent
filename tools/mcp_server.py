import random
from typing import Dict, Any

class DisasterTools:
    """Simulated MCP-style tools for disaster response."""
    
    @staticmethod
    def get_weather(location: str) -> str:
        """Returns current weather risk for a location."""
        risks = ["Severe Storm", "Heavy Rain", "Extreme Heat", "Calm", "Flood Warning"]
        status = random.choice(risks)
        temp = random.randint(25, 40)
        return f"Weather for {location}: {status}, temperature: {temp}C. Risk level: {'HIGH' if status != 'Calm' else 'LOW'}"

    @staticmethod
    def check_hospital_capacity(region: str) -> str:
        """Returns available hospital capacity in a region."""
        capacity = random.randint(0, 100)
        status = "CRITICAL" if capacity < 20 else "STABLE" if capacity < 70 else "GOOD"
        return f"Hospital capacity in {region}: {capacity}% available. Status: {status}"

    @staticmethod
    def allocate_resources(incident_type: str) -> str:
        """Returns available rescue resources based on incident type."""
        resources = {
            "flood": "15 rescue boats, 20 life jackets, 5 medical teams",
            "fire": "10 fire trucks, 3 helicopters, 15 paramedics",
            "earthquake": "5 heavy transit vehicles, 20 search & rescue dogs, 50 tents",
            "pandemic": "1000 vaccines, 200 ventilators, 10 mobile units"
        }
        return resources.get(incident_type.lower(), "Standard emergency response kit available.")

    @staticmethod
    def get_geo_cords(location: str) -> Dict[str, float]:
        """Converts location to coordinates (Mocked)."""
        # Defaulting to Chennai for demo
        return {"lat": 13.0827, "lng": 80.2707, "label": f"Incident: {location}"}

def get_tools_list():
    return [
        {
            "name": "get_weather",
            "description": "Get real-time weather risk for a location.",
            "func": DisasterTools.get_weather
        },
        {
            "name": "check_hospital_capacity",
            "description": "Check available hospital beds and staff in a region.",
            "func": DisasterTools.check_hospital_capacity
        },
        {
            "name": "allocate_resources",
            "description": "Allocate rescue resources based on the incident type (flood, fire, earthquake, pandemic).",
            "func": DisasterTools.allocate_resources
        },
        {
            "name": "get_geo_cords",
            "description": "Convert a location name to geographic coordinates.",
            "func": DisasterTools.get_geo_cords
        }
    ]
