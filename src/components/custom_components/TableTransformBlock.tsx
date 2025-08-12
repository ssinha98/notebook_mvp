import React, { forwardRef, useImperativeHandle, useState } from "react";
import VariableDropdown from "./VariableDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableTransformBlock as TableTransformBlockType } from "@/types/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import BlockNameEditor from "./BlockNameEditor";
import { useSourceStore } from "@/lib/store";
import { toast } from "sonner";
import { Plus, Minus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useVariableStore } from "@/lib/variableStore";
import { api } from "@/tools/api";
import { auth } from "@/tools/firebase";
import { useAgentStore } from "@/lib/agentStore";

interface TableTransformBlockProps {
  block: TableTransformBlockType;
  onBlockUpdate: (block: TableTransformBlockType) => void;
}

export interface TableTransformBlockRef {
  processBlock: () => Promise<boolean>;
}

interface FilterCondition {
  id: string;
  column: string;
  operator: "equals" | "contains" | "starts_with" | "ends_with";
  value: string;
}

const TableTransformBlock = forwardRef<
  TableTransformBlockRef,
  TableTransformBlockProps
>(({ block, onBlockUpdate }, ref) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Add store hook for updating block names and deleting blocks
  const { updateBlockName } = useSourceStore();
  const { deleteBlock } = useAgentStore();

  // Get current block to display its name
  const currentAgent = useAgentStore((state) => state.currentAgent);
  const currentBlock = currentAgent?.blocks?.find(
    (b) => b.blockNumber === block.blockNumber
  );

  // Add state for dynamic UI
  const [deduplicateColumn, setDeduplicateColumn] = useState<string>("");
  const [outputTableId, setOutputTableId] = useState<string>("");
  const [filterConditions, setFilterConditions] = useState<FilterCondition[]>(
    []
  );
  const [saveMode, setSaveMode] = useState<"overwrite" | "new">("new");

  // Add state for new table name
  const [newTableName, setNewTableName] = useState<string>("");

  // Add state for multiple columns
  const [deduplicateColumns, setDeduplicateColumns] = useState<string[]>([]);

  // Add helper functions
  const addFilterCondition = () => {
    const newCondition: FilterCondition = {
      id: crypto.randomUUID(),
      column: "",
      operator: "equals",
      value: "",
    };
    setFilterConditions([...filterConditions, newCondition]);
  };

  const removeFilterCondition = (id: string) => {
    setFilterConditions(filterConditions.filter((c) => c.id !== id));
  };

  const updateFilterCondition = (
    id: string,
    updates: Partial<FilterCondition>
  ) => {
    setFilterConditions(
      filterConditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  // Get columns from selected table
  const getTableColumns = () => {
    if (!block.tableId) return [];
    const variables = useVariableStore.getState().variables;
    const tableVar = variables[block.tableId];
    return tableVar?.type === "table" ? tableVar.columns || [] : [];
  };

  // Render operation-specific UI
  const renderOperationUI = () => {
    switch (block.operation) {
      case "deduplicate":
        return (
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-300">
                Deduplicate on columns
              </label>
              <Select
                value=""
                onValueChange={(value) => {
                  if (value && !deduplicateColumns.includes(value)) {
                    setDeduplicateColumns([...deduplicateColumns, value]);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select columns to deduplicate on" />
                </SelectTrigger>
                <SelectContent>
                  {getTableColumns()
                    .filter((column) => !deduplicateColumns.includes(column))
                    .map((column) => (
                      <SelectItem key={column} value={column}>
                        {column}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {deduplicateColumns.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Selected columns:
                </label>
                <div className="flex flex-wrap gap-2">
                  {deduplicateColumns.map((column) => (
                    <div
                      key={column}
                      className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm"
                    >
                      <span>{column}</span>
                      <button
                        onClick={() =>
                          setDeduplicateColumns(
                            deduplicateColumns.filter((c) => c !== column)
                          )
                        }
                        className="text-white hover:text-red-200"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Save mode
              </label>
              <Select
                value={saveMode}
                onValueChange={(value) => setSaveMode(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select save mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create new table</SelectItem>
                  <SelectItem value="overwrite">
                    Overwrite existing table
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {saveMode === "new" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">
                  New table name
                </label>
                <Input
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      case "filter":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Filter conditions
              </label>
              <Button
                onClick={addFilterCondition}
                size="sm"
                variant="outline"
                className="text-blue-400 hover:text-blue-300"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add condition
              </Button>
            </div>

            {filterConditions.length === 0 && (
              <div className="text-sm text-gray-400 italic">
                No filter conditions added. Click "Add condition" to start
                filtering.
              </div>
            )}

            {filterConditions.map((condition, index) => (
              <div
                key={condition.id}
                className="p-3 border border-gray-600 rounded-lg space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">
                    Condition {index + 1}
                  </span>
                  <Button
                    onClick={() => removeFilterCondition(condition.id)}
                    size="sm"
                    variant="ghost"
                    className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Select
                    value={condition.column}
                    onValueChange={(value) =>
                      updateFilterCondition(condition.id, { column: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTableColumns().map((column) => (
                        <SelectItem key={column} value={column}>
                          {column}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={condition.operator}
                    onValueChange={(value) =>
                      updateFilterCondition(condition.id, {
                        operator: value as any,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Operator" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">equals</SelectItem>
                      <SelectItem value="contains">contains</SelectItem>
                      <SelectItem value="starts_with">starts with</SelectItem>
                      <SelectItem value="ends_with">ends with</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    value={condition.value}
                    onChange={(e) =>
                      updateFilterCondition(condition.id, {
                        value: e.target.value,
                      })
                    }
                    placeholder="Value"
                    className="flex-1"
                  />
                </div>
              </div>
            ))}

            {filterConditions.length > 1 && (
              <div className="text-sm text-gray-400 italic">
                All conditions must match (AND logic)
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Save mode
              </label>
              <Select
                value={saveMode}
                onValueChange={(value) => setSaveMode(value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select save mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">Create new table</SelectItem>
                  <SelectItem value="overwrite">
                    Overwrite existing table
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {saveMode === "new" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-300">
                  New table name
                </label>
                <Input
                  value={newTableName}
                  onChange={(e) => setNewTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  useImperativeHandle(ref, () => ({
    processBlock: async () => {
      setIsProcessing(true);
      setError(null);
      try {
        // TODO: Implement actual processing logic
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setIsProcessing(false);
      }
    },
  }));

  const handleOperationChange = (value: string) => {
    onBlockUpdate({
      ...block,
      operation: value as TableTransformBlockType["operation"],
    });
  };

  const handleTableChange = (value: string) => {
    onBlockUpdate({
      ...block,
      tableId: value,
    });
  };

  const handleDeleteBlock = () => {
    deleteBlock(block.blockNumber);
    toast.success("Block deleted successfully");
  };

  const handleCopyBlock = () => {
    // TODO: Implement copy functionality
    toast.success("Copy functionality not implemented yet");
  };

  const handleProcessBlock = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error("User not authenticated");
      }

      const currentAgent = useAgentStore.getState().currentAgent;
      if (!currentAgent?.id) {
        throw new Error("No agent selected");
      }

      if (!block.tableId) {
        throw new Error("No table selected");
      }

      // Update the payload structure to ensure agent_id is included
      const payload: any = {
        request_id: crypto.randomUUID(),
        user_id: userId,
        table_id: block.tableId,
        agent_id: currentAgent?.id, // Add optional chaining
        operation:
          block.operation === "deduplicate" ? "dedupe" : block.operation,
        save_mode: saveMode,
      };

      // Add validation for agent_id
      if (!currentAgent?.id) {
        throw new Error("No agent selected");
      }

      // Add operation-specific parameters
      if (block.operation === "deduplicate") {
        if (deduplicateColumns.length === 0) {
          throw new Error(
            "Please select at least one column to deduplicate on"
          );
        }
        payload.params = {
          subset_columns: deduplicateColumns,
        };
        if (saveMode === "new") {
          payload.new_table_name =
            newTableName || `deduplicated_${block.tableId}`;
        }
      } else if (block.operation === "filter") {
        if (filterConditions.length === 0) {
          throw new Error("Please add at least one filter condition");
        }
        payload.params = {
          conditions: filterConditions.map((condition) => ({
            column: condition.column,
            operator: condition.operator,
            value: condition.value,
          })),
        };
        if (saveMode === "new") {
          payload.new_table_name = newTableName || `filtered_${block.tableId}`;
        }
      }

      // Make API call using the api utility
      const response = await api.post("/api/table-transform", payload);

      // Check for success using status field
      if (response.status === "success") {
        // Reset form state
        setDeduplicateColumns([]);
        setFilterConditions([]);
        setNewTableName("");
        setSaveMode("new");
        setOutputTableId("");
        setError(null);

        // Reload variables to show the new table
        await useVariableStore.getState().loadVariables(currentAgent.id);

        toast.success("Table transformed successfully!");
        return true;
      } else {
        // Log the actual response for debugging
        console.log("API Response:", response);
        throw new Error(
          response.message || response.error || "Failed to transform table"
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              Block #{block.blockNumber}
            </h3>
            <BlockNameEditor
              blockName={
                currentBlock?.name || `Table Transform ${block.blockNumber}`
              }
              blockNumber={block.blockNumber}
              onNameUpdate={updateBlockName}
            />
          </div>
        </div>
        <Popover>
          <PopoverTrigger>
            <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
              ⚙️
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-0 bg-black border border-red-500">
            <button
              className="w-full px-4 py-2 text-blue-500 hover:bg-blue-950 text-left transition-colors"
              onClick={handleCopyBlock}
            >
              Copy Block
            </button>
            <button
              className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
              onClick={handleDeleteBlock}
            >
              Delete Block
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Select Table
          </label>
          <VariableDropdown
            value={block.tableId || ""}
            onValueChange={handleTableChange}
            showOnlyTableVariables={true} // Use this instead of excludeTableVariables
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">Operation</label>
          <Select value={block.operation} onValueChange={handleOperationChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select operation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="deduplicate">Deduplicate</SelectItem>
              <SelectItem value="filter">Filter</SelectItem>
              <SelectItem value="summarize" disabled>
                Summarize (Coming Soon)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Render operation-specific UI */}
        {renderOperationUI()}

        {error && <div className="text-red-500 text-sm">{error}</div>}

        <div className="mt-4 flex justify-start">
          <Button
            onClick={handleProcessBlock}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Processing...
              </>
            ) : (
              "Transform Table"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});

TableTransformBlock.displayName = "TableTransformBlock";

export default TableTransformBlock;
