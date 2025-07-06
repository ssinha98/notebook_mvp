import React, { useState, useMemo, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AddVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVariable: (variable: Variable) => void;
  defaultType?: "input" | "intermediate" | "table";
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
  const [tableName, setTableName] = useState("");
  const [columnName, setColumnName] = useState("");
  const [selectedTableId, setSelectedTableId] = useState("");
  const [newColumnName, setNewColumnName] = useState("");

  // Get tables once when dialog opens
  const tables = useMemo(
    () =>
      Object.values(useVariableStore.getState().variables).filter(
        (v) => v.type === "table"
      ),
    [open]
  );

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        const overlays = document.querySelectorAll(
          "[data-radix-dialog-overlay]"
        );
        overlays.forEach((overlay) => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        });

        const portals = document.querySelectorAll("[data-radix-dialog-portal]");
        portals.forEach((portal) => {
          if (portal.parentNode && portal.children.length === 0) {
            portal.parentNode.removeChild(portal);
          }
        });
      }, 50);
    }
  }, [open]);

  const handleSaveVariable = async () => {
    if (!currentAgentId) return;

    if (newVariable.type === "table") {
      if (!tableName.trim() || !columnName.trim()) return;

      let tableVar = Object.values(useVariableStore.getState().variables).find(
        (v) => v.name === tableName && v.type === "table"
      );

      if (!tableVar) {
        tableVar = await useVariableStore
          .getState()
          .createVariable(tableName, "table", currentAgentId, []);
      }

      await useVariableStore
        .getState()
        .addColumnToTable(tableVar.id, columnName);
      await useVariableStore.getState().loadVariables(currentAgentId);

      // Add delay before closing to prevent overlay issues
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } else {
      if (!newVariable.name.trim()) return;

      const createdVariable = await useVariableStore
        .getState()
        .createVariable(newVariable.name, newVariable.type, currentAgentId, "");

      onAddVariable(createdVariable);

      // Add delay before closing
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    }
  };

  const handleAddColumn = async () => {
    if (!selectedTableId || !newColumnName.trim()) return;

    try {
      await useVariableStore
        .getState()
        .addColumnToTable(selectedTableId, newColumnName);
      await useVariableStore.getState().loadVariables(currentAgentId);

      // Add delay before closing to prevent overlay issues
      setTimeout(() => {
        onOpenChange(false);
      }, 100);
    } catch (error) {
      console.error("Error adding column:", error);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset all form fields
    setNewVariable({
      id: crypto.randomUUID(),
      name: "",
      type: defaultType,
      agentId: currentAgentId,
    });
    setTableName("");
    setColumnName("");
    setSelectedTableId("");
    setNewColumnName("");
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
      <DialogContent className="bg-gray-800 z-[70]">
        <DialogHeader>
          <DialogTitle>Add New Variable</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="new-variable">
          <TabsList className="grid w-full grid-cols-2 bg-gray-700">
            <TabsTrigger
              value="new-variable"
              className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:bg-gray-600 data-[state=inactive]:text-gray-300 transition-colors"
            >
              New Variable
            </TabsTrigger>
            <TabsTrigger
              value="add-column"
              className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=inactive]:bg-gray-600 data-[state=inactive]:text-gray-300 transition-colors"
            >
              Add Column to Table
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new-variable" className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label>Variable Type</label>
                <select
                  className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200"
                  value={newVariable.type}
                  onChange={(e) =>
                    setNewVariable({
                      ...newVariable,
                      type: e.target.value as
                        | "input"
                        | "intermediate"
                        | "table",
                    })
                  }
                >
                  <option value="input">Input Variable</option>
                  <option value="intermediate">Intermediary Variable</option>
                  <option value="table">Table Variable</option>
                </select>
              </div>

              {newVariable.type === "table" ? (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="tableName">Table Name</label>
                    <Input
                      id="tableName"
                      value={tableName}
                      onChange={(e) => setTableName(e.target.value)}
                      placeholder="Enter table name"
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="columnName">Column Name</label>
                    <Input
                      id="columnName"
                      value={columnName}
                      onChange={(e) => setColumnName(e.target.value)}
                      placeholder="Enter column name"
                    />
                  </div>
                </>
              ) : (
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
              )}

              <Button
                onClick={handleSaveVariable}
                disabled={
                  newVariable.type === "table"
                    ? !tableName || !columnName
                    : !newVariable.name
                }
              >
                Done
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="add-column" className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label>Select Table</label>
                <div className="bg-gray-700 border border-gray-600 rounded">
                  <select
                    className="w-full px-2 py-1 text-gray-200 bg-transparent"
                    value={selectedTableId}
                    onChange={(e) => setSelectedTableId(e.target.value)}
                  >
                    <option value="">Select a table...</option>
                    {tables.map((table) => (
                      <option key={table.id} value={table.id}>
                        {table.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="newColumnName">New Column Name</label>
                <Input
                  id="newColumnName"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  placeholder="Enter new column name"
                />
              </div>
              <Button
                onClick={handleAddColumn}
                disabled={!selectedTableId || !newColumnName.trim()}
              >
                Add Column
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddVariableDialog;
