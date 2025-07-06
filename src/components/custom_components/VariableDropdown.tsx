import React from "react";
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
import { Copy, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useVariableStore } from "@/lib/variableStore";
import { Variable, TableVariable } from "@/types/types";

type CombinedVariable = Variable | TableVariable;

interface VariableDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  agentId?: string | null;
  onAddNew?: () => void;
  className?: string;
  excludeTableVariables?: boolean;
}

const VariableDropdown: React.FC<VariableDropdownProps> = ({
  value,
  onValueChange,
  agentId,
  onAddNew,
  className = "",
  excludeTableVariables = false,
}) => {
  const variables = useVariableStore((state) => state.variables);

  const handleCopyVariable = () => {
    if (value) {
      // Check if it's a table column selection (contains ':')
      if (value.includes(":") && !excludeTableVariables) {
        const [tableId, columnName] = value.split(":");
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
        (v) => v.id === value
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

    // Check if it's a table column selection (contains ':')
    if (value.includes(":") && !excludeTableVariables) {
      const [tableId, columnName] = value.split(":");
      const tableVar = Object.values(variables).find((v) => v.id === tableId);
      if (tableVar && tableVar.type === "table") {
        return `${tableVar.name}.${columnName}`;
      }
    }

    const variable = Object.values(variables).find((v) => v.id === value);
    if (!variable) return "Select variable";
    return variable.name;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-[180px] justify-between">
            {getSelectedName()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[180px]">
          {intermediateVariables.length > 0 && (
            <>
              <DropdownMenuLabel>Intermediate Variables</DropdownMenuLabel>
              {intermediateVariables.map((v) => (
                <DropdownMenuItem
                  key={v.id}
                  onSelect={() => onValueChange(v.id)}
                >
                  {v.name}
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
                  <DropdownMenuSubTrigger>{tableName}</DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    {table.columns.map((column) => (
                      <DropdownMenuItem
                        key={column.value}
                        onSelect={() => onValueChange(column.value)}
                      >
                        {column.name}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          {onAddNew && (
            <DropdownMenuItem onSelect={onAddNew} className="text-blue-400">
              + Add new variable
            </DropdownMenuItem>
          )}
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
  );
};

export default VariableDropdown;
