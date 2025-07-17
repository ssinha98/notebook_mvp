import React, { forwardRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FiSettings, FiInfo } from "react-icons/fi";
import { ClickUpAgentBlock } from "@/types/types";
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
import VariableDropdown from "./VariableDropdown";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";

// Define the available ClickUp operations
const CLICKUP_OPERATIONS = [
  {
    value: "list_all_tasks",
    label: "List All Tasks",
    description: "Retrieve all tasks from ClickUp",
    disabled: false,
  },
  {
    value: "add_task",
    label: "Add Task",
    description: "Create a new task in ClickUp",
    disabled: false,
  },
  {
    value: "list_all_lists",
    label: "List All Lists - coming soon",
    description: "Retrieve all lists from ClickUp",
    disabled: true,
  },
  {
    value: "list_all_subtasks",
    label: "List All Subtasks - coming soon",
    description: "Retrieve all subtasks from ClickUp",
    disabled: true,
  },
  {
    value: "edit_task",
    label: "Edit Task - coming soon",
    description: "Edit an existing task in ClickUp",
    disabled: true,
  },
];

interface ClickUpAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void; // Add this line
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<ClickUpAgentBlock>
  ) => void;
  initialPrompt?: string;
  isProcessing?: boolean;
}

interface ClickUpAgentRef {
  processBlock: () => Promise<boolean>;
}

const ClickUpAgent = forwardRef<ClickUpAgentRef, ClickUpAgentProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onCopyBlock,
      onUpdateBlock,
      initialPrompt = "",
      isProcessing = false,
    },
    ref
  ) => {
    const [selectedOperation, setSelectedOperation] = useState(
      initialPrompt || ""
    );
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [result, setResult] = useState<string>("");
    const [selectedVariableId, setSelectedVariableId] = useState<string>("");

    const variables = useVariableStore((state) => state.variables);
    const currentAgent = useAgentStore((state) => state.currentAgent);

    // Add store hook for updating block names
    const { updateBlockName } = useSourceStore();

    // Get current block to display its name
    const currentBlock = useSourceStore((state) =>
      state.blocks.find((block) => block.blockNumber === blockNumber)
    );

    const handleVariableSelect = (value: string) => {
      setSelectedVariableId(value);
    };

    const handleOperationSelect = (value: string) => {
      setSelectedOperation(value);
    };

    // Save selected operation with debounce
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        if (selectedOperation !== initialPrompt) {
          onUpdateBlock(blockNumber, { prompt: selectedOperation });
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [selectedOperation, blockNumber, onUpdateBlock, initialPrompt]);

    const processBlock = async () => {
      try {
        setError("");
        setResult("");
        setIsLoading(true);

        if (!selectedOperation) {
          setError("Please select an operation");
          return false;
        }

        console.log(
          "Sending request to Make.com webhook with operation:",
          selectedOperation
        );

        const response = await fetch(
          "https://hook.us2.make.com/7xa54ququdbycpcl7t4vwnxun2cvdow3",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              operation: selectedOperation,
            }),
          }
        );

        let responseData;
        const contentType = response.headers.get("content-type");

        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          const textResponse = await response.text();
          responseData = { message: textResponse };
        }

        console.log("Full Make.com webhook response:", responseData);

        if (response.ok && responseData) {
          let displayMessage;
          if (typeof responseData === "object") {
            displayMessage = JSON.stringify(responseData, null, 2);
          } else {
            displayMessage =
              responseData.message || "Operation completed successfully";
          }

          setResult(displayMessage);

          if (selectedVariableId) {
            const selectedVariable = Object.values(variables).find(
              (v) => v.id === selectedVariableId
            );
            if (selectedVariable) {
              await useVariableStore
                .getState()
                .updateVariable(selectedVariableId, displayMessage);
            }
          }

          return true;
        } else {
          console.error("Unexpected response structure:", responseData);
          throw new Error(
            responseData?.message || "Unexpected response format from server"
          );
        }
      } catch (err: any) {
        console.error("Error processing ClickUp request:", err);
        console.error("Full error object:", err);
        setError(
          err.message ||
            "An error occurred while processing the ClickUp request"
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
              src="https://clickup.com/images/for-se-page/clickup.png"
              alt="ClickUp"
              className="w-8 h-8 rounded"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-100">
                  ClickUp Agent {blockNumber}
                </h3>
                <BlockNameEditor
                  blockName={
                    currentBlock?.name || `ClickUp Agent ${blockNumber}`
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
                    ClickUp Agent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This agent integrates with ClickUp to manage tasks and
                    projects.
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
                onClick={() => onCopyBlock?.(blockNumber)}
              >
                Copy Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              ClickUp Operation
            </label>
            <Select
              value={selectedOperation}
              onValueChange={handleOperationSelect}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Select an operation" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {CLICKUP_OPERATIONS.map((operation) => (
                  <SelectItem
                    key={operation.value}
                    value={operation.value}
                    disabled={operation.disabled}
                    className="text-gray-100 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{operation.label}</div>
                        {operation.description && (
                          <div className="text-sm text-gray-400">
                            {operation.description}
                          </div>
                        )}
                      </div>
                      {operation.disabled && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-600"
                        >
                          beta
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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

          {result && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h4 className="text-sm font-medium mb-2 text-gray-300">Result</h4>
              <div className="text-gray-200 whitespace-pre-wrap">{result}</div>
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
          <Button
            onClick={processBlock}
            disabled={isLoading || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Processing...
              </>
            ) : (
              "Run ClickUp"
            )}
          </Button>
        </div>
      </div>
    );
  }
);

ClickUpAgent.displayName = "ClickUpAgent";

export default ClickUpAgent;
