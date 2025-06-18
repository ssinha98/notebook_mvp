import React, { forwardRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FiSettings, FiInfo } from "react-icons/fi";
import { DeepResearchAgentBlock } from "@/types/types";
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

interface SearchResult {
  date: string | null;
  title: string;
  url: string;
}

export interface ResearchResponse {
  message: string;
  search_results: SearchResult[];
}

interface DeepResearchAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<DeepResearchAgentBlock>
  ) => void;
  initialTopic?: string;
  isProcessing?: boolean;
}

interface DeepResearchAgentRef {
  processBlock: () => Promise<boolean>;
}

const DeepResearchAgent = forwardRef<
  DeepResearchAgentRef,
  DeepResearchAgentProps
>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onUpdateBlock,
      initialTopic = "",
      isProcessing = false,
    },
    ref
  ) => {
    const [topic, setTopic] = useState(initialTopic);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [researchResults, setResearchResults] =
      useState<ResearchResponse | null>(null);
    const [selectedVariableId, setSelectedVariableId] = useState<string>("");

    const variables = useVariableStore((state) => state.variables);
    const currentAgent = useAgentStore((state) => state.currentAgent);

    const handleVariableSelect = (value: string) => {
      setSelectedVariableId(value);
    };

    // Save topic with debounce
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (topic !== initialTopic) {
          onUpdateBlock(blockNumber, { topic });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [topic, blockNumber, onUpdateBlock, initialTopic]);

    const processBlock = async () => {
      try {
        setError("");
        setResearchResults(null);
        setIsLoading(true);

        if (!topic.trim()) {
          setError("Please enter a research topic");
          return false;
        }

        console.log("Sending request to /ask with prompt:", topic.trim());
        const response = await api.post("/ask", {
          prompt: topic.trim(),
        });

        console.log("Full API response:", response);

        if (
          response &&
          response.message &&
          Array.isArray(response.search_results)
        ) {
          setResearchResults(response);

          if (selectedVariableId) {
            const selectedVariable = Object.values(variables).find(
              (v) => v.id === selectedVariableId
            );
            if (selectedVariable) {
              await useVariableStore
                .getState()
                .updateVariable(selectedVariableId, response.message);
            }
          }

          return true;
        } else {
          console.error("Unexpected response structure:", response);
          throw new Error("Unexpected response format from server");
        }
      } catch (err: any) {
        console.error("Error processing research:", err);
        console.error("Full error object:", err);
        setError(
          err.message || "An error occurred while processing the research"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    React.useImperativeHandle(ref, () => ({
      processBlock,
    }));

    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔍</span>
            <h3 className="text-lg font-semibold text-gray-100">
              Deep Research Agent {blockNumber}
            </h3>
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
            <PopoverTrigger>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-100"
              >
                <FiSettings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={() => onDeleteBlock(blockNumber)}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Research Topic
            </label>
            <Textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
              placeholder="Enter the topic you want the agent to research"
            />
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {researchResults && (
            <div className="space-y-6">
              {/* Summary Section */}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <h4 className="text-sm font-medium mb-2 text-gray-300">
                  Summary
                </h4>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown>{researchResults.message}</ReactMarkdown>
                </div>
                {selectedVariableId && (
                  <div className="mt-2 text-sm text-green-400">
                    Saved as{" "}
                    {
                      Object.values(variables).find(
                        (v) => v.id === selectedVariableId
                      )?.name
                    }
                  </div>
                )}
              </div>

              {/* Search Results Section */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-300">Sources</h4>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {researchResults.search_results.map((result, index) => (
                    <a
                      key={index}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 w-72 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <div className="space-y-2">
                        {result.date && (
                          <div className="text-xs text-gray-400">
                            {new Date(result.date).toLocaleDateString()}
                          </div>
                        )}
                        <h5 className="text-sm font-medium text-gray-200 line-clamp-2">
                          {result.title}
                        </h5>
                        <div className="text-xs text-gray-400 truncate">
                          {result.url}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <Button
            onClick={processBlock}
            disabled={isLoading || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Researching...
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
