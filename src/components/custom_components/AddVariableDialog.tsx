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
import { useVariableStore } from "@/lib/variableStore";
import {
  doc,
  setDoc,
  getFirestore,
  getDoc,
  collection,
} from "firebase/firestore";
import { auth } from "@/tools/firebase";

interface AddVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVariable: (variable: Variable) => void;
  defaultType?: "input" | "intermediate";
  currentAgentId: string;
}

const AddVariableDialog: React.FC<AddVariableDialogProps> = ({
  open,
  onOpenChange,
  onAddVariable,
  defaultType = "input",
  currentAgentId,
}) => {
  const [newVariable, setNewVariable] = useState<Variable>({
    id: crypto.randomUUID(),
    name: "",
    type: defaultType,
    agentId: currentAgentId,
  });

  const handleSaveVariable = async () => {
    if (!newVariable.name.trim()) return;

    console.log("Attempting to create variable with agentId:", currentAgentId);

    if (!currentAgentId) {
      console.error("No agent ID available");
      return;
    }

    const createdVariable = await useVariableStore
      .getState()
      .createVariable(newVariable.name, newVariable.type, currentAgentId, "");

    const variables = await useVariableStore
      .getState()
      .loadVariables(currentAgentId);
    console.log("Loaded variables:", variables);

    onAddVariable(createdVariable);

    onOpenChange(false);
    setNewVariable({
      id: crypto.randomUUID(),
      name: "kkkk",
      type: "intermediate",
      agentId: currentAgentId,
    });
  };

  const testFirebase = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const db = getFirestore();
      const newId = doc(collection(db, `users/${userId}/variables`)).id;

      const testDoc = {
        id: newId,
        name: "test variable",
        type: "input",
        value: "test value",
        created_at: new Date().toISOString(),
        userId,
        agentId: currentAgentId,
      };

      await setDoc(doc(db, `users/${userId}/variables`, newId), testDoc);
      console.log("Created with ID:", newId);
    } catch (error) {
      console.error("Test failed:", error);
      throw error;
    }
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
          {/* <Button onClick={testFirebase} variant="secondary">
            Test Firebase
          </Button> */}
          <Button onClick={handleSaveVariable}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddVariableDialog;
