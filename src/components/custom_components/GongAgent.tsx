import React, { forwardRef, useState, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { FiSettings, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { GongBlock } from "@/types/types";
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

// Define the available Gong operations
const GONG_OPERATIONS = [
  {
    value: "get_all_calls",
    label: "Get All Calls",
    description: "Retrieve all calls from Gong",
    disabled: false,
  },
  {
    value: "get_data_from_specific_call",
    label: "Get Data from Specific Call",
    description: "Get detailed data from a specific call ID",
    disabled: false,
  },
  {
    value: "get_transcript_from_specific_calls",
    label: "Get Transcript from Specific Calls",
    description: "Get transcripts from specific call IDs",
    disabled: false,
  },
  {
    value: "get_all_users",
    label: "Get All Users",
    description: "Retrieve all users from Gong",
    disabled: false,
  },
  {
    value: "get_data_from_specific_user",
    label: "Get Data from Specific User",
    description: "Get detailed data from a specific user ID",
    disabled: false,
  },
];

interface GongAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void;
  onUpdateBlock: (blockNumber: number, updates: Partial<GongBlock>) => void;
  initialPrompt?: string;
  initialEndpoint?: string;
  initialCallIds?: string; // Add this line
  isProcessing?: boolean;
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string;
  } | null;
}

interface GongAgentRef {
  processBlock: () => Promise<boolean>;
}

const GongAgent = forwardRef<GongAgentRef, GongAgentProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onCopyBlock,
      onUpdateBlock,
      initialPrompt = "",
      initialEndpoint = "/api/gong",
      initialCallIds = "", // Add this line
      isProcessing = false,
      initialOutputVariable,
    },
    ref
  ) => {
    const [selectedOperation, setSelectedOperation] = useState(
      initialPrompt || ""
    );
    const [callIds, setCallIds] = useState<string>(initialCallIds);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [result, setResult] = useState<string>("");
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

    const handleCallIdsChange = (value: string) => {
      setCallIds(value);
    };

    // Save selected operation and call IDs with debounce
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        onUpdateBlock(blockNumber, {
          prompt: selectedOperation,
          callIds: callIds,
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [selectedOperation, callIds, blockNumber, onUpdateBlock]);

    // Helper function to resolve variables in call IDs
    const resolveCallIds = (input: string): string[] => {
      if (!input.trim()) return [];

      // Check if input contains variable references (e.g., {{variableName}})
      const variablePattern = /\{\{([^}]+)\}\}/g;
      let resolvedInput = input;

      input.match(variablePattern)?.forEach((match) => {
        const variableName = match.replace(/\{\{|\}\}/g, "");
        const variable = Object.values(variables).find(
          (v) => v.name === variableName
        );
        if (variable) {
          // If variable contains a string, use it directly
          if (typeof variable.value === "string") {
            let variableValue = variable.value;

            // Try to parse as JSON to remove quotes if it's a JSON string
            try {
              const parsed = JSON.parse(variableValue);
              if (typeof parsed === "string") {
                variableValue = parsed;
              }
            } catch {
              // If parsing fails, use the original value
            }

            resolvedInput = resolvedInput.replace(match, variableValue);
          }
        }
      });

      // Split by comma and clean up - remove quotes from each individual ID
      return resolvedInput
        .split(",")
        .map((id) => id.trim().replace(/^["']|["']$/g, "")) // Remove surrounding quotes
        .filter((id) => id.length > 0);
    };

    // Add this retry function after the processVariablesInText function:
    const waitForVariableValue = async (
      variableName: string,
      maxRetries: number = 5,
      delayMs: number = 1000
    ): Promise<string | null> => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        console.log(
          `Attempt ${attempt}/${maxRetries} to get variable ${variableName}`
        );

        const variable = useVariableStore
          .getState()
          .getVariableByName(variableName);
        console.log(
          `Variable ${variableName} on attempt ${attempt}:`,
          variable
        );

        if (
          variable &&
          variable.value !== null &&
          variable.value !== undefined
        ) {
          console.log(
            `Variable ${variableName} found with value:`,
            variable.value
          );
          return String(variable.value);
        }

        if (attempt < maxRetries) {
          console.log(
            `Variable ${variableName} not ready, waiting ${delayMs}ms before retry...`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }

      console.log(
        `Variable ${variableName} still null after ${maxRetries} attempts`
      );
      return null;
    };

    // Update the processVariablesInText function to use retry logic:
    const processVariablesInText = async (text: string): Promise<string> => {
      console.log("processVariablesInText called with:", text);

      const regex = /{{(.*?)}}/g;
      let result = text;

      // Find all variable references first
      const variableMatches = Array.from(text.matchAll(regex));

      for (const match of variableMatches) {
        const [fullMatch, varName] = match;
        const trimmedName = varName.trim();
        console.log("Processing variable:", trimmedName);

        // Handle table.column references
        if (trimmedName.includes(".")) {
          const [tableName, columnName] = trimmedName.split(".");
          const tableVar = useVariableStore
            .getState()
            .getVariableByName(tableName);
          if (tableVar?.type === "table") {
            const columnValues = useVariableStore
              .getState()
              .getTableColumn(tableVar.id, columnName);
            console.log("Table column values:", columnValues);
            result = result.replace(fullMatch, JSON.stringify(columnValues));
            continue;
          }
        }

        // Handle regular variables with retry logic
        const variableValue = await waitForVariableValue(trimmedName);

        if (variableValue !== null) {
          console.log(
            `Successfully resolved variable ${trimmedName} to:`,
            variableValue
          );
          result = result.replace(fullMatch, variableValue);
        } else {
          console.log(
            `Failed to resolve variable ${trimmedName} after retries`
          );
          // Keep the original {{variableName}} if we can't resolve it
        }
      }

      console.log("processVariablesInText result:", result);
      return result;
    };

    // Update the processBlock function to use async processVariablesInText:
    const processBlock = async () => {
      try {
        setError("");
        setResult("");
        setIsLoading(true);

        if (!selectedOperation) {
          setError("Please select an operation");
          return false;
        }

        console.log("Processing Gong operation:", selectedOperation);

        let response;
        let endpoint = "";

        // Determine endpoint and method based on operation
        switch (selectedOperation) {
          case "get_all_users":
            response = await api.get("/gong/users");
            break;
          case "get_all_calls":
            response = await api.get("/gong/calls");
            break;
          case "get_data_from_specific_call":
            response = await api.get("/gong/calls?clientUniqueId=usr_1001");
            break;
          case "get_transcript_from_specific_calls":
            // Process variables in call IDs FIRST with retry logic
            console.log("=== BEFORE processVariablesInText ===");
            console.log("Original callIds input:", callIds);
            console.log(
              "Available variables:",
              Object.keys(useVariableStore.getState().variables)
            );

            const processedCallIds = await processVariablesInText(callIds);
            console.log("=== AFTER processVariablesInText ===");
            console.log("Processed call IDs:", processedCallIds);

            // Only call resolveCallIds if we actually have resolved values
            let resolvedCallIds;
            if (
              processedCallIds.includes("{{") &&
              processedCallIds.includes("}}")
            ) {
              // Variables weren't resolved, try resolveCallIds as fallback
              console.log(
                "Variables not resolved, trying resolveCallIds as fallback"
              );
              resolvedCallIds = resolveCallIds(processedCallIds);
            } else {
              // Variables were resolved, just split the comma-separated values
              console.log(
                "Variables resolved, splitting comma-separated values"
              );
              resolvedCallIds = processedCallIds
                .split(",")
                .map((id) => id.trim().replace(/^["']|["']$/g, ""))
                .filter((id) => id.length > 0);
            }

            console.log("Final resolved call IDs:", resolvedCallIds);

            if (resolvedCallIds.length === 0) {
              setError(
                "Please provide call IDs (comma-separated) or use a variable"
              );
              return false;
            }

            // Build query string with multiple callId parameters
            const callIdParams = resolvedCallIds
              .map((id) => `callId=${encodeURIComponent(id)}`)
              .join("&");
            endpoint = `/gong/transcripts?${callIdParams}`;
            console.log("Full API call:", `${API_URL}${endpoint}`);
            response = await api.get(endpoint);
            break;
          default:
            throw new Error(`Unknown operation: ${selectedOperation}`);
        }

        if (response.success) {
          setResult(JSON.stringify(response, null, 2));

          if (selectedVariableId) {
            const selectedVariable = Object.values(variables).find(
              (v) => v.id === selectedVariableId
            );
            if (selectedVariable) {
              // Debug: Log the response structure
              console.log("Full response:", response);
              console.log("Response.data:", response.data);
              console.log("Response type:", typeof response);
              console.log("Response.data type:", typeof response.data);

              // Use the appropriate data from the response based on operation
              let dataToStore: any;

              switch (selectedOperation) {
                case "get_all_calls":
                  dataToStore = response.calls;
                  break;
                case "get_all_users":
                  dataToStore = response.users || response.data;
                  break;
                case "get_data_from_specific_call":
                  dataToStore = response.call || response.data;
                  break;
                case "get_transcript_from_specific_calls":
                  dataToStore = response.callTranscripts; // Changed from response.transcripts
                  break;
                default:
                  dataToStore = response;
              }

              // Convert to string for storage
              const valueToStore =
                typeof dataToStore === "string"
                  ? dataToStore
                  : JSON.stringify(dataToStore, null, 2);

              console.log("Data to store:", dataToStore);
              console.log("Value to store:", valueToStore);

              await useVariableStore
                .getState()
                .updateVariable(selectedVariableId, valueToStore);
            }
          }

          return true;
        } else {
          throw new Error(response.error || "Gong operation failed");
        }
      } catch (err: any) {
        console.error("Error processing Gong request:", err);
        setError(
          err.message || "An error occurred while processing the Gong request"
        );
        return false;
      } finally {
        setIsLoading(false);
      }
    };

    React.useImperativeHandle(ref, () => ({
      processBlock,
    }));

    // Render specific UI component based on selected operation
    const renderOperationUI = () => {
      switch (selectedOperation) {
        case "get_all_calls":
          return <GetAllCallsUI />;
        case "get_data_from_specific_call":
          return <GetDataFromSpecificCallUI />;
        case "get_transcript_from_specific_calls":
          return <GetTranscriptFromSpecificCallsUI />;
        case "get_all_users":
          return <GetAllUsersUI />;
        case "get_data_from_specific_user":
          return <GetDataFromSpecificUserUI />;
        default:
          return null;
      }
    };

    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <img
              src="https://media.licdn.com/dms/image/v2/D560BAQEginaUF2_5cg/company-logo_200_200/company-logo_200_200/0/1689291197848/gong_io_logo?e=2147483647&v=beta&t=RrwriKBanhV13Rr_LnTmYPd3If7wbo1rp4T2dWTSFJM"
              alt="Gong"
              className="w-8 h-8 rounded"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-100">
                  Gong Agent {blockNumber}
                </h3>
                <BlockNameEditor
                  blockName={currentBlock?.name || `Gong Agent ${blockNumber}`}
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
                    Gong Agent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This agent integrates with Gong to analyze call recordings,
                    transcripts, and user data for sales insights.
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
              Gong Operation
            </label>
            <Select
              value={selectedOperation}
              onValueChange={handleOperationSelect}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Select an operation" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {GONG_OPERATIONS.map((operation) => (
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

          {/* Call IDs input for transcript operation */}
          {selectedOperation === "get_transcript_from_specific_calls" && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Call IDs
              </label>
              <Input
                placeholder="Enter call IDs (comma-separated) or use variables like {{variableName}}"
                value={callIds}
                onChange={(e) => handleCallIdsChange(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
              />
              <p className="text-xs text-gray-400">
                Example: call_2001, call_2002 or {`{{myCallIds}}`}
              </p>
            </div>
          )}

          {/* Render specific UI component based on selected operation */}
          {selectedOperation && renderOperationUI()}

          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
            />
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {result && (
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
            runLabel="Run Gong"
            runningLabel="Processing..."
            disabled={isProcessing}
          />
        </div>
      </div>
    );
  }
);

// Individual UI components for each operation
const GetAllCallsUI = () => (
  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
    <h4 className="text-sm font-medium mb-2 text-gray-300">Get All Calls</h4>
    <p className="text-gray-400 text-sm">
      This will retrieve all calls from your Gong account. No additional
      parameters needed.
    </p>
  </div>
);

const GetDataFromSpecificCallUI = () => (
  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
    <h4 className="text-sm font-medium mb-2 text-gray-300">
      Get Data from Specific Call
    </h4>
    <p className="text-gray-400 text-sm">
      This will retrieve detailed data from a specific call. Call ID parameter
      will be required.
    </p>
    {/* TODO: Add call ID input field */}
  </div>
);

const GetTranscriptFromSpecificCallsUI = () => (
  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
    <h4 className="text-sm font-medium mb-2 text-gray-300">
      Get Transcript from Specific Calls
    </h4>
    <p className="text-gray-400 text-sm">
      This will retrieve transcripts from specific calls. Call IDs parameter
      will be required.
    </p>
    {/* TODO: Add call IDs input field */}
  </div>
);

const GetAllUsersUI = () => (
  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
    <h4 className="text-sm font-medium mb-2 text-gray-300">Get All Users</h4>
    <p className="text-gray-400 text-sm">
      This will retrieve all users from your Gong account. No additional
      parameters needed.
    </p>
  </div>
);

const GetDataFromSpecificUserUI = () => (
  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
    <h4 className="text-sm font-medium mb-2 text-gray-300">
      Get Data from Specific User
    </h4>
    <p className="text-gray-400 text-sm">
      This will retrieve detailed data from a specific user. User ID parameter
      will be required.
    </p>
    {/* TODO: Add user ID input field */}
  </div>
);

GongAgent.displayName = "GongAgent";

export default GongAgent;
