

const API_BASE_URL = "http://localhost:5001/api";

/**
 * Generic API fetch helper
 */
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  // Check if we have a token (assuming auth is required as per backend)
  // But wait, the Quick Start says we need a token.
  // The frontend likely stores it in localStorage.
  // We should add Authorization header if token exists.

  const token = localStorage.getItem('token');

  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `API error: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

/**
 * Submit content form data to backend
 * (Legacy/Generic function)
 */
export const submitContent = async (formData: FormData) => {
  return fetchApi("/tracker", {
    method: "POST",
    body: formData,
  });
};

/**
 * Submit paper suggestion to backend
 */
export const submitPaperSuggestion = async (data: any, files?: File[]) => {
  const payload = { ...data, actionType: 'suggest-paper' };

  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    files.forEach((file) => {
      formData.append("files", file); // key 'files' matches nothing specific but backend uses upload.any()
    });

    return fetchApi("/tracker", {
      method: "POST",
      body: formData,
    });
  }

  // Even without file, backend handles JSON body or FormData. 
  // API helper sets Content-Type: application/json for non-FormData.
  // But backend 'upload.any()' might behave differently? 
  // 'upload.any()' parses multipart. If we send JSON, body parser should handle it.
  // Let's force FormData for consistency since backend logic checks 'req.body.data' string parsing primarily for FormData.
  // Actually, backend: `let submissionData = req.body;` then checks `req.body.data` string.
  // If we send JSON, `req.body` IS the data.
  // So sending JSON is fine.

  return fetchApi("/tracker", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

/**
 * Submit curated data to backend
 */
export const submitCuratedData = async (data: any, files?: File[]) => {
  const payload = { ...data, actionType: 'submit-data' };

  if (files && files.length > 0) {
    const formData = new FormData();
    formData.append("data", JSON.stringify(payload));
    files.forEach((file) => {
      formData.append("files", file);
    });

    return fetchApi("/tracker", {
      method: "POST",
      body: formData,
    });
  }

  return fetchApi("/tracker", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};
