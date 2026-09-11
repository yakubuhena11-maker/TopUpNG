import axios from 'axios';

// Change this to your backend's address once it's running
// For now it's a placeholder - we'll build the backend next
const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the auth token to every request, if the user is logged in
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser = (data) => api.post('/auth/login', data);

// Matches
export const getMatches = (params) => api.get('/matches', { params });
export const getMatchById = (id) => api.get(`/matches/${id}`);

// Tickets
export const createTicket = (data) => api.post('/tickets', data);
export const getMyTickets = () => api.get('/tickets/mine');

export default api;