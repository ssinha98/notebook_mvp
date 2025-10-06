import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { toast } from "sonner";

interface VariableInputDialogProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function VariableInputDialog({
  onComplete,
  onCancel,
}: VariableInputDialogProps) {
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [savingVariable, setSavingVariable] = useState<string | null>(null);

  const variables = useVariableStore((state) => state.variables);
  const updateVariable = useVariableStore((state) => state.updateVariable);
  const currentAgent = useAgentStore((state) => state.currentAgent);

  // Get only input variables for the current agent
  const inputVariables = Object.values(variables).filter(
    (variable) =>
      variable.type === "input" && variable.agentId === currentAgent?.id
  );

  // Initialize variable values from store - only run once when component mounts
  useEffect(() => {
    const initialValues: Record<string, string> = {};
    inputVariables.forEach((variable) => {
      initialValues[variable.id] =
        typeof variable.value === "string" ? variable.value : "";
    });
    setVariableValues(initialValues);
  }, []); // Empty dependency array - only run once

  // Focus first input - only run once when component mounts
  useEffect(() => {
    if (inputVariables.length > 0) {
      setTimeout(() => {
        const firstInput = document.getElementById(inputVariables[0].id);
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
    }
  }, []); // Empty dependency array - only run once

  const handleVariableChange = (variableId: string, value: string) => {
    setVariableValues((prev) => ({
      ...prev,
      [variableId]: value,
    }));
  };

  const handleSaveVariable = async (variableId: string) => {
    const variable = variables[variableId];
    if (!variable) return;

    const value = variableValues[variableId] || "";
    setSavingVariable(variableId);

    try {
      await updateVariable(variableId, value);
      toast.success(`"${variable.name}" saved as "${value}"`);
    } catch (error) {
      console.error("Error saving variable:", error);
      toast.error(`Failed to save variable "${variable.name}"`);
    } finally {
      setSavingVariable(null);
    }
  };

  const handleSaveAllVariables = async () => {
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const variable of inputVariables) {
        const value = variableValues[variable.id] || "";
        try {
          await updateVariable(variable.id, value);
          toast.success(`"${variable.name}" saved as "${value}"`);
          successCount++;
        } catch (error) {
          console.error(`Error saving variable ${variable.name}:`, error);
          errorCount++;
        }
      }

      if (errorCount === 0) {
        toast.success(`All ${successCount} variables saved successfully!`);
      } else {
        toast.warning(`${successCount} variables saved, ${errorCount} failed`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    setIsLoading(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Save all variables before continuing
      for (const variable of inputVariables) {
        const value = variableValues[variable.id] || "";
        try {
          await updateVariable(variable.id, value);
          toast.success(`"${variable.name}" saved as "${value}"`);
          successCount++;
        } catch (error) {
          console.error(`Error saving variable ${variable.name}:`, error);
          errorCount++;
        }
      }

      // Show summary toast message
      if (errorCount === 0) {
        toast.success(`All ${successCount} variables saved successfully!`);
      } else {
        toast.warning(`${successCount} variables saved, ${errorCount} failed`);
      }

      // Only call onComplete if at least some variables were saved successfully
      if (successCount > 0) {
        onComplete();
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (inputVariables.length === 0) {
    return (
      <AlertDialog open={true} onOpenChange={(open) => !open && onCancel()}>
        <AlertDialogContent className="sm:max-w-[600px] bg-black border border-gray-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Configure Input Variables
            </AlertDialogTitle>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="text-center py-8 text-gray-500">
              <p>No input variables configured for this agent</p>
              <p className="text-sm mt-1">
                Add input variables to configure your agent flow
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <Button variant="outline" onClick={onCancel}>
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="sm:max-w-[600px] bg-black border border-gray-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Configure Input Variables
          </AlertDialogTitle>
        </AlertDialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Set values for your input variables. These values will be used when
            running your agent.
          </p>

          <div className="space-y-4">
            {inputVariables.map((variable) => (
              <div key={variable.id} className="space-y-2">
                <Label htmlFor={variable.id} className="text-white font-medium">
                  {variable.name}
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={variable.id}
                    type="text"
                    placeholder={`Enter value for ${variable.name}`}
                    value={variableValues[variable.id] || ""}
                    onChange={(e) =>
                      handleVariableChange(variable.id, e.target.value)
                    }
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                    autoFocus={inputVariables[0]?.id === variable.id}
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSaveVariable(variable.id)}
                    disabled={savingVariable === variable.id}
                    className="bg-green-600 hover:bg-green-700 text-white min-w-[80px]"
                  >
                    {savingVariable === variable.id ? (
                      <div className="flex items-center gap-1">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                        Saving...
                      </div>
                    ) : (
                      "Save"
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AlertDialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleSaveAllVariables}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving All...
                </div>
              ) : (
                "Save All Variables"
              )}
            </Button>
            <Button onClick={handleContinue} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving & Continuing...
                </div>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
