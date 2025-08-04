import React, { forwardRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FiSettings, FiInfo } from "react-icons/fi";
import { DeepResearchAgentBlock, TableVariable } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { api } from "@/tools/api";
import ReactMarkdown from "react-markdown";
import VariableDropdown from "./VariableDropdown";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  OpenAIResearchHandler,
  OpenAIResearchStatus,
  OpenAIStatusData,
} from "@/tools/openaiResearch";
import {
  PerplexityResearchHandler,
  PerplexityStatusData,
} from "@/tools/perplexityResearch";
import { auth } from "@/tools/firebase";
import { useDeepResearchStream } from "@/hooks/useDeepResearchStream";
import { IoExpandSharp } from "react-icons/io5";
import ResearchResultsSection from "./ResearchResultsSection";
import CustomEditor from "@/components/CustomEditor";

interface SearchResult {
  date?: string | null;
  title: string;
  url: string;
  description?: string;
}

export interface ResearchResponse {
  message: string;
  search_results: SearchResult[];
}

interface DeepResearchAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void;
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<DeepResearchAgentBlock>
  ) => void;
  initialTopic?: string;
  isProcessing?: boolean;
  onOpenTools?: () => void;
  initialSearchEngine?:
    | "perplexity"
    | "firecrawl"
    | "openai"
    | "perplexity sonar-deep-research";
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string;
  } | null;
  blockId?: string;
  agentId?: string;
}

interface DeepResearchAgentRef {
  processBlock: () => Promise<boolean>;
}

// Add debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const DeepResearchAgent = forwardRef<
  DeepResearchAgentRef,
  DeepResearchAgentProps
>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onCopyBlock,
      onUpdateBlock,
      initialTopic = "",
      isProcessing = false,
      onOpenTools,
      initialSearchEngine = "firecrawl",
      initialOutputVariable = null,
      blockId,
      agentId,
    },
    ref
  ) => {
    const [topic, setTopic] = useState(initialTopic);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [researchResults, setResearchResults] =
      useState<ResearchResponse | null>(null);
    const [selectedVariableId, setSelectedVariableId] = useState<string>(() => {
      // Initialize with table column format if needed
      if (
        initialOutputVariable?.type === "table" &&
        initialOutputVariable.columnName
      ) {
        return `${initialOutputVariable.id}:${initialOutputVariable.columnName}`;
      }
      return initialOutputVariable?.id || "";
    });
    const [searchEngine, setSearchEngine] = useState<
      "perplexity" | "firecrawl" | "openai" | "perplexity sonar-deep-research"
    >(initialSearchEngine || "firecrawl");

    // Add these state variables after the existing state
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [hasSaved, setHasSaved] = useState(false);

    // Add OpenAI status state
    const [openAIStatus, setOpenAIStatus] = useState<OpenAIStatusData>({
      status: "idle",
      requestId: "",
      threadId: "",
      error: "",
    });

    // Add perplexityStatus state after openAIStatus
    const [perplexityStatus, setPerplexityStatus] =
      useState<PerplexityStatusData>({
        status: "idle",
        error: "",
      });

    // Add perplexityPollInterval state
    const [perplexityPollInterval, setPerplexityPollInterval] =
      useState<NodeJS.Timeout | null>(null);

    // Debounce the topic to avoid excessive updates
    const debouncedTopic = useDebounce(topic, 500);

    const variables = useVariableStore((state) => state.variables);
    const currentAgent = useAgentStore((state) => state.currentAgent);

    // Add store hook for updating block names
    const { updateBlockName } = useSourceStore();

    // Get current block to display its name
    const currentBlock = useSourceStore((state) =>
      state.blocks.find((block) => block.blockNumber === blockNumber)
    );

    // Debounced update function
    const debouncedUpdateBlock = React.useCallback(
      (updates: Partial<DeepResearchAgentBlock>) => {
        onUpdateBlock(blockNumber, updates);
      },
      [onUpdateBlock, blockNumber]
    );

    // Save topic only when user stops typing
    React.useEffect(() => {
      if (debouncedTopic !== initialTopic) {
        debouncedUpdateBlock({ topic: debouncedTopic });
      }
    }, [debouncedTopic, initialTopic, debouncedUpdateBlock]);

    // Save search engine when it changes (immediate since it's not a keystroke event)
    React.useEffect(() => {
      if (searchEngine !== initialSearchEngine) {
        debouncedUpdateBlock({ searchEngine });
      }
    }, [searchEngine, initialSearchEngine, debouncedUpdateBlock]);

    // Load OpenAI status from Firebase on component mount
    useEffect(() => {
      const loadOpenAIStatus = async () => {
        if (!blockId || !currentAgent?.id || searchEngine !== "openai") return;

        try {
          const statusData = await OpenAIResearchHandler.loadStatus(
            currentAgent.id,
            blockId
          );
          if (statusData) {
            setOpenAIStatus(statusData);
          }
        } catch (error) {
          console.error("Error loading OpenAI status:", error);
        }
      };

      loadOpenAIStatus();
    }, [blockId, currentAgent?.id, searchEngine]);

    // Update the useEffect for Perplexity status polling
    useEffect(() => {
      const pollPerplexityStatus = async () => {
        if (!blockId || !currentAgent?.id) return;

        const result = await PerplexityResearchHandler.checkStatus(
          currentAgent.id,
          blockId
        );

        if (result.success && result.status === "complete") {
          // Stop polling
          if (perplexityPollInterval) {
            clearInterval(perplexityPollInterval);
            setPerplexityPollInterval(null);
          }

          // Load the final status with results
          const finalStatus = await PerplexityResearchHandler.loadStatus(
            currentAgent.id,
            blockId
          );
          if (finalStatus) {
            setPerplexityStatus(finalStatus);
            toast.success("Research completed!");
          }
        } else if (!result.success) {
          // Handle error
          setPerplexityStatus((prev) => ({
            ...prev,
            status: "error",
            error: result.error,
          }));
          if (perplexityPollInterval) {
            clearInterval(perplexityPollInterval);
            setPerplexityPollInterval(null);
          }
          toast.error(result.error || "Failed to check research status");
        }
      };

      return () => {
        if (perplexityPollInterval) {
          clearInterval(perplexityPollInterval);
        }
      };
    }, [blockId, currentAgent?.id, perplexityPollInterval]);

    // Add useEffect for initial status loading
    useEffect(() => {
      const loadInitialStatus = async () => {
        if (!blockId || !currentAgent?.id) return;

        try {
          // Load status from Firebase
          const statusData = await PerplexityResearchHandler.loadStatus(
            currentAgent.id,
            blockId
          );

          if (statusData) {
            setPerplexityStatus(statusData);

            // If status is complete, show results immediately
            if (statusData.status === "complete") {
            }
          }
        } catch (error) {
          console.error("Error loading initial Perplexity status:", error);
        }
      };

      loadInitialStatus();
    }, [blockId, currentAgent?.id]); // Run on mount and when blockId/agentId changes

    // Load initial Perplexity status
    useEffect(() => {
      const loadPerplexityStatus = async () => {
        if (
          !blockId ||
          !currentAgent?.id ||
          searchEngine !== "perplexity sonar-deep-research"
        )
          return;

        try {
          const statusData = await PerplexityResearchHandler.loadStatus(
            currentAgent.id,
            blockId
          );
          if (statusData) {
            setPerplexityStatus(statusData);
          }
        } catch (error) {
          console.error("Error loading Perplexity status:", error);
        }
      };

      loadPerplexityStatus();
    }, [blockId, currentAgent?.id, searchEngine]);

    const handleVariableSelect = (value: string) => {
      if (value === "add_new" && onOpenTools) {
        onOpenTools();
      } else {
        setSelectedVariableId(value);

        // Find the selected variable and format it properly
        let selectedVariable;
        let outputVariable;

        if (value.includes(":")) {
          // Table variable with column name
          const [tableId, columnName] = value.split(":");
          selectedVariable = Object.values(variables).find(
            (v) => v.id === tableId
          );

          if (selectedVariable) {
            outputVariable = {
              id: selectedVariable.id,
              name: `${selectedVariable.name}.${columnName}`,
              type: "table" as const,
              columnName: columnName,
            };
          }
        } else {
          // Regular variable
          selectedVariable = Object.values(variables).find(
            (v) => v.id === value
          );

          if (selectedVariable) {
            outputVariable = {
              id: selectedVariable.id,
              name: selectedVariable.name,
              type: selectedVariable.type as "input" | "intermediate" | "table",
            };
          }
        }

        // Update the block with the output variable using debounced function
        debouncedUpdateBlock({
          outputVariable: outputVariable || null,
        });

        // If we have results and selected items, save them to the newly selected variable
        if (getResultsArray().length > 0 && selectedItems.size > 0) {
          handleSaveToVariable(value);
        }
      }
    };

    // Add selection handlers
    const handleItemSelect = (itemId: string, isSelected: boolean) => {
      setSelectedItems((prev) => {
        const newSet = new Set(prev);
        if (isSelected) {
          newSet.add(itemId);
        } else {
          newSet.delete(itemId);
        }
        return newSet;
      });
    };

    const handleSelectAll = () => {
      const results = getResultsArray();
      if (results) {
        const allUrls = new Set(results.map((result) => result.url));
        setSelectedItems(allUrls);
      }
    };

    const handleClearAll = () => {
      setSelectedItems(new Set());
    };

    // Add save handler
    const handleSaveToVariable = async (variableId: string) => {
      if (selectedItems.size === 0) {
        toast.error("No items selected. Please select items to save.");
        return;
      }

      setIsSaving(true);
      try {
        const selectedItemsArray = Array.from(selectedItems);

        if (variableId.includes(":")) {
          // Table variable - save as rows
          const [tableId, columnName] = variableId.split(":");
          for (const url of selectedItemsArray) {
            await useVariableStore.getState().addTableRow(tableId, {
              [columnName]: url,
            });
          }
        } else {
          // Regular variable - save as comma-separated list
          const value = selectedItemsArray.join(", ");
          await useVariableStore.getState().updateVariable(variableId, value);
        }

        setHasSaved(true);
        toast.success(
          `${selectedItems.size} selected results saved to variable!`,
          {
            duration: 10000, // 10 seconds
            action: {
              label: "Dismiss",
              onClick: () => toast.dismiss(),
            },
          }
        );
      } catch (error) {
        console.error("Error saving to variable:", error);
        toast.error("Failed to save results to variable");
      } finally {
        setIsSaving(false);
      }
    };

    // Update selection when initialOutputVariable changes
    React.useEffect(() => {
      if (initialOutputVariable?.id) {
        // If it's a table variable with column name, construct the proper value
        if (
          initialOutputVariable.type === "table" &&
          initialOutputVariable.columnName
        ) {
          setSelectedVariableId(
            `${initialOutputVariable.id}:${initialOutputVariable.columnName}`
          );
        } else {
          setSelectedVariableId(initialOutputVariable.id);
        }
      }
    }, [initialOutputVariable]);

    // Add useEffect to reset selected items when new results come in
    React.useEffect(() => {
      if (researchResults) {
        setSelectedItems(new Set());
        setHasSaved(false);
      }
    }, [researchResults]);

    // Update the processBlock function to handle Perplexity
    const processBlock = async () => {
      try {
        setError("");
        setResearchResults(null);
        setIsLoading(true);

        if (!topic.trim()) {
          setError("Please enter a research topic");
          return false;
        }

        if (searchEngine === "perplexity sonar-deep-research") {
          // Clear any existing interval first
          if (perplexityPollInterval) {
            clearInterval(perplexityPollInterval);
            setPerplexityPollInterval(null);
          }

          if (!blockId || !currentAgent?.id) {
            setError(
              "Block ID and Agent ID are required for Perplexity research"
            );
            return false;
          }

          const result = await PerplexityResearchHandler.startResearch({
            query: topic,
            blockId: blockId,
            agentId: currentAgent.id,
          });

          if (result.success) {
            // Start polling
            const interval = setInterval(async () => {
              const statusResult = await PerplexityResearchHandler.checkStatus(
                currentAgent.id,
                blockId
              );

              if (statusResult.success) {
                if (statusResult.status === "complete") {
                  // Clear interval when complete
                  clearInterval(interval);
                  setPerplexityPollInterval(null);

                  const finalStatus =
                    await PerplexityResearchHandler.loadStatus(
                      currentAgent.id,
                      blockId
                    );
                  if (finalStatus) {
                    setPerplexityStatus(finalStatus);
                    toast.success("Research completed!");
                  }
                } else if (statusResult.status === "error") {
                  // Clear interval on error
                  clearInterval(interval);
                  setPerplexityPollInterval(null);
                  setError(
                    statusResult.error || "An error occurred during research"
                  );
                }
              } else {
                // Clear interval on error
                clearInterval(interval);
                setPerplexityPollInterval(null);
                setError(
                  statusResult.error || "Failed to check research status"
                );
              }
            }, 15000);

            setPerplexityPollInterval(interval);
            return true;
          } else {
            setError(result.error || "Failed to start research");
            return false;
          }
        } else if (searchEngine === "openai") {
          // Handle OpenAI flow using the utility
          if (!blockId || !currentAgent?.id) {
            setError("Block ID and Agent ID are required for OpenAI research");
            return false;
          }

          const result = await OpenAIResearchHandler.startResearch({
            prompt: topic,
            blockId: blockId,
            agentId: currentAgent.id,
          });

          if (result.success && result.data) {
            // Update local state
            setOpenAIStatus({
              status: "called",
              requestId: result.data.requestId,
              threadId: result.data.threadId,
              error: "",
            });
            return true;
          } else {
            setError(result.error || "Failed to start OpenAI research");
            return false;
          }
        } else {
          // Handle existing Perplexity/Firecrawl flow
          const response = await api.post("/deepresearch", {
            prompt: topic.trim(),
            search_engine: searchEngine,
          });

          if (
            response &&
            response.message !== undefined &&
            Array.isArray(response.search_results)
          ) {
            const formattedResponse = {
              message: String(response.message),
              search_results: response.search_results,
            };
            setResearchResults(formattedResponse);
            return true;
          } else {
            throw new Error("Unexpected response format from server");
          }
        }
      } catch (err: any) {
        console.error("Error processing research:", err);
        setError(
          err.message || "An error occurred while processing the research"
        );
        // Clear interval on error
        if (perplexityPollInterval) {
          clearInterval(perplexityPollInterval);
          setPerplexityPollInterval(null);
        }
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    React.useImperativeHandle(ref, () => ({
      processBlock,
    }));

    // Add cleanup effect
    useEffect(() => {
      return () => {
        if (perplexityPollInterval) {
          clearInterval(perplexityPollInterval);
        }
      };
    }, [perplexityPollInterval]);

    // Use agentId from props if provided, otherwise from store
    const effectiveAgentId = agentId || currentAgent?.id;

    // --- OpenAI Deep Research Streaming ---
    const userId = auth.currentUser?.uid;
    const isOpenAI =
      searchEngine === "openai" && blockId && userId && effectiveAgentId;
    const {
      status: streamStatus,
      value: streamValue,
      resultUrls: streamResultUrls,
      loading: streamLoading,
      error: streamError,
      finalize,
    } = useDeepResearchStream(
      isOpenAI ? userId : undefined,
      isOpenAI ? blockId : undefined
    );

    // Update the getResultsArray helper to include Perplexity results
    const getResultsArray = () => {
      if (
        searchEngine === "perplexity sonar-deep-research" &&
        perplexityStatus.status === "complete"
      ) {
        // Map citations to SearchResult format
        const citations = perplexityStatus.citations || [];
        return citations.map((citation: any) => ({
          title: citation.title || citation.url,
          url: citation.url,
          date: null,
          description: undefined,
        }));
      } else if (
        isOpenAI &&
        streamStatus === "complete" &&
        streamValue &&
        streamResultUrls
      ) {
        return streamResultUrls.map((url) => ({ url, title: url }));
      } else if (!isOpenAI && researchResults?.search_results) {
        return researchResults.search_results;
      }
      return [];
    };

    // Update the getSummary helper to include Perplexity results
    const getSummary = () => {
      if (
        searchEngine === "perplexity sonar-deep-research" &&
        perplexityStatus.status === "complete"
      ) {
        return perplexityStatus.summary || "";
      } else if (isOpenAI && streamStatus === "complete" && streamValue) {
        return streamValue;
      } else if (!isOpenAI && researchResults?.message) {
        return researchResults.message;
      }
      return "";
    };

    // Add refs to track state
    const hasAutoSavedRef = React.useRef(false);
    const wasPreSelectedRef = React.useRef(!!initialOutputVariable);
    const previousResultsRef = React.useRef<string>("");

    // Auto-save results to pre-selected variable
    React.useEffect(() => {
      const results = getResultsArray();
      const currentResultsKey = JSON.stringify(results);

      // Only auto-save if:
      // 1. We have new results
      // 2. A variable was pre-selected
      // 3. Results are different from previous
      if (
        results.length > 0 &&
        selectedVariableId &&
        currentResultsKey !== previousResultsRef.current
      ) {
        // Store current results for comparison
        previousResultsRef.current = currentResultsKey;

        // Auto-select all URLs and save them
        const allUrls = new Set(results.map((result) => result.url));
        setSelectedItems(allUrls);

        // Save to variable
        const saveToVariable = async () => {
          try {
            setIsSaving(true);
            const selectedItemsArray = Array.from(allUrls);

            if (selectedVariableId.includes(":")) {
              // Table variable - save as rows
              const [tableId, columnName] = selectedVariableId.split(":");
              for (const url of selectedItemsArray) {
                await useVariableStore.getState().addTableRow(tableId, {
                  [columnName]: url,
                });
              }
            } else {
              // Regular variable - save as comma-separated list
              const value = selectedItemsArray.join(", ");
              await useVariableStore
                .getState()
                .updateVariable(selectedVariableId, value);
            }

            setHasSaved(true);
            toast.success(
              `${allUrls.size} results automatically saved to variable!`
            );
          } catch (error) {
            console.error("Error auto-saving to variable:", error);
            toast.error("Failed to auto-save results to variable");
          } finally {
            setIsSaving(false);
          }
        };

        saveToVariable();
      }
    }, [
      researchResults,
      streamStatus,
      streamValue,
      streamResultUrls,
      selectedVariableId,
      perplexityStatus,
      searchEngine,
    ]);

    // Reset the previous results when new research is started
    React.useEffect(() => {
      if (isLoading) {
        previousResultsRef.current = "";
        setHasSaved(false);
      }
    }, [isLoading]);

    // Update the showResultsSection condition to include Perplexity
    const showResultsSection =
      (searchEngine === "perplexity sonar-deep-research" &&
        perplexityStatus.status === "complete" &&
        (perplexityStatus.value ||
          (perplexityStatus.citations || []).length > 0)) ||
      (isOpenAI &&
        streamStatus === "complete" &&
        streamValue &&
        streamResultUrls) ||
      (!isOpenAI && researchResults && researchResults.search_results);

    const disabled =
      isLoading ||
      isProcessing ||
      (searchEngine === "openai" && streamStatus === "called") ||
      (searchEngine === "perplexity sonar-deep-research" &&
        (perplexityStatus.status === "waiting" ||
          perplexityStatus.status === "processing"));

    return (
      <div className="bg-[#141414] rounded-lg border border-white">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img
              src="https://registry.npmmirror.com/@lobehub/icons-static-png/1.49.0/files/dark/perplexity-color.png"
              alt="Perplexity"
              className="w-8 h-8 rounded"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-100">
                  Deep Research Agent {blockNumber}
                </h3>
                <BlockNameEditor
                  blockName={
                    currentBlock?.name || `Deep Research Agent ${blockNumber}`
                  }
                  blockNumber={blockNumber}
                  onNameUpdate={updateBlockName}
                />
              </div>
              <Badge
                variant="secondary"
                className="text-xs bg-blue-600 text-white"
              >
                beta
              </Badge>
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-100"
                >
                  <FiInfo className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-100">
                    Deep Research Agent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This agent performs in-depth research on a given topic,
                    analyzing multiple sources and providing comprehensive
                    insights.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-gray-100 hover:bg-gray-700 border-gray-700">
                    Close
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
                <FiSettings className="h-4 w-4" />
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={() => onDeleteBlock(blockNumber)}
              >
                Delete Block
              </button>
              <button
                className="w-full px-4 py-2 text-blue-500 hover:bg-blue-950 text-left transition-colors"
                onClick={() => {
                  onCopyBlock?.(blockNumber);
                  toast.success("Block copied!");
                }}
              >
                Copy Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Research Topic
            </label>
            <CustomEditor
              value={topic}
              onChange={setTopic}
              placeholder="Enter the topic you want the agent to research"
              className=""
              disabled={false}
              showListButtons={true}
            />
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <span>Deep Research Engine:</span>
            <Select
              value={searchEngine}
              onValueChange={(
                value:
                  | "perplexity"
                  | "firecrawl"
                  | "openai"
                  | "perplexity sonar-deep-research"
              ) => setSearchEngine(value)}
            >
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700 text-white">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {searchEngine === "perplexity" && (
                      <img
                        src="/perplexity_logo.png"
                        alt="Perplexity"
                        className="w-4 h-4"
                      />
                    )}
                    {searchEngine === "perplexity sonar-deep-research" && (
                      <img
                        src="/perplexity_logo2.png"
                        alt="Perplexity Sonar"
                        className="w-4 h-4"
                      />
                    )}
                    {searchEngine === "openai" && (
                      <img src="/openai.png" alt="OpenAI" className="w-4 h-4" />
                    )}
                    {searchEngine === "firecrawl" && <span>🔥</span>}
                    <span>{searchEngine}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem
                  value="perplexity sonar-deep-research"
                  className="text-white"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src="/perplexity_logo2.png"
                      alt="Perplexity Sonar"
                      className="w-4 h-4"
                    />
                    <span>Perplexity - Sonar Deep Research</span>
                  </div>
                </SelectItem>
                <SelectItem value="firecrawl" className="text-white">
                  <div className="flex items-center gap-2">
                    <span>🔥</span>
                    <span>Firecrawl</span>
                  </div>
                </SelectItem>
                <SelectItem value="openai" className="text-white">
                  <div className="flex items-center gap-2">
                    <img src="/openai.png" alt="OpenAI" className="w-4 h-4" />
                    <span>OpenAI</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
              onAddNew={onOpenTools}
              onSave={handleSaveToVariable}
              isSaving={isSaving}
              hasSaved={hasSaved}
              isSearchAgent={true}
            />
          </div>

          {/* Status Section */}
          {searchEngine === "perplexity sonar-deep-research" && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={PerplexityResearchHandler.getStatusBadgeVariant(
                        perplexityStatus.status
                      )}
                      className="text-xs"
                    >
                      {perplexityStatus.status}
                    </Badge>
                    <span className="text-sm text-gray-300">
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin">⟳</span>
                          Loading...
                        </span>
                      ) : (
                        PerplexityResearchHandler.getStatusMessage(
                          perplexityStatus.status
                        )
                      )}
                    </span>
                  </div>
                </div>
                {perplexityStatus.error && (
                  <div className="mt-2 text-sm text-red-400">
                    {perplexityStatus.error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OpenAI Status Section */}
          {isOpenAI && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={OpenAIResearchHandler.getStatusBadgeVariant(
                      streamStatus ?? "idle"
                    )}
                    className="text-xs"
                  >
                    {streamStatus || "idle"}
                  </Badge>
                  <span className="text-sm text-gray-300">
                    {streamLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Loading...
                      </span>
                    ) : (
                      OpenAIResearchHandler.getStatusMessage(
                        streamStatus ?? "idle"
                      )
                    )}
                  </span>
                </div>
                {streamError && (
                  <div className="mt-2 text-sm text-red-400">{streamError}</div>
                )}
                {streamStatus === "complete" && !streamValue && (
                  <Button
                    onClick={finalize}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={streamLoading}
                  >
                    {streamLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin">⟳</span>
                        Fetching Results...
                      </span>
                    ) : (
                      "Get Results"
                    )}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Results Section (shared for all agents) */}
          {showResultsSection && (
            <ResearchResultsSection
              summary={getSummary()}
              results={getResultsArray()}
              selectedItems={selectedItems}
              onItemSelect={handleItemSelect}
              onSelectAll={handleSelectAll}
              onClearAll={handleClearAll}
              loading={isLoading}
              hideExpandIcon={false}
            />
          )}
        </div>

        <div className="flex justify-start gap-2 p-4 border-t border-gray-700">
          <Button
            onClick={processBlock}
            disabled={
              isLoading ||
              isProcessing ||
              (searchEngine === "openai" && streamStatus === "called") ||
              (searchEngine === "perplexity sonar-deep-research" &&
                (perplexityStatus.status === "waiting" ||
                  perplexityStatus.status === "processing"))
            }
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {searchEngine === "openai"
                  ? "Starting Research..."
                  : "Researching..."}
              </>
            ) : (
              "Run Research"
            )}
          </Button>
        </div>
      </div>
    );
  }
);

DeepResearchAgent.displayName = "DeepResearchAgent";

export default DeepResearchAgent;
