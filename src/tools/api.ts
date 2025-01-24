import { useSourceStore } from "@/lib/store";

const API_URL = "http://127.0.0.1:5000";

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    
    if (response.status === 403) {
      // Handle free tier limit
      throw new Error("Free tier limit reached. Please add your API key for unlimited usage.");
    }
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    
    return response.json();
  },

  async uploadFile(file: File, type: string, name: string) {
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
      // Add to Zustand store
      useSourceStore.getState().addSource({
        name,
        type,
        filepath: result.filepath,
        processedData: result.processed_data,
      });
    }

    return result;
  },
};
