import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const generatePlan = async (query: string) => {
  const response = await axios.post(`${API_BASE_URL}/plan`, { query });
  return response.data;
};

export const fetchResources = async () => {
  const response = await axios.get(`${API_BASE_URL}/resources`);
  return response.data;
};

export const resetResources = async () => {
  const response = await axios.post(`${API_BASE_URL}/resources/reset`);
  return response.data;
};
