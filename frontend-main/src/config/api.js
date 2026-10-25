/**
 * Groot Frontend API Configuration
 * Defaults to backend port 3000, configurable via VITE_API_URL environment variable.
 */
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default API_BASE_URL;
