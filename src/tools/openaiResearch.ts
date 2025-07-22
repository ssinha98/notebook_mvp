import { auth, db } from "@/tools/firebase";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { api } from "@/tools/api";
import { toast } from "sonner";

// Status types for OpenAI research
export type OpenAIResearchStatus =
  | "idle"
  | "called"
  | "complete"
  | "response_fetched"
  | "error";

export interface OpenAIStatusData {
  status: OpenAIResearchStatus;
  requestId?: string;
  threadId?: string;
  error?: string;
  updatedAt?: string;
}

export interface OpenAIResearchRequest {
  prompt: string;
  blockId: string;
  agentId: string;
}

export interface OpenAIResearchResponse {
  success: boolean;
  thread_id?: string;
  error?: string;
}

/**
 * Utility class for handling OpenAI research operations
 */
export class OpenAIResearchHandler {
  /**
   * Start a new OpenAI research request
   */
  static async startResearch(request: OpenAIResearchRequest): Promise<{
    success: boolean;
    data?: { requestId: string; threadId: string };
    error?: string;
  }> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("No user logged in");
      }

      const requestId = crypto.randomUUID();

      // First, update status to "called"
      await this.updateStatus(request.agentId, request.blockId, {
        status: "called",
        requestId: requestId,
      });

      // Make the API request
      const response = await api.post("/api/start_deep_research", {
        prompt: request.prompt.trim(),
        user_id: userId,
        request_id: requestId,
        block_id: request.blockId,
      });

      if (response.success && response.thread_id) {
        // Update status with thread ID
        await this.updateStatus(request.agentId, request.blockId, {
          status: "called",
          requestId: requestId,
          threadId: response.thread_id,
        });

        toast.success("OpenAI's deep research agent is working on it");

        return {
          success: true,
          data: {
            requestId: requestId,
            threadId: response.thread_id,
          },
        };
      } else {
        throw new Error("Unexpected response format from server");
      }
    } catch (err: any) {
      const errorMessage =
        err.message || "An error occurred while starting OpenAI research";

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
   * Load OpenAI research status from Firebase
   */
  static async loadStatus(
    agentId: string,
    blockId: string
  ): Promise<OpenAIStatusData | null> {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return null;

      const agentDoc = await getDoc(doc(db, `users/${userId}/agents`, agentId));
      if (agentDoc.exists()) {
        const agentData = agentDoc.data();
        const block = agentData.blocks?.find((b: any) => b.id === blockId);
        return block?.openAIStatus || null;
      }
      return null;
    } catch (error) {
      console.error("Error loading OpenAI status:", error);
      return null;
    }
  }

  /**
   * Update OpenAI research status in Firebase
   */
  static async updateStatus(
    agentId: string,
    blockId: string,
    statusUpdate: Partial<OpenAIStatusData>
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
            const currentStatus = block.openAIStatus || {};
            return {
              ...block,
              openAIStatus: {
                ...currentStatus,
                ...statusUpdate,
                updatedAt: new Date().toISOString(),
              },
            };
          }
          return block;
        });

        await updateDoc(agentRef, { blocks: updatedBlocks });
      }
    } catch (error) {
      console.error("Error updating OpenAI status:", error);
      throw error;
    }
  }

  /**
   * Check if a research request is currently in progress
   */
  static isResearchInProgress(status: OpenAIResearchStatus): boolean {
    return status === "called";
  }

  /**
   * Check if a research request has completed successfully
   */
  static isResearchComplete(status: OpenAIResearchStatus): boolean {
    return status === "complete" || status === "response_fetched";
  }

  /**
   * Check if a research request has an error
   */
  static hasResearchError(status: OpenAIResearchStatus): boolean {
    return status === "error";
  }

  /**
   * Get status badge variant for UI display
   */
  static getStatusBadgeVariant(
    status: OpenAIResearchStatus
  ): "default" | "secondary" | "destructive" {
    switch (status) {
      case "called":
        return "default";
      case "complete":
      case "response_fetched":
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
  static getStatusMessage(status: OpenAIResearchStatus): string {
    switch (status) {
      case "idle":
        return "Ready to start research";
      case "called":
        return "OpenAI's deep research agent is working on it";
      case "complete":
        return "Research completed";
      case "response_fetched":
        return "Results retrieved";
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
      requestId: "",
      threadId: "",
      error: "",
    });
  }

  /**
   * Fetch completed research results (for future webhook handling)
   */
  static async fetchResults(
    agentId: string,
    blockId: string,
    threadId: string
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      // This will be implemented when webhook handling is added
      // For now, just update status to response_fetched
      await this.updateStatus(agentId, blockId, {
        status: "response_fetched",
      });

      return {
        success: true,
        data: null, // Will contain actual results when implemented
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}

// Export convenience functions for backward compatibility
export const startOpenAIResearch = OpenAIResearchHandler.startResearch;
export const loadOpenAIStatus = OpenAIResearchHandler.loadStatus;
export const updateOpenAIStatus = OpenAIResearchHandler.updateStatus;
export const isOpenAIResearchInProgress =
  OpenAIResearchHandler.isResearchInProgress;
