const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8008';

export const apiFetch = (endpoint, options = {}, jwt = null) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };


  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
};
