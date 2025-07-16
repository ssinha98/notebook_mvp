import React, { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Copy, ChevronDown, Trash, X } from "lucide-react"; // Add X import for clear icon
import { toast } from "sonner";
import { useVariableStore } from "@/lib/variableStore";
import { Variable, TableVariable } from "@/types/types";
import AddVariableDialog from "./AddVariableDialog";

type CombinedVariable = Variable | TableVariable;

interface VariableDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  agentId?: string | null;
  onAddNew?: () => void; // Keep this for backward compatibility but make it optional
  className?: string;
  excludeTableVariables?: boolean;
}

const VariableDropdown: React.FC<VariableDropdownProps> = ({
  value,
  onValueChange,
  agentId,
  onAddNew, // This will be ignored in favor of our internal dialog
  className = "",
  excludeTableVariables = false,
}) => {
  const variables = useVariableStore((state) => state.variables);

  // Add state for the AddVariableDialog
  const [isAddVariableDialogOpen, setIsAddVariableDialogOpen] = useState(false);

  // Handle adding new variable
  const handleAddNewVariable = () => {
    setIsAddVariableDialogOpen(true);
    // Show helpful toast when dialog opens
    toast(
      "💡 Hover over the info icon to make sure you're choosing the right variable type for your use case",
      {
        duration: 4000, // Show for 4 seconds
        // action: {
        //   label: "Got it",
        //   onClick: () => toast.dismiss(),
        // },
      }
    );
  };

  // Handle variable added from dialog
  const handleVariableAdded = (variable: Variable) => {
    // The variable is already added to the store by the dialog
    // We can optionally auto-select it
    onValueChange(variable.id);
    toast(`Variable "${variable.name}" created successfully!`);
  };

  // Handle clearing the selected variable
  const handleClearVariable = () => {
    onValueChange(""); // Clear the selection
    toast("Variable selection cleared - response will not be saved");
  };

  const handleCopyVariable = () => {
    if (value) {
      // Ensure value is a string before calling includes
      let stringValue;
      if (typeof value === "string") {
        stringValue = value;
      } else if (typeof value === "object" && value !== null) {
        // Handle object format from Apollo agent
        const objValue = value as any; // Type assertion to avoid TypeScript error
        if (objValue.type === "table" && objValue.columnName) {
          stringValue = `${objValue.id}:${objValue.columnName}`;
        } else {
          stringValue = objValue.id || "";
        }
      } else {
        stringValue = String(value);
      }

      // Check if it's a table column selection (contains ':')
      if (stringValue.includes(":") && !excludeTableVariables) {
        const [tableId, columnName] = stringValue.split(":");
        const tableVar = Object.values(variables).find((v) => v.id === tableId);
        if (tableVar && tableVar.type === "table") {
          const variableText = `{{${tableVar.name}.${columnName}}}`;
          navigator.clipboard.writeText(variableText);
          toast(`${variableText} copied to clipboard`, {
            action: {
              label: "Close",
              onClick: () => toast.dismiss(),
            },
          });
          return;
        }
      }

      // Handle regular variables (intermediate, input, etc.)
      const selectedVariable = Object.values(variables).find(
        (v) => v.id === stringValue
      ) as CombinedVariable;
      if (selectedVariable) {
        const variableText = `{{${selectedVariable.name}}}`;
        navigator.clipboard.writeText(variableText);
        toast(`${variableText} copied to clipboard`, {
          action: {
            label: "Close",
            onClick: () => toast.dismiss(),
          },
        });
      }
    }
  };

  // Filter and group variables
  const intermediateVariables = Object.values(variables).filter((v) => {
    const isIntermediate = v.type === "intermediate";
    return agentId ? isIntermediate && v.agentId === agentId : isIntermediate;
  });

  // Only process table variables if not excluded
  const tableVariables = excludeTableVariables
    ? {}
    : Object.values(variables)
        .filter((v) => v.type === "table")
        .reduce<
          Record<
            string,
            { id: string; columns: Array<{ name: string; value: string }> }
          >
        >((acc, v) => {
          if (!acc[v.name] && v.columns) {
            acc[v.name] = {
              id: v.id,
              columns: v.columns
                .filter((column) => column !== "id")
                .map((column) => ({
                  name: column,
                  value: `${v.id}:${column}`,
                })),
            };
          }
          return acc;
        }, {});

  // Find the selected variable name for display
  const getSelectedName = () => {
    if (!value) return "Select variable";

    // Ensure value is a string before calling includes
    let stringValue;
    if (typeof value === "string") {
      stringValue = value;
    } else if (typeof value === "object" && value !== null) {
      // Handle object format from Apollo agent
      const objValue = value as any; // Type assertion to avoid TypeScript error
      if (objValue.type === "table" && objValue.columnName) {
        stringValue = `${objValue.id}:${objValue.columnName}`;
      } else {
        stringValue = objValue.id || "";
      }
    } else {
      stringValue = String(value);
    }

    // Check if it's a table column selection (contains ':')
    if (stringValue.includes(":") && !excludeTableVariables) {
      const [tableId, columnName] = stringValue.split(":");
      const tableVar = Object.values(variables).find((v) => v.id === tableId);
      if (tableVar && tableVar.type === "table") {
        return `${tableVar.name}.${columnName}`;
      }
    }

    const variable = Object.values(variables).find((v) => v.id === stringValue);
    if (!variable) return "Select variable";
    return variable.name;
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-[180px] justify-between">
              {getSelectedName()}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[220px]">
            {" "}
            {/* Increased width */}
            {/* Clear option - only show if a variable is selected */}
            {value && (
              <>
                <DropdownMenuItem
                  onSelect={handleClearVariable}
                  className="text-gray-400 hover:text-gray-600 flex items-center gap-2"
                >
                  <X className="h-3 w-3" />
                  <span>Clear selection</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {intermediateVariables.length > 0 && (
              <>
                <DropdownMenuLabel>Intermediate Variables</DropdownMenuLabel>
                {intermediateVariables.map((v) => (
                  <DropdownMenuItem
                    key={v.id}
                    onSelect={() => onValueChange(v.id)}
                    className="flex items-center justify-between group"
                  >
                    <span>{v.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        useVariableStore.getState().deleteVariable(v.id);
                        toast(`Variable "${v.name}" deleted`);
                      }}
                      className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-red-500 transition-colors"
                    >
                      <Trash className="h-3 w-3" />
                    </button>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            {Object.keys(tableVariables).length > 0 && (
              <>
                <DropdownMenuLabel>Tables</DropdownMenuLabel>
                {Object.entries(tableVariables).map(([tableName, table]) => (
                  <DropdownMenuSub key={table.id}>
                    <DropdownMenuSubTrigger className="flex items-center justify-between group">
                      <span>{tableName}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          useVariableStore.getState().deleteVariable(table.id);
                          toast(`Table "${tableName}" deleted`);
                        }}
                        className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-red-500 transition-colors mr-2"
                      >
                        <Trash className="h-3 w-3" />
                      </button>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {table.columns.map((column) => (
                        <DropdownMenuItem
                          key={column.value}
                          onSelect={() => onValueChange(column.value)}
                          className="flex items-center justify-between group"
                        >
                          <span>{column.name}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              useVariableStore
                                .getState()
                                .removeColumnFromTable(table.id, column.name);
                              toast(
                                `Column "${column.name}" deleted from table "${tableName}"`
                              );
                            }}
                            className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <Trash className="h-3 w-3" />
                          </button>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              onSelect={handleAddNewVariable}
              className="text-blue-400"
            >
              + Add new variable
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={handleCopyVariable}
          disabled={!value}
        >
          <Copy className="h-4 w-4" />
        </Button>
      </div>

      {/* Add the AddVariableDialog */}
      <AddVariableDialog
        open={isAddVariableDialogOpen}
        onOpenChange={setIsAddVariableDialogOpen}
        onAddVariable={handleVariableAdded}
        defaultType="intermediate"
        currentAgentId={agentId || ""}
      />
    </>
  );
};

export default VariableDropdown;
