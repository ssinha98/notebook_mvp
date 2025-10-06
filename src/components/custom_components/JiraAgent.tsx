import React, { forwardRef, useState, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { FiSettings, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { JiraBlock } from "@/types/types";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { api, API_URL } from "@/tools/api";
import VariableDropdown from "./VariableDropdown";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";
import { BlockButton } from "./BlockButton";

// Define the available Jira operations
const JIRA_OPERATIONS = [
  {
    value: "search_for_issue",
    label: "Search for an issue",
    description: "Search for issues in Jira",
    disabled: false,
  },
  {
    value: "get_all_issues",
    label: "Get all issues",
    description: "Retrieve all issues from Jira",
    disabled: false,
  },
];

interface JiraAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void;
  onUpdateBlock: (blockNumber: number, updates: Partial<JiraBlock>) => void;
  initialPrompt?: string;
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string;
  } | null;
  isProcessing?: boolean;
}

interface JiraAgentRef {
  processBlock: () => Promise<boolean>;
}

const JiraAgent = forwardRef<JiraAgentRef, JiraAgentProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onCopyBlock,
      onUpdateBlock,
      initialPrompt = "",
      initialOutputVariable,
      isProcessing = false,
    },
    ref
  ) => {
    const [selectedOperation, setSelectedOperation] = useState(
      initialPrompt || "search_for_issue"
    );
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [result, setResult] = useState<string | null>(null);
    const [selectedVariableId, setSelectedVariableId] = useState<string>(() => {
      // If we have an initial output variable with a column name, construct the proper value
      if (initialOutputVariable?.columnName) {
        return `${initialOutputVariable.id}:${initialOutputVariable.columnName}`;
      }
      // Otherwise use the ID directly
      return initialOutputVariable?.id || "";
    });

    const variables = useVariableStore((state) => state.variables);

    // Add store hook for updating block names
    const { updateBlockName } = useSourceStore();

    // Get current block to display its name
    const currentAgent = useAgentStore((state) => state.currentAgent);
    const currentBlock = currentAgent?.blocks?.find(
      (block) => block.blockNumber === blockNumber
    );

    const handleVariableSelect = (value: string) => {
      setSelectedVariableId(value);

      if (value) {
        const variables = useVariableStore.getState().variables;
        let outputVariable: {
          id: string;
          name: string;
          type: "input" | "intermediate" | "table";
          columnName?: string;
        } | null = null;

        if (value.includes(":")) {
          // Table variable with column name
          const [tableId, columnName] = value.split(":");
          const selectedVariable = Object.values(variables).find(
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
          const selectedVariable = Object.values(variables).find(
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

        onUpdateBlock(blockNumber, { outputVariable });
      } else {
        onUpdateBlock(blockNumber, { outputVariable: null });
      }
    };

    const handleOperationSelect = (value: string) => {
      setSelectedOperation(value);
    };

    const handleSearchQueryChange = (value: string) => {
      setSearchQuery(value);
    };

    // Save selected operation and search query with debounce
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (selectedOperation !== initialPrompt) {
          onUpdateBlock(blockNumber, {
            prompt: selectedOperation,
            searchQuery: searchQuery,
          });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [
      selectedOperation,
      searchQuery,
      blockNumber,
      onUpdateBlock,
      initialPrompt,
    ]);

    const processBlock = async () => {
      try {
        setError("");
        // setResult("");
        setIsLoading(true);

        if (!selectedOperation) {
          setError("Please select an operation");
          return false;
        }

        // Remove the search query requirement - make it optional
        // if (!searchQuery.trim()) {
        //   setError("Please enter a search query");
        //   return false;
        // }

        console.log("Processing Jira operation:", selectedOperation);
        console.log("Search query:", searchQuery);

        // Make API call to Jira endpoint - handle both search and get all cases
        const endpoint =
          selectedOperation === "get_all_issues"
            ? "/jira/search"
            : `/jira/search?company=${encodeURIComponent(searchQuery)}`;

        console.log("Making API call to:", `${API_URL}${endpoint}`);
        console.log("Full endpoint:", endpoint);
        console.log("Selected operation:", selectedOperation);
        console.log("Search query:", searchQuery);

        const response = await api.get(endpoint);

        // Debug: Log the full response structure
        console.log("Full API response:", response);
        console.log("Response issues:", response.issues);

        if (response.success) {
          // Extract only the issues list from the response
          const issues = response.issues || [];
          console.log("Extracted issues:", issues);
          console.log("Issues length:", issues.length);

          const issuesText = JSON.stringify(issues, null, 2);
          console.log("Issues as text:", issuesText);

          setResult(issuesText);

          if (selectedVariableId) {
            const selectedVariable = Object.values(variables).find(
              (v) => v.id === selectedVariableId
            );
            if (selectedVariable) {
              // Save only the issues list as text
              await useVariableStore
                .getState()
                .updateVariable(selectedVariableId, issuesText);
            }
          }

          return true;
        } else {
          throw new Error("Jira operation failed");
        }
      } catch (err: any) {
        console.error("Error processing Jira request:", err);
        setError(
          err.message || "An error occurred while processing the Jira request"
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
            <img
              src="https://play-lh.googleusercontent.com/_AZCbg39DTuk8k3DiPRASr9EwyW058pOfzvAu1DsfN9ygtbOlbuucmXaHJi5ooYbokQX"
              alt="Jira"
              className="w-8 h-8 rounded"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-100">
                  Jira Agent {blockNumber}
                </h3>
                <BlockNameEditor
                  blockName={currentBlock?.name || `Jira Agent ${blockNumber}`}
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
                    Jira Agent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This agent integrates with Jira to search for issues, create
                    tickets, and manage project workflows.
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
              Jira Operation
            </label>
            <Select
              value={selectedOperation}
              onValueChange={handleOperationSelect}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Select an operation" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {JIRA_OPERATIONS.map((operation) => (
                  <SelectItem
                    key={operation.value}
                    value={operation.value}
                    disabled={operation.disabled}
                    className="text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div>
                      <div className="font-medium">{operation.label}</div>
                      {operation.description && (
                        <div className="text-sm text-gray-400">
                          {operation.description}
                        </div>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search input for issue search */}
          {selectedOperation === "search_for_issue" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Search Query
              </label>
              <Input
                placeholder="Enter what to search for"
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
              />
            </div>
          )}

          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {result && !isProcessing && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium mb-2 text-gray-300">Result</h4>
              <div className="h-48 overflow-y-auto text-gray-200 whitespace-pre-wrap border border-gray-600 rounded p-2 bg-gray-900">
                {result}
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
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <BlockButton
            isRunning={isLoading}
            onRun={processBlock}
            onCancel={() => setIsLoading(false)}
            runLabel="Run Jira"
            runningLabel="Searching..."
            disabled={isProcessing}
          />
        </div>
      </div>
    );
  }
);

JiraAgent.displayName = "JiraAgent";

export default JiraAgent;
