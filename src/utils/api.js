import { APP_CONFIG } from "@/Data/appConfig.js";
import store from "@/store";
import { showToast } from "@/utils/toast.js";

/**
 * Custom API Error class for better error handling
 */
class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Request interceptor queue
 */
const requestInterceptors = [];
const responseInterceptors = [];

/**
 * Add request interceptor
 * @param {function} interceptor - Function to modify request config
 */
export function addRequestInterceptor(interceptor) {
  requestInterceptors.push(interceptor);
}

/**
 * Add response interceptor
 * @param {function} interceptor - Function to modify response
 */
export function addResponseInterceptor(interceptor) {
  responseInterceptors.push(interceptor);
}

/**
 * Handle API response and throw errors if needed
 * @param {Response} response - Fetch response object
 * @returns {Promise<Response>} - Cloned response
 */
async function handleResponse(response) {
  // Clone response to read body multiple times if needed
  const clonedResponse = response.clone();
  
  let data = null;
  const contentType = response.headers.get('content-type');
  
  // Parse response based on content type
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      data = null;
    }
  } else {
    // Handle non-JSON responses (text, blob, etc.)
    try {
      data = await response.text();
    } catch (textError) {
      console.error('Failed to parse text response:', textError);
      data = null;
    }
  }

  // Handle unauthorized (401) - clear auth and redirect
  if (response.status === 401) {
    // Log user out
    store.dispatch("logout").catch(err => {
      console.error('Logout error:', err);
    });
    
    // Redirect to signin
    if (window.location.pathname !== "/signin") {
      window.location.href = "/signin";
    }
    
    throw new ApiError('Unauthorized. Please login again.', 401, data);
  }

  // Handle forbidden (403)
  if (response.status === 403) {
    throw new ApiError('Access forbidden. Insufficient permissions.', 403, data);
  }

  // Handle server errors (500+)
  if (response.status >= 500) {
    throw new ApiError('Server error. Please try again later.', response.status, data);
  }

  // Return cloned response for further handling
  return clonedResponse;
}

/**
 * Build full URL from endpoint
 * @param {string} endpoint - API endpoint
 * @returns {string} - Full URL
 */
function buildUrl(endpoint) {
  if (endpoint.startsWith("http")) {
    return endpoint;
  }
  
  const baseUrl = APP_CONFIG.baseApiUrl.replace(/\/$/, ''); // Remove trailing slash
  const path = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${baseUrl}${path}`;
}

/**
 * Build request headers
 * @param {object} customHeaders - Custom headers to merge
 * @param {boolean} isFormData - Whether body is FormData
 * @returns {object} - Headers object
 */
function buildHeaders(customHeaders = {}, isFormData = false) {
  const token = store.getters.authToken;
  
  const defaultHeaders = {
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest", // CSRF protection
  };
  
  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    defaultHeaders["Content-Type"] = "application/json";
  }

  // Add Authorization header if token exists
  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  // Add timezone for server-side date handling
  defaultHeaders["X-Timezone"] = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Merge headers
  const mergedHeaders = {
    ...defaultHeaders,
    ...customHeaders,
  };

  // For FormData, explicitly remove Content-Type to let browser set it with boundary
  if (isFormData && mergedHeaders["Content-Type"]) {
    delete mergedHeaders["Content-Type"];
  }

  return mergedHeaders;
}

/**
 * Log request details in development mode
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {object} options - Request options
 */
function logRequest(method, url, options = {}) {
  if (process.env.NODE_ENV === 'development' || APP_CONFIG.debug) {
    console.group(`🔄 ${method} Request`);
    console.log('URL:', url);
    console.log('Headers:', options.headers);
    if (options.body) {
      if (options.body instanceof FormData) {
        console.log('Body: FormData');
        for (let [key, value] of options.body.entries()) {
          console.log(`  ${key}:`, value);
        }
      } else {
        try {
          console.log('Body:', JSON.parse(options.body));
        } catch {
          console.log('Body:', options.body);
        }
      }
    }
    console.groupEnd();
  }
}

/**
 * Log response details in development mode
 * @param {Response} response - Fetch response
 * @param {any} data - Parsed response data
 */
function logResponse(response, data = null) {
  if (process.env.NODE_ENV === 'development' || APP_CONFIG.debug) {
    console.group(`📥 ${response.status} Response`);
    console.log('Status:', response.status, response.statusText);
    console.log('OK:', response.ok);
    if (data) {
      console.log('Data:', data);
    }
    console.groupEnd();
  }
}

/**
 * Apply request interceptors
 * @param {object} config - Request config
 * @returns {Promise<object>} - Modified config
 */
async function applyRequestInterceptors(config) {
  let modifiedConfig = { ...config };
  
  for (const interceptor of requestInterceptors) {
    try {
      modifiedConfig = await interceptor(modifiedConfig);
    } catch (error) {
      console.error('Request interceptor error:', error);
    }
  }
  
  return modifiedConfig;
}

/**
 * Apply response interceptors
 * @param {Response} response - Fetch response
 * @returns {Promise<Response>} - Modified response
 */
async function applyResponseInterceptors(response) {
  let modifiedResponse = response;
  
  for (const interceptor of responseInterceptors) {
    try {
      modifiedResponse = await interceptor(modifiedResponse);
    } catch (error) {
      console.error('Response interceptor error:', error);
    }
  }
  
  return modifiedResponse;
}

/**
 * Make an authenticated API call with Bearer token
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {object} options - Fetch options (method, body, etc.)
 * @returns {Promise<Response>}
 */
export async function apiCall(endpoint, options = {}) {
  const isFormData = options.body instanceof FormData;
  const url = buildUrl(endpoint);
  const headers = buildHeaders(options.headers, isFormData);

  let config = {
    ...options,
    headers,
    // Add timeout support (AbortController)
    signal: options.signal || AbortSignal.timeout(options.timeout || 30000), // 30s default
  };

  // Apply request interceptors
  config = await applyRequestInterceptors(config);

  // Log request in development
  logRequest(options.method || 'GET', url, config);

  try {
    const response = await fetch(url, config);
    
    // Get HTTP method to determine if we should show toast
    const httpMethod = (options.method || 'GET').toUpperCase();
    // Only show toasts for POST, PUT, PATCH, DELETE (not GET)
    // Also check if silent option is set to suppress toasts
    const shouldShowToast = !options.silent && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(httpMethod);
    
    // Clone response for toast notification (before handleResponse consumes it)
    const toastResponse = shouldShowToast ? response.clone() : null;
    
    // Parse toast data early so we can show toast even if handleResponse throws
    let toastData = null;
    let toastText = null;
    if (shouldShowToast && toastResponse) {
      try {
        const contentType = toastResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          toastData = await toastResponse.json().catch(() => null);
        } else {
          // Try to parse as text for non-JSON responses (HTML errors, etc.)
          toastText = await toastResponse.text().catch(() => null);
        }
      } catch (toastParseError) {
        // Silently fail - we'll handle toast in catch block if needed
        if (process.env.NODE_ENV === 'development' || APP_CONFIG.debug) {
          console.warn('Toast parse error:', toastParseError);
        }
      }
    }
    
    // Handle response and check for errors
    const processedResponse = await handleResponse(response);
    
    // Apply response interceptors
    const finalResponse = await applyResponseInterceptors(processedResponse);
    
    // Log response in development
    logResponse(finalResponse);

    // Show toast notification based on response (only for POST, PUT, PATCH, DELETE)
    if (shouldShowToast) {
      if (toastData) {
        // Show success toast for successful responses
        if (response.ok && toastData.success) {
          const message = toastData.message || 'Operation successful';
          showToast(message, 'success');
        } 
        // Show error toast for failed responses (but not errors that handleResponse throws)
        else if (!response.ok || !toastData.success) {
          let errorMessage = toastData.message || 'Operation failed';
          // Handle validation errors
          if (toastData.errors) {
            const firstError = Object.values(toastData.errors)[0];
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
          showToast(errorMessage, 'error');
        }
      } else if (toastText && !response.ok) {
        // Handle non-JSON error responses (HTML, plain text, etc.)
        // Try to extract meaningful error message from HTML/text
        let errorMessage = 'Operation failed';
        if (toastText) {
          // Try to extract error message from HTML or text
          const textMatch = toastText.match(/The\s+(\w+)\s+method\s+is\s+not\s+supported[^.]*\./i);
          if (textMatch) {
            errorMessage = textMatch[0];
          } else if (toastText.length < 200) {
            // If it's a short text response, use it directly
            errorMessage = toastText.trim();
          } else {
            // For long HTML responses, use a generic message
            errorMessage = `Request failed (${response.status} ${response.statusText})`;
          }
        }
        showToast(errorMessage, 'error');
      } else if (!response.ok) {
        // Fallback for any other error case
        showToast(`Request failed (${response.status} ${response.statusText})`, 'error');
      }
    }

    return finalResponse;
  } catch (error) {
    // Get HTTP method to determine if we should show toast
    const httpMethod = (options.method || 'GET').toUpperCase();
    // Only show toasts for POST, PUT, PATCH, DELETE (not GET)
    // Also check if silent option is set to suppress toasts
    const shouldShowToast = !options.silent && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(httpMethod);
    
    // Handle timeout errors
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      const timeoutError = new ApiError('Request timeout. Please try again.', 408);
      
      if (process.env.NODE_ENV === 'development' || APP_CONFIG.debug) {
        console.error('❌ API Timeout:', error);
      }
      
      // Show error toast for timeout (only for non-GET requests)
      if (shouldShowToast) {
        showToast('Request timeout. Please try again.', 'error');
      }
      
      throw timeoutError;
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const networkError = new ApiError('Network error. Please check your connection.', 0);
      
      if (process.env.NODE_ENV === 'development' || APP_CONFIG.debug) {
        console.error('❌ Network Error:', error);
      }
      
      // Show error toast for network errors (only for non-GET requests)
      if (shouldShowToast) {
        showToast('Network error. Please check your connection.', 'error');
      }
      
      throw networkError;
    }
    
    // Handle ApiError (from handleResponse)
    if (error instanceof ApiError) {
      // Show error toast for API errors (only for non-GET requests)
      if (shouldShowToast) {
        const errorMessage = error.data?.message || error.message || 'An error occurred';
        showToast(errorMessage, 'error');
      }
    } else {
      // Show generic error toast for other errors (only for non-GET requests)
      if (shouldShowToast) {
        showToast('An error occurred. Please try again.', 'error');
      }
    }
    
    // Log error in development
    if (process.env.NODE_ENV === 'development' || APP_CONFIG.debug) {
      console.error('❌ API Call Failed:', error);
    }
    
    // Re-throw error for caller to handle
    throw error;
  }
}

/**
 * Make a GET request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional fetch options
 * @returns {Promise<Response>}
 */
export async function apiGet(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: "GET" });
}

/**
 * Make a POST request
 * @param {string} endpoint - API endpoint
 * @param {object|FormData} data - Request body data
 * @param {object} options - Additional fetch options
 * @returns {Promise<Response>}
 */
export async function apiPost(endpoint, data, options = {}) {
  const isFormData = data instanceof FormData;
  
  return apiCall(endpoint, {
    ...options,
    method: "POST",
    body: isFormData ? data : JSON.stringify(data),
  });
}

/**
 * Make a PUT request
 * @param {string} endpoint - API endpoint
 * @param {object|FormData} data - Request body data
 * @param {object} options - Additional fetch options
 * @returns {Promise<Response>}
 */
export async function apiPut(endpoint, data, options = {}) {
  const isFormData = data instanceof FormData;
  
  return apiCall(endpoint, {
    ...options,
    method: "PUT",
    body: isFormData ? data : JSON.stringify(data),
  });
}

/**
 * Make a PATCH request
 * @param {string} endpoint - API endpoint
 * @param {object|FormData} data - Request body data
 * @param {object} options - Additional fetch options
 * @returns {Promise<Response>}
 */
export async function apiPatch(endpoint, data, options = {}) {
  const isFormData = data instanceof FormData;
  
  return apiCall(endpoint, {
    ...options,
    method: "PATCH",
    body: isFormData ? data : JSON.stringify(data),
  });
}

/**
 * Make a DELETE request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Additional fetch options
 * @returns {Promise<Response>}
 */
export async function apiDelete(endpoint, options = {}) {
  return apiCall(endpoint, { ...options, method: "DELETE" });
}

/**
 * Download file from API
 * @param {string} endpoint - API endpoint
 * @param {string} filename - Filename to save as
 * @param {object} options - Additional fetch options
 * @returns {Promise<void>}
 */
export async function apiDownload(endpoint, filename, options = {}) {
  try {
    const response = await apiCall(endpoint, { ...options, method: "GET" });
    
    if (!response.ok) {
      throw new ApiError('Download failed', response.status);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Upload file with progress tracking
 * @param {string} endpoint - API endpoint
 * @param {FormData} formData - FormData with file
 * @param {function} onProgress - Progress callback (percentage)
 * @returns {Promise<Response>}
 */
export async function apiUploadWithProgress(endpoint, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = buildUrl(endpoint);
    const token = store.getters.authToken;

    // Upload progress
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        const percentage = Math.round((e.loaded * 100) / e.total);
        onProgress(percentage);
      }
    });

    // Request completed
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const responseData = JSON.parse(xhr.response);
          resolve({
            ok: true,
            status: xhr.status,
            json: async () => responseData,
          });
        } catch {
          resolve({
            ok: true,
            status: xhr.status,
            text: async () => xhr.response,
          });
        }
      } else {
        reject(new ApiError('Upload failed', xhr.status, xhr.response));
      }
    });

    // Network error
    xhr.addEventListener('error', () => {
      reject(new ApiError('Network error', 0));
    });

    // Timeout
    xhr.addEventListener('timeout', () => {
      reject(new ApiError('Upload timeout', 408));
    });

    xhr.open('POST', url);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    // Set timeout (60 seconds for file uploads)
    xhr.timeout = 60000;

    xhr.send(formData);
  });
}

/**
 * Batch API calls with Promise.all
 * @param {Array<Promise>} requests - Array of API call promises
 * @returns {Promise<Array>}
 */
export async function apiBatch(requests) {
  try {
    const responses = await Promise.all(requests);
    return responses;
  } catch (error) {
    console.error('Batch API error:', error);
    throw error;
  }
}

/**
 * Batch API calls with Promise.allSettled (doesn't fail on single error)
 * @param {Array<Promise>} requests - Array of API call promises
 * @returns {Promise<Array>}
 */
export async function apiBatchSettled(requests) {
  try {
    const results = await Promise.allSettled(requests);
    return results;
  } catch (error) {
    console.error('Batch API error:', error);
    throw error;
  }
}

/**
 * Retry API call on failure
 * @param {function} apiFunction - API function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} delay - Delay between retries in ms
 * @returns {Promise<Response>}
 */
export async function apiRetry(apiFunction, maxRetries = 3, delay = 1000) {
  let lastError;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await apiFunction();
    } catch (error) {
      lastError = error;
      
      // Don't retry on 4xx errors (client errors)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      if (i < maxRetries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        
        if (process.env.NODE_ENV === 'development' || APP_CONFIG.debug) {
          console.log(`Retry attempt ${i + 1}/${maxRetries}`);
        }
      }
    }
  }
  
  throw lastError;
}

/**
 * Cancel all pending requests (useful for cleanup)
 */
const abortControllers = new Map();

export function cancelRequest(requestId) {
  const controller = abortControllers.get(requestId);
  if (controller) {
    controller.abort();
    abortControllers.delete(requestId);
  }
}

export function cancelAllRequests() {
  abortControllers.forEach(controller => controller.abort());
  abortControllers.clear();
}

/**
 * Make a cancellable API call
 * @param {string} requestId - Unique request identifier
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export async function apiCallCancellable(requestId, endpoint, options = {}) {
  // Cancel previous request with same ID
  cancelRequest(requestId);
  
  // Create new abort controller
  const controller = new AbortController();
  abortControllers.set(requestId, controller);
  
  try {
    const response = await apiCall(endpoint, {
      ...options,
      signal: controller.signal,
    });
    
    abortControllers.delete(requestId);
    return response;
  } catch (error) {
    abortControllers.delete(requestId);
    throw error;
  }
}

// Export ApiError for custom error handling
export { ApiError };