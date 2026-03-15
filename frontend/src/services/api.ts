import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const generatePlan = async (
  query: string,
  liveLocation?: { lat: number, lng: number },
  locationName?: string
) => {
  const payload: any = { query };
  if (liveLocation) {
    payload.lat = liveLocation.lat;
    payload.lng = liveLocation.lng;
  }
  if (locationName) {
    payload.location = locationName;
  }
  const response = await axios.post(`${API_BASE_URL}/plan`, payload);
  return response.data;
};

export const geocodePlace = async (place: string): Promise<{ lat: number; lng: number } | null> => {
  if (!place?.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}&limit=1`;
    const response = await axios.get(url, { headers: { 'Accept-Language': 'en' } });
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      const [result] = data;
      return { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
    }
  } catch (error) {
    console.warn('Geocoding failed for', place, error);
  }
  return null;
};

export const fetchResources = async () => {
  const response = await axios.get(`${API_BASE_URL}/resources`);
  return response.data;
};

export const resetResources = async () => {
  const response = await axios.post(`${API_BASE_URL}/resources/reset`);
  return response.data;
};
