// src/components/custom_components/PrimaryInputDialog.tsx
import { useState, useEffect } from "react";
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
import {
  Block,
  SearchAgentBlock,
  WebAgentBlock,
  AgentBlock,
  DeepResearchAgentBlock,
} from "@/types/types";
import { useSourceStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
// Add router to the imports
import { useRouter } from "next/router";
import { toast } from "sonner";

interface PrimaryInputDialogProps {
  blocks: Block[];
  onComplete: (updatedBlocks: Block[]) => void;
  onCancel: () => void;
  onRun: () => void;
}

export function PrimaryInputDialog({
  blocks,
  onComplete,
  onCancel,
  onRun,
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
    // console.log("handleUpdate", blockIndex, blockData);

    // Update the local state so the UI reflects changes immediately
    setUpdatedBlocks((prev) => {
      const newBlocks = [...prev];
      newBlocks[blockIndex] = {
        ...newBlocks[blockIndex],
        ...blockData,
      } as Block;
      return newBlocks;
    });
  };

  const handleCopyBlock = async () => {
    setIsCopying(true);
    toast.info("Refreshing to reflect the latest change...");

    try {
      const { copyBlockAfter } = useAgentStore.getState();
      copyBlockAfter(updatedBlocks[currentIndex].blockNumber);

      setTimeout(async () => {
        const { currentAgent } = useAgentStore.getState();
        if (currentAgent) {
          const originalCount = updatedBlocks.length;
          const newCount = currentAgent.blocks.length;

          if (newCount > originalCount) {
            setUpdatedBlocks(currentAgent.blocks);
            toast.success("Block copied successfully!");
          } else {
            toast.error("Copy failed - no new block found");
          }
        }
        setIsCopying(false);
      }, 2000);
    } catch (error) {
      setIsCopying(false);
      toast.error("Failed to copy block");
    }
  };

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
      <AlertDialogContent className="sm:max-w-[600px] bg-black border border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Configure Primary Inputs
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="py-6">
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
            />
          ) : updatedBlocks[currentIndex].type === "deepresearchagent" ? (
            <DeepResearchAgentPrimaryInput
              block={updatedBlocks[currentIndex] as DeepResearchAgentBlock}
              onUpdate={(blockData) => handleUpdate(currentIndex, blockData)}
            />
          ) : null}
        </div>

        <AlertDialogFooter className="flex justify-between gap-2">
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
