import React, { forwardRef, useState, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { FiSettings, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { SalesforceBlock } from "@/types/types";
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

// Define the available Salesforce operations
const SALESFORCE_OPERATIONS = [
  {
    value: "search_company_by_name",
    label: "Search for all company information - by name",
    description: "Search for company information by company name",
    disabled: false,
  },
  {
    value: "search_opportunities_by_name",
    label: "Search for Opportunities - by name",
    description: "Search for opportunities by company name",
    disabled: false,
  },
  {
    value: "search_cases_by_name",
    label: "Search for Cases - by name",
    description: "Search for cases by company name",
    disabled: false,
  },
];

interface SalesforceAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void;
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<SalesforceBlock>
  ) => void;
  initialPrompt?: string;
  initialCompanyName?: string; // Add this line
  isProcessing?: boolean;
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string;
  } | null;
}

interface SalesforceAgentRef {
  processBlock: () => Promise<boolean>;
}

const processVariablesInText = (text: string): string => {
  const regex = /{{(.*?)}}/g;
  return text.replace(regex, (match, varName) => {
    const trimmedName = varName.trim();

    // Handle table.column references
    if (trimmedName.includes(".")) {
      const [tableName, columnName] = trimmedName.split(".");
      const tableVar = useVariableStore.getState().getVariableByName(tableName);
      if (tableVar?.type === "table") {
        const columnValues = useVariableStore
          .getState()
          .getTableColumn(tableVar.id, columnName);
        return JSON.stringify(columnValues);
      }
    }

    // Handle regular variables
    const variable = useVariableStore.getState().getVariableByName(trimmedName);
    if (!variable) return match;

    // Handle table variables
    if (variable.type === "table") {
      const rows = Array.isArray(variable.value) ? variable.value : [];
      return JSON.stringify(rows);
    }

    return String(variable.value || match);
  });
};

const SalesforceAgent = forwardRef<SalesforceAgentRef, SalesforceAgentProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onCopyBlock,
      onUpdateBlock,
      initialPrompt = "",
      initialCompanyName = "", // Add this line
      isProcessing = false,
      initialOutputVariable,
    },
    ref
  ) => {
    const [selectedOperation, setSelectedOperation] = useState(
      initialPrompt || "search_company_by_name"
    );
    const [companyName, setCompanyName] = useState(initialCompanyName);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [result, setResult] = useState<string>("");
    const [selectedVariableId, setSelectedVariableId] = useState<string>("");

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

    const handleCompanyNameChange = (value: string) => {
      setCompanyName(value);
    };

    // Save selected operation and company name with debounce
    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        onUpdateBlock(blockNumber, {
          prompt: selectedOperation,
          companyName: companyName,
        });
      }, 500);

      return () => clearTimeout(timeoutId);
    }, [selectedOperation, companyName, blockNumber, onUpdateBlock]);

    React.useEffect(() => {
      if (initialOutputVariable) {
        setSelectedVariableId(initialOutputVariable.id);
      }
    }, [initialOutputVariable]);

    // Add this new useEffect:
    React.useEffect(() => {
      if (initialCompanyName && initialCompanyName !== companyName) {
        setCompanyName(initialCompanyName);
      }
    }, [initialCompanyName]);

    const processBlock = async () => {
      try {
        setError("");
        setResult("");
        setIsLoading(true);

        if (!selectedOperation) {
          setError("Please select an operation");
          return false;
        }

        if (!companyName.trim()) {
          setError("Please enter a company name");
          return false;
        }

        console.log("Processing Salesforce operation:", selectedOperation);
        console.log("Company name:", companyName);

        // Process variables in company name
        const processedCompanyName = processVariablesInText(companyName);
        console.log("Processed company name:", processedCompanyName);

        // Make API call to Salesforce endpoint with processed company name
        const response = await api.get(
          `/salesforce/query-all?company=${encodeURIComponent(processedCompanyName)}`
        );

        if (response.success) {
          setResult(JSON.stringify(response, null, 2));

          if (selectedVariableId) {
            const selectedVariable = Object.values(variables).find(
              (v) => v.id === selectedVariableId
            );
            if (selectedVariable) {
              await useVariableStore
                .getState()
                .updateVariable(
                  selectedVariableId,
                  JSON.stringify(response, null, 2)
                );
            }
          }

          return true;
        } else {
          throw new Error("Salesforce operation failed");
        }
      } catch (err: any) {
        console.error("Error processing Salesforce request:", err);
        setError(
          err.message ||
            "An error occurred while processing the Salesforce request"
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
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRaAx4OMNKDO78w1GtSY9IKw8zy3RPjRMbWyg&s"
              alt="Salesforce"
              className="w-8 h-8 rounded"
            />
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-100">
                  Salesforce Agent {blockNumber}
                </h3>
                <BlockNameEditor
                  blockName={
                    currentBlock?.name || `Salesforce Agent ${blockNumber}`
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
                    Salesforce Agent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This agent integrates with Salesforce to search for
                    companies, opportunities, and cases for CRM management.
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
              Salesforce Operation
            </label>
            <Select
              value={selectedOperation}
              onValueChange={handleOperationSelect}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Select an operation" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {SALESFORCE_OPERATIONS.map((operation) => (
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

          {/* Company name input for all operations */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Company Name
            </label>
            <Input
              placeholder="Enter company to search for"
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400"
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
            runLabel="Run Salesforce"
            runningLabel="Searching..."
            disabled={isProcessing}
          />
        </div>
      </div>
    );
  }
);

SalesforceAgent.displayName = "SalesforceAgent";

export default SalesforceAgent;
