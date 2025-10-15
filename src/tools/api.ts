import { useSourceStore } from "@/lib/store";

// export const API_URL = "http://localhost:5000";
//
export const API_URL = "https://test-render-q8l2.onrender.com";

// Original interface
// interface ApiData {
//   [key: string]: any;
// };
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
  engine: "search" | "news" | "finance" | "markets" | "image";
  topic_token?: string;
  section_token?: string;
  window?: string;
  trend?: string;
  index_market?: string;
  num?: number;
  combine?: boolean;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async get(endpoint: string) {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  },

  async post(
    endpoint: string,
    data: ApiData,
    options?: { requestId?: string }
  ) {
    let lastError;
    // Use request_id from data if it exists, otherwise use options or generate new one
    const requestId =
      (data.request_id as string) || options?.requestId || crypto.randomUUID();
    const payload = { ...data, request_id: requestId };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(
          `Making API call to: ${API_URL}${endpoint} (attempt ${attempt})`
        );

        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
          credentials: "include",
        });

        // Handle cancellation gracefully - return special response, don't throw error
        if (response.status === 499) {
          return {
            success: false,
            cancelled: true,
            message: "Request was cancelled",
          };
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessage =
            errorData.error || `HTTP error! status: ${response.status}`;

          // Enhanced error logging with endpoint information
          console.error(`API Error Details:`, {
            endpoint: `${API_URL}${endpoint}`,
            status: response.status,
            statusText: response.statusText,
            error: errorMessage,
            attempt: attempt,
            requestId: requestId,
          });

          throw new Error(
            `API call to ${endpoint} failed: ${errorMessage} (Status: ${response.status})`
          );
        }

        return await response.json();
      } catch (error) {
        lastError = error;
        console.warn(
          `API call attempt ${attempt} failed for ${endpoint}:`,
          error
        );

        // Handle fetch errors that might be due to cancellation (AbortError)
        if ((error as Error)?.name === "AbortError") {
          return {
            success: false,
            cancelled: true,
            message: "Request was cancelled",
          };
        }

        if (attempt < MAX_RETRIES) {
          console.log(`Retrying ${endpoint} in ${RETRY_DELAY}ms...`);
          await sleep(RETRY_DELAY * attempt); // Exponential backoff
        }
      }
    }

    // Enhanced final error message with endpoint details
    const finalError = `API call to ${endpoint} failed after ${MAX_RETRIES} attempts. Last error: ${(lastError as Error)?.message || "Unknown error"}`;
    console.error(`Final API Error:`, {
      endpoint: `${API_URL}${endpoint}`,
      attempts: MAX_RETRIES,
      lastError: (lastError as Error)?.message,
      requestId: requestId,
    });

    throw new Error(finalError);
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
        searchParams.append(paramKey, String(value)); // Convert value to string
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

  /**
   * Cancel a running backend request by request_id.
   * @param requestId The unique request ID to cancel.
   */
  async cancelRequest(requestId: string) {
    const response = await fetch(`${API_URL}/api/cancel-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ request_id: requestId }),
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      );
    }

    return await response.json();
  },
};
