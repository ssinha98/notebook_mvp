import { useSourceStore } from "@/lib/store";

// const API_URL = "http://127.0.0.1:5000";
// const API_URL = "http://localhost:5000";

const API_URL = "https://test-render-q8l2.onrender.com";

// Original interface
// interface ApiData {
//   [key: string]: any;
// }

// New interface with better type safety
interface ApiData {
  [key: string]: string | number | boolean | object;
}

interface FileManagerResponse {
  success: boolean;
  download_link?: string;
  full_name?: string;
  nickname?: string;
  file_type?: string;
  userId?: string;
  created_at?: string;
}

export interface GoogleSearchParams {
  query?: string;
  engine: "search" | "news" | "finance" | "markets";
  topic_token?: string;
  section_token?: string;
  window?: string;
  trend?: string;
  index_market?: string;
}

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async post(endpoint: string, data: ApiData) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (response.status === 403) {
      // Handle free tier limit
      throw new Error(
        "Free tier limit reached. Please add your API key for unlimited usage."
      );
    }

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  async uploadFile(
    file: File,
    type: "image" | "csv" | "pdf" | "website",
    name: string
  ) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const response = await fetch(`${API_URL}/api/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.success) {
      // Add to Zustand store with the new signature (name, source)
      useSourceStore.getState().addSource(name, {
        type,
        processedData: result.processed_data,
        rawData: [],
        originalName: file.name,
        filterCriteria: [],
        metadata: {
          original_row_count: 0,
          filtered_row_count: 0,
          columns: [],
          applied_filters: [],
        },
      });
    }

    return result;
  },

  async search(params: GoogleSearchParams) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        // Map 'query' to 'q' and handle 'engine' specially
        const paramKey = key === "query" ? "q" : key;
        searchParams.append(paramKey, value);
      }
    });

    const response = await fetch(
      `${API_URL}/api/search?${searchParams.toString()}`
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },
};
