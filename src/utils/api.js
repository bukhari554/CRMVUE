import { APP_CONFIG } from "@/Data/appConfig.js";
import store from "@/store";

/**
 * Make an authenticated API call with Bearer token
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function apiCall(endpoint, options = {}) {
  const token = store.getters.authToken;
  
  const defaultHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const url = endpoint.startsWith("http") 
    ? endpoint 
    : `${APP_CONFIG.baseApiUrl}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, config);

  // If unauthorized, clear auth and redirect to login
  if (response.status === 401) {
    store.dispatch("logout");
    if (window.location.pathname !== "/signin") {
      window.location.href = "/signin";
    }
  }

  return response;
}

/**
 * Make a GET request
 */
export async function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: "GET" });
}

/**
 * Make a POST request
 */
export async function apiPost(endpoint, data, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Make a PUT request
 */
export async function apiPut(endpoint, data, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Make a PATCH request
 */
export async function apiPatch(endpoint, data, options = {}) {
  return apiCall(endpoint, {
    ...options,
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/**
 * Make a DELETE request
 */
export async function apiDelete(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: "DELETE" });
}


