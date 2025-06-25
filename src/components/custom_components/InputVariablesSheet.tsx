import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Settings, Check, Trash2 } from "lucide-react";
import { Variable } from "@/types/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import AddVariableDialog from "@/components/custom_components/AddVariableDialog";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface InputVariablesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVariable: (variable: Variable) => void;
}

const InputVariablesSheet: React.FC<InputVariablesSheetProps> = ({
  open,
  onOpenChange,
  onAddVariable,
}) => {
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
  const [manualVariableValues, setManualVariableValues] = useState<
    Record<string, string>
  >({});
  const [confirmedValues, setConfirmedValues] = useState<
    Record<string, string>
  >({});
  const [editingValues, setEditingValues] = useState<Record<string, string>>(
    {}
  );
  const [scheduledConfirmedValues, setScheduledConfirmedValues] = useState<
    Record<string, string>
  >({});
  const [scheduledEditingValues, setScheduledEditingValues] = useState<
    Record<string, string>
  >({});
  const variables = useVariableStore((state) => state.variables);
  const currentAgent = useAgentStore((state) => state.currentAgent);
  const router = useRouter();

  useEffect(() => {
    const currentAgentId = useAgentStore.getState().currentAgent?.id;
    if (currentAgentId) {
      useVariableStore.getState().loadVariables(currentAgentId);
    }
  }, []);

  const handleAddVariable = () => {
    setIsVariableDialogOpen(true);
  };

  const handleConfigureInbox = () => {
    router.push("/settings");
  };

  const handleManualVariableChange = (variableName: string, value: string) => {
    setEditingValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const handleConfirmValue = (variableName: string) => {
    const value = editingValues[variableName] || "";
    setConfirmedValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));
    setManualVariableValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));

    // Update the variable value in the store
    const variable = Object.values(variables).find(
      (v) => v.name === variableName
    );
    if (variable) {
      useVariableStore.getState().updateVariable(variable.id, value);
    }
  };

  const handleScheduledVariableChange = (
    variableName: string,
    value: string
  ) => {
    setScheduledEditingValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));
  };

  const handleScheduledConfirmValue = (variableName: string) => {
    const value = scheduledEditingValues[variableName] || "";
    setScheduledConfirmedValues((prev) => ({
      ...prev,
      [variableName]: value,
    }));

    // Update the variable value in the store
    const variable = Object.values(variables).find(
      (v) => v.name === variableName
    );
    if (variable) {
      useVariableStore.getState().updateVariable(variable.id, value);
    }
  };

  const handleDeleteVariable = (variableName: string) => {
    const variable = Object.values(variables).find(
      (v) => v.name === variableName
    );
    if (variable) {
      useVariableStore.getState().deleteVariable(variable.id);
      toast(`Variable "${variableName}" deleted`, {
        action: {
          label: "Close",
          onClick: () => toast.dismiss(),
        },
      });
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[66vh] bg-[#1e1e1e] border-t border-[#333] rounded-t-2xl"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Input Variables & Configuration
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content area */}
          <div className="overflow-y-auto flex-1 mb-[60px]">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800 p-1 rounded-lg">
                <TabsTrigger
                  value="manual"
                  className="text-white data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  Manual
                </TabsTrigger>
                <TabsTrigger
                  value="email"
                  className="text-white data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  Email/Slack/Teams
                </TabsTrigger>
                <TabsTrigger
                  value="scheduled"
                  className="text-white data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  Scheduled
                </TabsTrigger>
                <TabsTrigger
                  value="api"
                  className="text-white data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm rounded-md transition-all duration-200"
                >
                  API
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="mt-6">
                <div className="space-y-6">
                  {/* Manual Configuration Content */}
                  <div>
                    <h3 className="font-semibold text-white mb-4">
                      Manual Configuration
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Set values for your input variables manually. These values
                      will be used when you manually trigger your agent.
                    </p>
                  </div>

                  {/* Input Variables Section */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <h3 className="font-semibold text-white">
                          Input Variables
                        </h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddVariable}
                      >
                        Add Variable
                      </Button>
                    </div>

                    {Object.values(variables).filter((v) => v.type === "input")
                      .length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-white">
                              Variable Name
                            </TableHead>
                            <TableHead className="text-white">Value</TableHead>
                            <TableHead className="text-white w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(variables)
                            .filter((v) => v.type === "input")
                            .map((variable, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-white font-medium">
                                  <span
                                    className="cursor-pointer hover:text-blue-400 transition-colors"
                                    onClick={() => {
                                      navigator.clipboard.writeText(
                                        `{{${variable.name}}}`
                                      );
                                      toast(
                                        `{{${variable.name}}} copied to clipboard`,
                                        {
                                          action: {
                                            label: "Close",
                                            onClick: () => toast.dismiss(),
                                          },
                                        }
                                      );
                                    }}
                                  >
                                    {variable.name}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder={`Enter value for ${variable.name}`}
                                      value={editingValues[variable.name] || ""}
                                      onChange={(e) =>
                                        handleManualVariableChange(
                                          variable.name,
                                          e.target.value
                                        )
                                      }
                                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleConfirmValue(variable.name)
                                      }
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Confirm
                                    </Button>
                                  </div>
                                  {confirmedValues[variable.name] && (
                                    <div className="mt-1 text-xs text-green-400">
                                      Confirmed:{" "}
                                      {confirmedValues[variable.name]}
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Popover>
                                    <PopoverTrigger>
                                      <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300 cursor-pointer" />
                                    </PopoverTrigger>
                                    <PopoverContent className="w-40 p-0 bg-black border border-red-500">
                                      <button
                                        className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                                        onClick={() =>
                                          handleDeleteVariable(variable.name)
                                        }
                                      >
                                        Delete Variable
                                      </button>
                                    </PopoverContent>
                                  </Popover>
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No input variables configured</p>
                        <p className="text-sm">
                          Add variables to configure your agent flow
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="email" className="mt-6">
                <div className="space-y-6">
                  {/* Email Configuration Content */}
                  <div>
                    <h3 className="font-semibold text-white mb-4">
                      Email Configuration
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Your agent will pass in variables based on the emails they
                      receive to the connected inbox. To ensure most reliable
                      results, make it clear which values match up to which
                      variables.
                    </p>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm italic mb-2">
                        Example
                      </p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-white">
                              Variable Name
                            </TableHead>
                            <TableHead className="text-white">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-gray-300">
                              company_name
                            </TableCell>
                            <TableCell className="text-gray-300 italic">
                              RoxOn Corp
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleConfigureInbox}
                    >
                      Configure your agent's inbox
                    </Button>
                  </div>

                  {/* Input Variables Section */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <h3 className="font-semibold text-white">
                          Input Variables
                        </h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddVariable}
                      >
                        Add Variable
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {Object.values(variables)
                        .filter((v) => v.type === "input")
                        .map((variable, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700"
                          >
                            <div>
                              <span className="text-white font-medium">
                                {variable.name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-green-400 border-green-400"
                            >
                              Input
                            </Badge>
                          </div>
                        ))}
                      {Object.values(variables).filter(
                        (v) => v.type === "input"
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No input variables configured</p>
                          <p className="text-sm">
                            Add variables to configure your agent flow
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="scheduled" className="mt-6">
                <div className="space-y-6">
                  {/* Scheduled Configuration Content */}
                  <div>
                    <h3 className="font-semibold text-white mb-4">
                      Scheduled Configuration
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Give your scheduled agents all the input values before
                      they're scheduled to run.
                    </p>
                  </div>

                  {/* Input Variables Section */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <h3 className="font-semibold text-white">
                          Input Variables
                        </h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddVariable}
                      >
                        Add Variable
                      </Button>
                    </div>

                    {Object.values(variables).filter((v) => v.type === "input")
                      .length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-white">
                              Variable Name
                            </TableHead>
                            <TableHead className="text-white">Value</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(variables)
                            .filter((v) => v.type === "input")
                            .map((variable, index) => (
                              <TableRow key={index}>
                                <TableCell className="text-white font-medium">
                                  {variable.name}
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Input
                                      type="text"
                                      placeholder={`Enter value for ${variable.name}`}
                                      value={
                                        scheduledEditingValues[variable.name] ||
                                        ""
                                      }
                                      onChange={(e) =>
                                        handleScheduledVariableChange(
                                          variable.name,
                                          e.target.value
                                        )
                                      }
                                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                                    />
                                    <Button
                                      size="sm"
                                      onClick={() =>
                                        handleScheduledConfirmValue(
                                          variable.name
                                        )
                                      }
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Confirm
                                    </Button>
                                  </div>
                                  {scheduledConfirmedValues[variable.name] && (
                                    <div className="mt-1 text-xs text-green-400">
                                      Confirmed:{" "}
                                      {scheduledConfirmedValues[variable.name]}
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No input variables configured</p>
                        <p className="text-sm">
                          Add variables to configure your agent flow
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="api" className="mt-6">
                <div className="space-y-6">
                  {/* API Configuration Content */}
                  <div>
                    <h3 className="font-semibold text-white mb-4">
                      API Configuration
                    </h3>
                    <p className="text-gray-300 text-sm mb-4">
                      Pass your agent variables via the endpoint.
                    </p>

                    <div className="mb-4">
                      <p className="text-gray-400 text-sm italic mb-2">
                        Example
                      </p>
                      <div className="bg-gray-900 p-4 rounded border border-gray-700">
                        <code className="text-green-400 text-sm">
                          {`curl -X POST https://usesolari.ai/api/agents/${currentAgent?.id} \\
  -H "Content-Type: application/json" \\
  -d '{"company_name": "RoxOn Corp"}'`}
                        </code>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => {
                        const endpoint = `POST https://usesolari.ai/api/agents/${currentAgent?.id}`;
                        navigator.clipboard.writeText(endpoint);
                        toast("API endpoint copied to clipboard", {
                          action: {
                            label: "Close",
                            onClick: () => toast.dismiss(),
                          },
                        });
                      }}
                    >
                      Copy API endpoint
                    </Button>
                  </div>

                  {/* Input Variables Section */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <h3 className="font-semibold text-white">
                          Input Variables
                        </h3>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddVariable}
                      >
                        Add Variable
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {Object.values(variables)
                        .filter((v) => v.type === "input")
                        .map((variable, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-800 rounded border border-gray-700"
                          >
                            <div>
                              <span className="text-white font-medium">
                                {variable.name}
                              </span>
                            </div>
                            <Badge
                              variant="outline"
                              className="text-green-400 border-green-400"
                            >
                              Input
                            </Badge>
                          </div>
                        ))}
                      {Object.values(variables).filter(
                        (v) => v.type === "input"
                      ).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No input variables configured</p>
                          <p className="text-sm">
                            Add variables to configure your agent flow
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-6 left-6 flex gap-2">
            <Button variant="default" onClick={() => onOpenChange(false)}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <AddVariableDialog
        open={isVariableDialogOpen}
        onOpenChange={setIsVariableDialogOpen}
        onAddVariable={onAddVariable}
        defaultType="input"
        currentAgentId={currentAgent?.id || ""}
      />
    </>
  );
};

export default InputVariablesSheet;
