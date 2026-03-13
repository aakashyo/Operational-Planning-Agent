import requests
from mcp.server.fastmcp import FastMCP

# Initialize the FastMCP server
mcp = FastMCP("Weather Intelligence")

@mcp.tool()
def get_live_weather(lat: float, lng: float) -> str:
    """Gets real-time live weather and storm data for specific coordinates."""
    url = f"https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lng}&current=temperature_2m,wind_speed_10m,relative_humidity_2m,precipitation,weather_code"
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        current = data.get("current", {})
        
        # Parse basic parameters
        temp = current.get("temperature_2m", "Unknown")
        wind = current.get("wind_speed_10m", "Unknown")
        humidity = current.get("relative_humidity_2m", "Unknown")
        precip = current.get("precipitation", 0.0)
        
        # Basic condition mapping based on precipitation (simplified WMO code mapping)
        wmo_code = current.get("weather_code", 0)
        condition = "Clear"
        if wmo_code >= 95:
            condition = "Thunderstorm"
        elif wmo_code >= 71:
            condition = "Snow"
        elif wmo_code >= 61:
            condition = "Rain"
        elif wmo_code >= 51:
            condition = "Drizzle"
        elif wmo_code >= 45:
            condition = "Fog"
        elif wmo_code >= 1:
            condition = "Cloudy"

        # Return a rich string combining the live data
        return f"Live Weather Data: {condition}, Temperature: {temp}°C, Wind Speed: {wind} km/h, Humidity: {humidity}%, Precipitation: {precip}mm."

    except Exception as e:
        return f"Warning: Could not fetch live weather data. Error: {str(e)}"

if __name__ == "__main__":
    # Start the FastMCP server on stdio suitable for MCP Client consumption
    mcp.run(transport='stdio')
