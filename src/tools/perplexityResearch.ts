import { auth, db } from "@/tools/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { api } from "@/tools/api";
import { toast } from "sonner";

// Status types for Perplexity research
export type PerplexityResearchStatus =
  | "idle"
  | "waiting"
  | "processing"
  | "complete"
  | "error";

export interface PerplexityStatusData {
  status: PerplexityResearchStatus;
  value?: string;
  citations?: string[];
  error?: string;
  updatedAt?: string;
  summary?: string;
}

export interface PerplexityResearchRequest {
  query: string;
  blockId: string;
  agentId: string;
}

/**
 * Utility class for handling Perplexity Sonar Deep Research operations
 */
export class PerplexityResearchHandler {
  /**
   * Start a new Perplexity research request
   */
  static async startResearch(request: PerplexityResearchRequest): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("No user logged in");
      }

      // First, update status to "waiting"
      await this.updateStatus(request.agentId, request.blockId, {
        status: "waiting",
      });

      // Make the API request
      const response = await api.post("/api/perplexity/start_research", {
        user_id: userId,
        block_id: request.blockId,
        query: request.query.trim(),
        request_id: crypto.randomUUID(),
        reasoning_effort: "medium",
        search_mode: "web",
      });

      if (response.success) {
        toast.success("Perplexity's deep research agent is working on it");
        return { success: true };
      } else {
        throw new Error(
          response.error || "Unexpected response format from server"
        );
      }
    } catch (err: any) {
      const errorMessage =
        err.message || "An error occurred while starting Perplexity research";

      // Update status to error
      await this.updateStatus(request.agentId, request.blockId, {
        status: "error",
        error: errorMessage,
      });

      return {
        success: false,
        error: `There was an error - ${errorMessage}`,
      };
    }
  }

  /**
   * Check the status of a Perplexity research request
   */
  static async checkStatus(
    agentId: string,
    blockId: string
  ): Promise<{
    success: boolean;
    status?: PerplexityResearchStatus;
    error?: string;
  }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("No user logged in");
      }

      const response = await api.post(
        "/api/perplexity/check_perplexity_status",
        {
          user_id: userId,
          block_id: blockId,
        }
      );

      if (response?.status === "complete") {
        // Sanitize the response data
        const sanitizedUpdate: Partial<PerplexityStatusData> = {
          status: "complete",
          summary: response.summary || "", // Add summary from response
          value: response.value || "", // Keep value for backward compatibility
          citations: Array.isArray(response.citations)
            ? response.citations.filter(Boolean)
            : [], // Use citations directly from response
          error: undefined, // Clear any previous error
        };

        await this.updateStatus(agentId, blockId, sanitizedUpdate);
        return { success: true, status: "complete" };
      }

      return { success: true, status: "waiting" };
    } catch (err: any) {
      const errorMessage =
        err.message || "An error occurred while checking Perplexity status";

      // Provide default values for error state
      await this.updateStatus(agentId, blockId, {
        status: "error",
        error: errorMessage,
        value: "", // Empty string instead of undefined
        citations: [], // Empty array instead of undefined
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Load Perplexity research status from Firebase
   */
  static async loadStatus(
    agentId: string,
    blockId: string
  ): Promise<PerplexityStatusData | null> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      // Get reference to the deep research call document
      const docRef = doc(db, `users/${userId}/deep_research_calls/${blockId}`);
      const docSnapshot = await getDoc(docRef);

      if (!docSnapshot.exists()) {
        return {
          status: "idle",
          value: "",
          summary: "",
          citations: [],
          error: "",
          updatedAt: new Date().toISOString(),
        };
      }

      const data = docSnapshot.data();
      //   console.log("Loaded research data:", data); // Debug log

      // Map the document data to PerplexityStatusData
      return {
        status: data.status === "complete" ? "complete" : "idle",
        summary: data.summary || "",
        value: data.value || "",
        citations: Array.isArray(data.citations)
          ? data.citations.filter(Boolean)
          : [],
        error: data.error || "",
        updatedAt: data.updated_at || new Date().toISOString(),
      };
    } catch (error) {
      console.error("Error loading Perplexity status:", error);
      return null;
    }
  }

  /**
   * Update Perplexity research status in Firebase
   */
  static async updateStatus(
    agentId: string,
    blockId: string,
    statusUpdate: Partial<PerplexityStatusData>
  ): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const agentRef = doc(db, `users/${userId}/agents`, agentId);
      const agentDoc = await getDoc(agentRef);

      if (agentDoc.exists()) {
        const agentData = agentDoc.data();
        const updatedBlocks = agentData.blocks.map((block: any) => {
          if (block.id === blockId) {
            const currentStatus = block.perplexityStatus || {};

            // Sanitize the update data - replace undefined with empty values
            const sanitizedUpdate = {
              status: statusUpdate.status || currentStatus.status || "idle",
              value: statusUpdate.value ?? currentStatus.value ?? "",
              summary: statusUpdate.summary ?? currentStatus.summary ?? "",
              citations:
                statusUpdate.citations ?? currentStatus.citations ?? [],
              error: statusUpdate.error ?? currentStatus.error ?? "",
              updatedAt: new Date().toISOString(),
            };

            return {
              ...block,
              perplexityStatus: sanitizedUpdate,
            };
          }
          return block;
        });

        await updateDoc(agentRef, { blocks: updatedBlocks });
      }
    } catch (error) {
      console.error("Error updating Perplexity status:", error);
      throw error;
    }
  }

  /**
   * Check if a research request is currently in progress
   */
  static isResearchInProgress(status: PerplexityResearchStatus): boolean {
    return status === "waiting" || status === "processing";
  }

  /**
   * Check if a research request has completed successfully
   */
  static isResearchComplete(status: PerplexityResearchStatus): boolean {
    return status === "complete";
  }

  /**
   * Check if a research request has an error
   */
  static hasResearchError(status: PerplexityResearchStatus): boolean {
    return status === "error";
  }

  /**
   * Get status badge variant for UI display
   */
  static getStatusBadgeVariant(
    status: PerplexityResearchStatus
  ): "default" | "secondary" | "destructive" {
    switch (status) {
      case "waiting":
        return "default";
      case "complete":
        return "secondary";
      case "error":
        return "destructive";
      default:
        return "default";
    }
  }

  /**
   * Get human-readable status message
   */
  static getStatusMessage(status: PerplexityResearchStatus): string {
    switch (status) {
      case "idle":
        return "Ready to start research";
      case "waiting":
        return "Perplexity's deep research agent is initializing...";
      case "processing":
        return "Perplexity's deep research agent is working on it";
      case "complete":
        return "Research completed";
      case "error":
        return "Research failed";
      default:
        return "Unknown status";
    }
  }

  /**
   * Reset research status to idle
   */
  static async resetStatus(agentId: string, blockId: string): Promise<void> {
    await this.updateStatus(agentId, blockId, {
      status: "idle",
      value: undefined,
      citations: undefined,
      error: "",
    });
  }

  // Add this new debug function
  static async debugCurrentData(
    agentId: string,
    blockId: string
  ): Promise<void> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.log("No user logged in");
        return;
      }

      const agentDoc = await getDoc(doc(db, `users/${userId}/agents`, agentId));
      if (agentDoc.exists()) {
        const agentData = agentDoc.data();
        const block = agentData.blocks?.find((b: any) => b.id === blockId);

        console.log("=== Debug Perplexity Data ===");
        console.log("Full block data:", block);
        console.log("Status data:", block?.perplexityStatus);

        // Check raw response structure
        const rawResponse = block?.perplexityStatus?.rawResponse;
        if (rawResponse) {
          console.log("Citations path check:", {
            "response.citations": rawResponse.citations,
            "response.full_response?.citations":
              rawResponse.full_response?.citations,
            "response.document?.full_response?.citations":
              rawResponse.document?.full_response?.citations,
          });
        }

        console.log("=== End Debug ===");
      } else {
        console.log("No agent document found");
      }
    } catch (error) {
      console.error("Error in debug function:", error);
    }
  }
}

// Export convenience functions
export const startPerplexityResearch = PerplexityResearchHandler.startResearch;
export const loadPerplexityStatus = PerplexityResearchHandler.loadStatus;
export const updatePerplexityStatus = PerplexityResearchHandler.updateStatus;
export const isPerplexityResearchInProgress =
  PerplexityResearchHandler.isResearchInProgress;
