import React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useVariableStore } from "@/lib/variableStore";

interface VariableDropdownProps {
  value: string;
  onValueChange: (value: string) => void;
  agentId?: string | null;
  onAddNew?: () => void;
  className?: string;
}

const VariableDropdown: React.FC<VariableDropdownProps> = ({
  value,
  onValueChange,
  agentId,
  onAddNew,
  className = "",
}) => {
  const variables = useVariableStore((state) => state.variables);

  const handleCopyVariable = () => {
    if (value) {
      const selectedVariable = (
        Array.isArray(variables) ? variables : Object.values(variables)
      ).find((v: any) => v.id === value);

      if (selectedVariable) {
        const variableText = `{{${selectedVariable.name}}}`;
        navigator.clipboard.writeText(variableText);
        toast(`{{${selectedVariable.name}}} copied to clipboard`, {
          action: {
            label: "Close",
            onClick: () => toast.dismiss(),
          },
        });
      }
    }
  };

  const filteredVariables = (
    Array.isArray(variables) ? variables : Object.values(variables)
  ).filter((v: any) => {
    const isIntermediate = v.type === "intermediate";
    // Only filter by agentId if it's provided and not null
    if (agentId) {
      return isIntermediate && v.agentId === agentId;
    }
    return isIntermediate;
  });

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Variables" />
        </SelectTrigger>
        <SelectContent>
          {filteredVariables.map((v: any) => (
            <SelectItem key={v.id} value={v.id}>
              {v.name}
            </SelectItem>
          ))}
          {onAddNew && (
            <SelectItem value="add_new" className="text-blue-400">
              + Add new variable
            </SelectItem>
          )}
        </SelectContent>
      </Select>
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
