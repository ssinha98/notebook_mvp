import React, { useState } from "react";
import { Block } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Play, Eye, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import AgentBlock from "./AgentBlock";
import WebAgent from "./WebAgent";
import SearchAgent from "./SearchAgent";
import DeepResearchAgent from "./DeepResearchAgent";
import CodeBlock from "./CodeBlock";
import ApolloAgent from "./ApolloAgent";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { toast } from "sonner";

interface EditorBlockProps {
  block: Block;
  hasSelection: boolean;
  rowCount?: number;
  onRun: (block: Block, mode: "selection" | "column") => void;
  onOpen: (block: Block) => void;
  isLoading?: boolean; // Add loading state prop
}

const EditorBlock: React.FC<EditorBlockProps> = ({
  block,
  hasSelection,
  rowCount = 0,
  onRun,
  onOpen,
  isLoading = false, // Add loading state prop
}) => {
  const [runState, setRunState] = useState<
    "initial" | "confirm" | "selection-choice"
  >("initial");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [dialogRunMode, setDialogRunMode] = useState<
    "selection" | "column" | null
  >(null);

  // Get necessary stores and functions
  const { variables } = useVariableStore();
  const { updateBlockData, saveAgent } = useAgentStore();

  const getBlockTypeDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      agent: "Agent",
      searchagent: "Search",
      webagent: "Web Scraper",
      codeblock: "Code",
      excelagent: "Excel",
      instagramagent: "Instagram",
      deepresearchagent: "Deep Research",
      pipedriveagent: "Pipedrive",
      datavizagent: "Data Viz",
      clickupagent: "ClickUp",
      googledriveagent: "Google Drive",
      apolloagent: "Apollo",
      make: "Make",
      contact: "Contact",
      checkin: "Check-in",
      transform: "Transform",
    };
    return typeMap[type] || type;
  };

  const handleRunClick = () => {
    if (hasSelection) {
      setRunState("selection-choice");
    } else if (rowCount > 0) {
      setRunState("confirm");
    } else {
      // No selection and no rows, run directly
      onRun(block, "column");
    }
  };

  const handleConfirmRun = () => {
    onRun(block, "column");
    setRunState("initial");
  };

  const handleRunOnSelection = () => {
    onRun(block, "selection");
    setRunState("initial");
  };

  const handleRunOnColumn = () => {
    onRun(block, "column");
    setRunState("initial");
  };

  const handleCancel = () => {
    setRunState("initial");
  };

  const handleViewClick = () => {
    setIsViewDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsViewDialogOpen(false);
    setDialogRunMode(null);
  };

  const handleDialogRun = async () => {
    try {
      // Determine the run mode based on selection and user choice
      let runMode: "selection" | "column";

      if (hasSelection && dialogRunMode === null) {
        // If there's a selection but no mode chosen yet, default to selection
        runMode = "selection";
      } else if (dialogRunMode) {
        // Use the explicitly chosen mode
        runMode = dialogRunMode;
      } else {
        // Default to column if no selection
        runMode = "column";
      }

      setIsViewDialogOpen(false);
      setDialogRunMode(null); // Reset for next time
      onRun(block, runMode);
      toast.success("Block configuration saved and running!");
    } catch (error) {
      console.error("Error running block:", error);
      toast.error("Failed to run block");
    }
  };

  const handleDialogRunOnSelection = () => {
    setDialogRunMode("selection");
  };

  const handleDialogRunOnColumn = () => {
    setDialogRunMode("column");
  };

  // Mock functions for block components (they won't actually be used in the dialog)
  const mockOnDeleteBlock = () => {};
  const mockOnCopyBlock = () => {};
  const mockOnUpdateBlock = (blockNumber: number, updates: any) => {
    // Update the block in the store
    updateBlockData(blockNumber, updates);
  };
  const mockOnAddVariable = () => {};
  const mockOnOpenTools = () => {};
  const mockOnProcessingChange = () => {};
  const mockOnSavePrompts = (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string,
    saveAsCsv: boolean,
    sourceInfo?: any,
    outputVariable?: any,
    containsPrimaryInput?: boolean,
    skip?: boolean
  ) => {
    updateBlockData(blockNumber, {
      systemPrompt,
      userPrompt,
      saveAsCsv,
      sourceInfo,
      outputVariable,
      containsPrimaryInput,
      skip,
    });
  };

  // Add effect to reset runState when clicking outside or pressing escape
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the block component
      const blockElement = event.target as Element;
      if (!blockElement.closest(".editor-block")) {
        setRunState("initial");
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setRunState("initial");
      }
    };

    // Only add listeners when not in initial state
    if (runState !== "initial") {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [runState]);

  const renderBlockComponent = () => {
    switch (block.type) {
      case "agent":
        return (
          <AgentBlock
            blockNumber={block.blockNumber}
            variables={Object.values(variables)}
            onAddVariable={mockOnAddVariable}
            onOpenTools={mockOnOpenTools}
            onSavePrompts={mockOnSavePrompts}
            isProcessing={false}
            onProcessingChange={mockOnProcessingChange}
            onDeleteBlock={mockOnDeleteBlock}
            onCopyBlock={mockOnCopyBlock}
            initialSystemPrompt={block.systemPrompt}
            initialUserPrompt={block.userPrompt}
            initialSaveAsCsv={block.saveAsCsv}
            initialSource={block.sourceInfo}
            initialOutputVariable={block.outputVariable}
            skip={block.skip}
          />
        );

      case "webagent":
        return (
          <WebAgent
            blockNumber={block.blockNumber}
            onDeleteBlock={mockOnDeleteBlock}
            onCopyBlock={mockOnCopyBlock}
            onUpdateBlock={mockOnUpdateBlock}
            onAddVariable={mockOnAddVariable}
            initialUrl={block.url}
            initialPrompt={block.prompt}
            initialSelectedVariableId={block.outputVariable?.id}
            initialOutputVariable={block.outputVariable}
            containsPrimaryInput={block.containsPrimaryInput}
            skip={block.skip}
            onOpenTools={mockOnOpenTools}
          />
        );

      case "searchagent":
        return (
          <SearchAgent
            blockNumber={block.blockNumber}
            variables={Object.values(variables)}
            onDeleteBlock={mockOnDeleteBlock}
            onCopyBlock={mockOnCopyBlock}
            onUpdateBlock={mockOnUpdateBlock}
            onAddVariable={mockOnAddVariable}
            onOpenTools={mockOnOpenTools}
            initialQuery={block.query}
            initialEngine={block.engine}
            initialLimit={block.limit}
            initialTopic={block.topic}
            initialSection={block.section}
            initialTimeWindow={block.timeWindow}
            initialTrend={block.trend}
            initialRegion={block.region}
            initialOutputVariable={block.outputVariable}
            initialPreviewMode={block.previewMode} // Add this line
            containsPrimaryInput={block.containsPrimaryInput}
            skip={block.skip}
            isProcessing={false}
            onProcessingChange={mockOnProcessingChange}
          />
        );

      case "deepresearchagent":
        return (
          <DeepResearchAgent
            blockNumber={block.blockNumber}
            onDeleteBlock={mockOnDeleteBlock}
            onCopyBlock={mockOnCopyBlock}
            onUpdateBlock={mockOnUpdateBlock}
            // onAddVariable={mockOnAddVariable}
            onOpenTools={mockOnOpenTools}
            initialTopic={block.topic}
            initialSearchEngine={block.searchEngine}
            initialOutputVariable={block.outputVariable}
            blockId={block.id}
            agentId={useAgentStore.getState().currentAgent?.id}
            containsPrimaryInput={block.containsPrimaryInput}
            skip={block.skip}
            isProcessing={false}
            // onProcessingChange={mockOnProcessingChange}
          />
        );

      case "codeblock":
        return (
          <CodeBlock
            blockNumber={block.blockNumber}
            onDeleteBlock={mockOnDeleteBlock}
            onCopyBlock={mockOnCopyBlock}
            onUpdateBlock={mockOnUpdateBlock}
            onAddVariable={mockOnAddVariable}
            onOpenTools={mockOnOpenTools}
            initialCode={block.code}
            initialLanguage={block.language}
            initialOutputVariable={block.outputVariable}
            // skip={block.skip}
            isProcessing={false}
            onProcessingChange={mockOnProcessingChange}
          />
        );

      case "apolloagent":
        return (
          <ApolloAgent
            blockNumber={block.blockNumber}
            onDeleteBlock={mockOnDeleteBlock}
            onCopyBlock={mockOnCopyBlock}
            onUpdateBlock={mockOnUpdateBlock}
            initialFullName={block.fullName}
            initialFirstName={block.firstName}
            initialLastName={block.lastName}
            initialCompany={block.company}
            initialPrompt={block.prompt}
            initialOutputVariable={block.outputVariable}
            isProcessing={false}
            selectedData={[]} // This would need to be passed from parent
            formData={null}
          />
        );

      default:
        return (
          <div className="text-gray-400 text-sm p-4">
            Configuration editing not available for this block type yet.
          </div>
        );
    }
  };

  return (
    <>
      <div className="p-3 bg-gray-800 rounded-lg border border-gray-600 editor-block">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-medium text-sm">
            {block.name || `Block ${block.blockNumber}`}
          </span>
          <span className="text-gray-400 text-xs bg-gray-700 px-2 py-1 rounded">
            {getBlockTypeDisplayName(block.type)}
          </span>
        </div>

        <div className="text-gray-400 text-xs mb-3">
          Block {block.blockNumber}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {runState === "initial" && (
            <>
              <Button
                size="sm"
                onClick={handleRunClick}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                {isLoading ? "Running..." : "Run"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleViewClick}
                disabled={isLoading}
                className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </>
          )}

          {runState === "confirm" && (
            <>
              <Button
                size="sm"
                onClick={handleConfirmRun}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                {isLoading ? "Running..." : `Run on ${rowCount} rows?`}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isLoading}
                className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </Button>
            </>
          )}

          {runState === "selection-choice" && (
            <>
              <Button
                size="sm"
                onClick={handleRunOnSelection}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                {isLoading ? "Running..." : "Run on Selection"}
              </Button>
              <Button
                size="sm"
                onClick={handleRunOnColumn}
                disabled={isLoading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Play className="h-3 w-3 mr-1" />
                )}
                {isLoading ? "Running..." : "Run on Column"}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Block Configuration Dialog */}
      <AlertDialog open={isViewDialogOpen} onOpenChange={handleDialogClose}>
        <AlertDialogContent className="max-w-4xl max-h-[80vh] bg-gray-900 border-gray-600 overflow-hidden">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {block.name || `Block ${block.blockNumber}`} Configuration
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Edit block parameters before running
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4 overflow-y-auto max-h-[60vh]">
            {renderBlockComponent()}
          </div>

          <AlertDialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-between">
            <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600">
              Close
            </AlertDialogCancel>

            {/* Selection-aware run buttons */}
            {hasSelection ? (
              <div className="flex gap-2">
                {dialogRunMode === null && (
                  <>
                    <Button
                      onClick={handleDialogRunOnSelection}
                      disabled={isLoading}
                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run on Selection
                    </Button>
                    <Button
                      onClick={handleDialogRunOnColumn}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Run on Column
                    </Button>
                  </>
                )}
                {dialogRunMode && (
                  <Button
                    onClick={handleDialogRun}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {isLoading
                      ? "Running..."
                      : `Run on ${dialogRunMode === "selection" ? "Selection" : "Column"}`}
                  </Button>
                )}
              </div>
            ) : (
              <Button
                onClick={handleDialogRun}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {isLoading ? "Running..." : "Run"}
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EditorBlock;
