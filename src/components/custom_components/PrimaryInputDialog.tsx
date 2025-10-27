// src/components/custom_components/PrimaryInputDialog.tsx
import { useState, useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { SearchAgentPrimaryInput } from "./SearchAgentPrimaryInput";
import { WebAgentPrimaryInput } from "./WebAgentPrimaryInput";
import { AgentBlockPrimaryInput } from "./AgentBlockPrimaryInput";
import { DeepResearchAgentPrimaryInput } from "./DeepResearchAgentPrimaryInput";
import { JiraAgentPrimaryInput } from "./JiraAgentPrimaryInput";
import {
  Block,
  SearchAgentBlock,
  WebAgentBlock,
  AgentBlock,
  DeepResearchAgentBlock,
  JiraBlock,
} from "@/types/types";
import { useSourceStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import { useVariableStore } from "@/lib/variableStore";
// Add router to the imports
import { useRouter } from "next/router";
import { toast } from "sonner";
import { VariableInputDialog } from "./VariableInputDialog";

interface PrimaryInputDialogProps {
  blocks: Block[];
  onComplete: (updatedBlocks: Block[]) => void;
  onCancel: () => void;
  onRun: () => void;
  onExecuteBlock: (blockNumber: number) => Promise<void>;
}

export function PrimaryInputDialog({
  blocks,
  onComplete,
  onCancel,
  onRun,
  onExecuteBlock,
}: PrimaryInputDialogProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [updatedBlocks, setUpdatedBlocks] = useState<Block[]>(blocks);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const { saveAgent, updateBlockData, loadAgent, currentAgent } =
    useAgentStore();
  const router = useRouter();

  const isLastBlock = currentIndex === updatedBlocks.length - 1;

  useEffect(() => {
    const blocksWithResetSkip = blocks.map((block) => ({
      ...block,
      skip: false,
    }));
    setUpdatedBlocks(blocksWithResetSkip);
  }, [blocks]);

  // FIXED: Actually update the local state
  const handleUpdate = (blockIndex: number, blockData: Partial<Block>) => {
    console.log("🔍 PrimaryInputDialog handleUpdate called:", {
      blockIndex,
      blockData,
      blockType: blockData.type || updatedBlocks[blockIndex]?.type,
      hasImages: !!(
        (blockData as any).images && (blockData as any).images.length > 0
      ),
      imagesLength: (blockData as any).images?.length || 0,
    });

    // Update the local state so the UI reflects changes immediately
    setUpdatedBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[blockIndex] = {
        ...newBlocks[blockIndex],
        ...blockData,
      } as Block;
      console.log("🔍 PrimaryInputDialog updated block:", {
        blockNumber: newBlocks[blockIndex].blockNumber,
        type: newBlocks[blockIndex].type,
        hasImages: !!(
          (newBlocks[blockIndex] as any).images &&
          (newBlocks[blockIndex] as any).images.length > 0
        ),
        imagesLength: (newBlocks[blockIndex] as any).images?.length || 0,
      });
      return newBlocks;
    });
  };

  const handleCopyBlock = async () => {
    setIsCopying(true);
    toast.info("Adding new block...");

    try {
      const { copyBlockAfter } = useAgentStore.getState();
      copyBlockAfter(updatedBlocks[currentIndex].blockNumber);

      // Get the updated agent from store
      const { currentAgent } = useAgentStore.getState();
      if (currentAgent) {
        const originalCount = updatedBlocks.length;
        const newCount = currentAgent.blocks.length;

        if (newCount > originalCount) {
          // Find the new block that was added
          const newBlock = currentAgent.blocks.find(
            (block) =>
              !updatedBlocks.some(
                (existingBlock) => existingBlock.id === block.id
              )
          );

          if (newBlock) {
            // Add the new block to local state while preserving existing changes
            setUpdatedBlocks((prev) => {
              const newBlocks = [...prev];
              // Insert the new block after the current block
              const insertIndex = currentIndex + 1;
              newBlocks.splice(insertIndex, 0, newBlock);
              return newBlocks;
            });

            // Automatically navigate to the new block
            setCurrentIndex(currentIndex + 1);

            toast.success("Block copied successfully!");
          } else {
            toast.error("Copy failed - new block not found");
          }
        } else {
          toast.error("Copy failed - no new block found");
        }
      }
      setIsCopying(false);
    } catch (error) {
      setIsCopying(false);
      toast.error("Failed to copy block");
    }
  };

  const jiraPrimaryInputRef = useRef<{
    saveSelectedTicketsToVariable: () => Promise<void>;
  }>(null);

  const handleConfirmAndRun = async () => {
    console.log("=== PrimaryInputDialog CONFIRMING ===");
    console.log("handleConfirmAndRun called");
    console.log(
      "Updated blocks to save:",
      updatedBlocks.map((b) => ({
        blockNumber: b.blockNumber,
        type: b.type,
        name: b.name,
        skip: b.skip,
        // query: b.query,
        // url: b.url,
      }))
    );

    setIsLoading(true);

    try {
      // Save selected tickets for Jira blocks before updating other blocks
      if (updatedBlocks[currentIndex].type === "jira") {
        console.log("Saving selected Jira tickets to variable...");
        if (jiraPrimaryInputRef.current?.saveSelectedTicketsToVariable) {
          await jiraPrimaryInputRef.current.saveSelectedTicketsToVariable();
          console.log("Jira tickets saved successfully");
        }
      }

      // First, update each block in the agent store
      updatedBlocks.forEach((block) => {
        console.log(
          `Updating block ${block.blockNumber} (${block.type}) in agent store`
        );
        updateBlockData(block.blockNumber, block);
      });

      // Get the updated agent after all block updates
      const { currentAgent: updatedAgent } = useAgentStore.getState();

      if (updatedAgent) {
        // Save the entire updated agent to Firebase
        await saveAgent(updatedAgent.blocks);
        console.log("Agent saved to Firebase successfully");

        // Reload the agent from scratch
        const { agentId } = router.query;
        if (agentId && typeof agentId === "string") {
          await loadAgent(agentId);
          console.log("Agent reloaded from scratch");
        }
      }

      // Add a 3-second delay to ensure Firebase updates are fully propagated
      console.log("Waiting 3 seconds for Firebase updates to propagate...");
      await new Promise((resolve) => setTimeout(resolve, 3000));
      console.log("Firebase update delay completed");

      // Execute each block that was configured in the primary input dialog
      console.log("=== EXECUTING PRIMARY INPUT BLOCKS ===");
      for (const block of updatedBlocks) {
        if (block.skip) {
          console.log(
            `⏭️ SKIPPING block ${block.blockNumber} (${block.type}) - skip flag is true`
          );
          continue;
        }

        console.log(
          `✅ EXECUTING primary input block ${block.blockNumber} (${block.type})`
        );

        try {
          console.log(`Processing primary input block ${block.blockNumber}...`);
          await onExecuteBlock(block.blockNumber);
          console.log(
            `Primary input block ${block.blockNumber} completed successfully`
          );
        } catch (error) {
          console.error(
            `❌ Error executing primary input block ${block.blockNumber}:`,
            error
          );
        }
      }
      console.log("=== PRIMARY INPUT BLOCKS EXECUTION COMPLETED ===");

      // Complete and close - let the parent handle running
      console.log("Calling onComplete with updated blocks");
      onComplete(updatedBlocks);
      console.log("Calling onCancel to close dialog");
      onCancel(); // Close dialog
    } catch (error) {
      console.error("Error saving agent:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog
      open={true}
      onOpenChange={(open) => {
        if (!open) {
          console.log("=== PrimaryInputDialog CLOSED ===");
          console.log("Dialog closed via onOpenChange");
          onCancel();
        }
      }}
    >
      <AlertDialogContent className="sm:max-w-[600px] max-h-[85vh] w-[95vw] sm:w-auto bg-black border border-gray-800 flex flex-col">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Configure Primary Inputs
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-4 sm:py-6 overflow-y-auto flex-1 min-h-0">
          {/* Block Name - moved here and styled */}
          <div className="mb-3 left-aligned">
            <h2 className="text-xl font-bold text-white">
              <span className="underline">
                {updatedBlocks[currentIndex].name ||
                  `Block ${currentIndex + 1}`}
              </span>
              {updatedBlocks[currentIndex].outputVariable && (
                <span className="text-gray-400 ml-2 font-normal no-underline">
                  (populates {updatedBlocks[currentIndex].outputVariable.name}{" "}
                  variable)
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              ({currentIndex + 1} of {updatedBlocks.length})
            </p>
          </div>

          {updatedBlocks[currentIndex].type === "searchagent" ? (
            <SearchAgentPrimaryInput
              block={updatedBlocks[currentIndex] as SearchAgentBlock}
              onUpdate={(blockData) => handleUpdate(currentIndex, blockData)}
            />
          ) : updatedBlocks[currentIndex].type === "webagent" ? (
            <WebAgentPrimaryInput
              block={updatedBlocks[currentIndex] as WebAgentBlock}
              onUpdate={(blockData) => handleUpdate(currentIndex, blockData)}
            />
          ) : updatedBlocks[currentIndex].type === "agent" ? (
            <AgentBlockPrimaryInput
              block={updatedBlocks[currentIndex] as AgentBlock}
              onUpdate={(blockData) => handleUpdate(currentIndex, blockData)}
              onRunBlock={onExecuteBlock}
            />
          ) : updatedBlocks[currentIndex].type === "deepresearchagent" ? (
            <DeepResearchAgentPrimaryInput
              block={updatedBlocks[currentIndex] as DeepResearchAgentBlock}
              onUpdate={(blockData) => handleUpdate(currentIndex, blockData)}
            />
          ) : updatedBlocks[currentIndex].type === "jira" ? (
            <JiraAgentPrimaryInput
              ref={jiraPrimaryInputRef}
              block={updatedBlocks[currentIndex] as JiraBlock}
              onUpdate={(blockData) => handleUpdate(currentIndex, blockData)}
            />
          ) : null}
        </div>

        <AlertDialogFooter className="flex justify-between gap-2 py-3 sm:py-4 flex-shrink-0">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => {
                console.log("=== PrimaryInputDialog CANCELLED ===");
                console.log("User clicked Cancel button");
                onCancel();
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentIndex((i) => i - 1)}
              disabled={currentIndex === 0 || isLoading}
            >
              Previous
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleCopyBlock}
              disabled={isCopying || isLoading}
            >
              {isCopying ? "Copying..." : "Add another block like this"}
            </Button>

            {isLastBlock ? (
              <Button onClick={handleConfirmAndRun} disabled={isLoading}>
                {isLoading ? "Loading..." : "Confirm & Run"}
              </Button>
            ) : (
              <Button
                onClick={() => {
                  console.log(
                    "Moving to next block. Current block updates:",
                    updatedBlocks[currentIndex]
                  );
                  setCurrentIndex((i) => i + 1);
                }}
                disabled={isLoading}
              >
                Next
              </Button>
            )}
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
