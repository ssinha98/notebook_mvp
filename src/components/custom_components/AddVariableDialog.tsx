import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import Image from "next/image";
import { Info } from "lucide-react";

interface AddVariableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVariable: (variable: Variable) => void;
  defaultType?: "input" | "intermediate" | "table";
  currentAgentId: string;
  defaultTab?: "new-variable" | "add-column"; // Add this prop
  preSelectedTableId?: string; // Add this prop
}

const AddVariableDialog: React.FC<AddVariableDialogProps> = ({
  open,
  onOpenChange,
  onAddVariable,
  defaultType = "intermediate",
  currentAgentId,
  defaultTab = "new-variable", // Default to new-variable tab
  preSelectedTableId = "", // Default to empty string
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
  const [isMainOutput, setIsMainOutput] = useState(false); // Add this line
  const [isLoading, setIsLoading] = useState(false); // Add loading state

  // Get tables once when dialog opens
  const tables = useMemo(
    () =>
      Object.values(useVariableStore.getState().variables).filter(
        (v) => v.type === "table"
      ),
    [open]
  );

  // Set pre-selected table when dialog opens
  useEffect(() => {
    if (open && preSelectedTableId) {
      setSelectedTableId(preSelectedTableId);
    }
  }, [open, preSelectedTableId]);

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
    try {
      setIsLoading(true); // Start loading

      if (!currentAgentId) {
        console.error("No current agent ID");
        return;
      }

      if (newVariable.type === "table") {
        if (!tableName.trim() || !columnName.trim()) {
          console.error("Table name and column name are required");
          return;
        }

        let tableVar = Object.values(
          useVariableStore.getState().variables
        ).find((v) => v.name === tableName && v.type === "table");

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
        if (!newVariable.name.trim()) {
          console.error("Variable name is required");
          return;
        }

        // Create variable with mainOutput flag
        const variableData = {
          name: newVariable.name,
          type: newVariable.type,
          agentId: currentAgentId,
          initialValue: "",
          mainOutput:
            newVariable.type === "intermediate" ? isMainOutput : false, // Add this line
        };

        const createdVariable = await useVariableStore
          .getState()
          .createVariable(
            newVariable.name,
            newVariable.type,
            currentAgentId,
            "",
            isMainOutput // Just pass the checkbox value directly
          );

        // Update the created variable with mainOutput flag
        if (variableData.mainOutput) {
          await useVariableStore
            .getState()
            .updateVariable(createdVariable.id, createdVariable.value);
          // Note: We'll need to update the variable store to handle mainOutput flag
        }

        onAddVariable(createdVariable);
        await useVariableStore.getState().loadVariables(currentAgentId);

        // Add delay before closing
        setTimeout(() => {
          onOpenChange(false);
        }, 100);
      }
    } catch (error) {
      console.error("Error saving variable:", error);
      // You might want to show an error message to the user here
    } finally {
      setIsLoading(false); // Stop loading regardless of success/failure
    }
  };

  const handleAddColumn = async () => {
    try {
      setIsLoading(true); // Start loading

      if (!selectedTableId || !newColumnName.trim()) return;

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
    } finally {
      setIsLoading(false); // Stop loading regardless of success/failure
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
    setIsMainOutput(false); // Add this line
    setIsLoading(false); // Reset loading state
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
        <Tabs defaultValue={defaultTab}>
          {" "}
          {/* Use the defaultTab prop */}
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
                <div className="flex items-center gap-2">
                  <label>Variable Type</label>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Info className="h-4 w-4 text-gray-500 hover:text-gray-700 cursor-help" />
                    </HoverCardTrigger>
                    <HoverCardContent
                      className="w-96 z-[100] bg-white dark:bg-gray-800 border shadow-xl"
                      side="top"
                      sideOffset={10}
                      avoidCollisions={true}
                      collisionPadding={20}
                    >
                      <div className="flex flex-col space-y-3">
                        <Image
                          src={
                            newVariable.type === "table"
                              ? "/table_variable_example.gif"
                              : "/single_variable_example.gif"
                          }
                          alt={`${newVariable.type} Variable Example`}
                          width={350}
                          height={250}
                          unoptimized
                          className="rounded-md"
                        />
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold">
                            {newVariable.type === "input" && "Input Variable"}
                            {newVariable.type === "intermediate" &&
                              "Intermediary Variable"}
                            {newVariable.type === "table" && "Table Variable"}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {newVariable.type === "input" &&
                              "Variables that you can set before running your agent. Perfect for customizing prompts or data inputs."}
                            {newVariable.type === "intermediate" &&
                              "Best for passing single values from one block to another. Your variable name will be replaced with the value set by a previous block"}
                            {newVariable.type === "table" &&
                              "Creates a table comprised of rows and columns. Ideal for passing multiple values from one block to another, and producing a table as your output"}
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                <Select
                  value={newVariable.type}
                  onValueChange={(value) =>
                    setNewVariable({
                      ...newVariable,
                      type: value as "input" | "intermediate" | "table",
                    })
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200">
                    <SelectValue placeholder="Select variable type" />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    <SelectItem value="input">Input Variable</SelectItem>
                    <SelectItem value="intermediate">
                      Intermediary Variable
                    </SelectItem>
                    <SelectItem value="table">Table Variable</SelectItem>
                  </SelectContent>
                </Select>
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
                <>
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

                  {/* Add Main Output checkbox for intermediate variables */}
                  {newVariable.type === "intermediate" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mainOutput"
                        checked={isMainOutput}
                        onCheckedChange={(checked) =>
                          setIsMainOutput(checked as boolean)
                        }
                      />
                      <label
                        htmlFor="mainOutput"
                        className="text-sm text-gray-300 cursor-pointer"
                      >
                        Main output
                      </label>
                    </div>
                  )}
                </>
              )}

              <Button
                onClick={handleSaveVariable}
                disabled={
                  isLoading ||
                  (newVariable.type === "table"
                    ? !tableName || !columnName
                    : !newVariable.name)
                }
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </div>
                ) : (
                  "Done"
                )}
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="add-column" className="py-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <label>Select Table</label>
                <Select
                  value={selectedTableId}
                  onValueChange={setSelectedTableId}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-gray-200">
                    <SelectValue placeholder="Select a table..." />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                disabled={
                  isLoading || !selectedTableId || !newColumnName.trim()
                }
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Adding...
                  </div>
                ) : (
                  "Add Column"
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AddVariableDialog;
