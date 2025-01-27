import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Variable } from "@/types/types";

interface AddVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVariable: (variable: Variable) => void;
  defaultType?: "input" | "intermediate";
}

const AddVariableDialog: React.FC<AddVariableDialogProps> = ({
  open,
  onOpenChange,
  onAddVariable,
  defaultType = "input",
}) => {
  const [newVariable, setNewVariable] = useState<Variable>({
    id: crypto.randomUUID(),
    name: "",
    type: defaultType,
  });

  const handleSaveVariable = () => {
    if (!newVariable.name.trim()) return;

    onAddVariable(newVariable);

    onOpenChange(false);
    setNewVariable({ id: crypto.randomUUID(), name: "", type: defaultType });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[2000] bg-gray-800">
        <DialogHeader>
          <DialogTitle>Add New Variable</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="name">Variable Name</label>
            <Input
              id="name"
              value={newVariable.name}
              onChange={(e) =>
                setNewVariable({ ...newVariable, name: e.target.value })
              }
              placeholder="Enter variable name"
            />
          </div>
          <div className="grid gap-2">
            <label>Variable Type</label>
            <select
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
              value={newVariable.type}
              onChange={(e) =>
                setNewVariable({
                  ...newVariable,
                  type: e.target.value as "input" | "intermediate",
                })
              }
            >
              <option value="input">Input Variable</option>
              <option value="intermediate">Intermediary Variable</option>
            </select>
          </div>
          <Button onClick={handleSaveVariable}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVariableDialog;
