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
  
  // Check if body is FormData - if so, don't set Content-Type
  const isFormData = options.body instanceof FormData;
  
  const defaultHeaders = {
    "Accept": "application/json",
  };
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Merge headers
  const mergedHeaders = {
    ...defaultHeaders,
    ...options.headers,
  };

  // For FormData, explicitly remove Content-Type to let browser set it with boundary
  if (isFormData) {
    delete mergedHeaders["Content-Type"];
  }

  const config = {
    ...options,
    headers: mergedHeaders,
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
  // If data is FormData, don't stringify
  const isFormData = data instanceof FormData;
  
  return apiCall(endpoint, {
    ...options,
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
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


