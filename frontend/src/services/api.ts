
const API_BASE_URL = "http://localhost:3003";

/**
 * Generic API fetch helper
 */
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
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
 */
export const submitContent = async (formData: FormData) => {
  return fetchApi("/submit-content", {
    method: "POST",
    body: formData,
  });
};

/**
 * Submit paper suggestion to backend
 */
export const submitPaperSuggestion = async (data: any, file?: File | null) => {
  if (file) {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    formData.append("file", file);

    return fetchApi("/suggest-paper", {
      method: "POST",
      body: formData,
    });
  }

  return fetchApi("/suggest-paper", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Submit curated data to backend
 */
export const submitCuratedData = async (data: any, file?: File | null) => {
  if (file) {
    const formData = new FormData();
    formData.append("data", JSON.stringify(data));
    formData.append("supportingFile", file); // must match backend field name

    return fetchApi("/submit-data", {
      method: "POST",
      body: formData,
    });
  }

  return fetchApi("/submit-data", {
    method: "POST",
    body: JSON.stringify(data),
  });
};
