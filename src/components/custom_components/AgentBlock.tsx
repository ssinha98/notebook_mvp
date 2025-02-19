import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { Variable } from "@/types/types";
import { Button } from "@/components/ui/button";
import AddVariableDialog from "@/components/custom_components/AddVariableDialog";
import { api } from "@/tools/api";
import { useSourceStore } from "@/lib/store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AgentBlockProps {
  blockNumber: number;
  variables: Array<Variable>;
  onAddVariable: (variable: Variable) => void;
  onOpenTools?: () => void;
  onSavePrompts: (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string,
    saveAsCsv: boolean
  ) => void;
  onProcessedPrompts?: (processedSystem: string, processedUser: string) => void;
  isProcessing: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
  onDeleteBlock: (blockNumber: number) => void;
  initialSystemPrompt?: string;
  initialUserPrompt?: string;
  initialSaveAsCsv?: boolean;
}

// Add this interface to define the ref methods
export interface AgentBlockRef {
  processBlock: () => Promise<boolean>;
}

// Convert component to use forwardRef
const AgentBlock = forwardRef<AgentBlockRef, AgentBlockProps>((props, ref) => {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isUserPromptOpen, setIsUserPromptOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    props.initialSystemPrompt || "You are a helpful assistant"
  );
  const [userPrompt, setUserPrompt] = useState(props.initialUserPrompt || "");
  // const [showOutput, setShowOutput] = useState(false);
  const [showOutput] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modelResponse, setModelResponse] = useState<string | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("none");
  const sources = useSourceStore((state) => state.sources) || {};
  const [saveAsCsv, setSaveAsCsv] = useState(props.initialSaveAsCsv || false);
  const [selectedModel, setSelectedModel] = useState<string>("");

  // Add null check for variables prop
  const variables = props.variables || [];

  // Add useEffect to update prompts when they change
  useEffect(() => {
    if (props.initialSystemPrompt !== undefined) {
      setSystemPrompt(props.initialSystemPrompt);
    }
    if (props.initialUserPrompt !== undefined) {
      setUserPrompt(props.initialUserPrompt);
    }
  }, [props.initialSystemPrompt, props.initialUserPrompt]);

  // Add useEffect to update saveAsCsv when it changes
  useEffect(() => {
    if (props.initialSaveAsCsv !== undefined) {
      setSaveAsCsv(props.initialSaveAsCsv);
    }
  }, [props.initialSaveAsCsv]);

  // Update handler to work with shadcn Select
  const handleVariableSelect = (value: string) => {
    if (value === "add_new" && props.onOpenTools) {
      props.onOpenTools();
    } else {
      setSelectedVariableId(value);
    }
  };

  // Helper function to format text with variables
  const formatTextWithVariables = (text: string) => {
    const regex = /{{(.*?)}}/g;
    const parts = [];
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const [fullMatch, varName] = match;
      const startIndex = match.index!;

      // Add text before the variable
      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex));
      }

      // Check if variable exists
      const varExists = variables.some((v) => v.name === varName.trim());

      // Add the variable part with appropriate styling
      parts.push(
        <span
          key={startIndex}
          className={varExists ? "font-bold text-blue-400" : "text-red-400"}
        >
          {fullMatch}
        </span>
      );

      lastIndex = startIndex + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length ? parts : text;
  };

  // Add function to process variables in text
  const processVariablesInText = (text: string): string => {
    const regex = /{{(.*?)}}/g;
    return text.replace(regex, (match, varName) => {
      const variable = variables.find((v) => v.name === varName.trim());
      return variable?.value || `no value saved to ${varName.trim()}`;
    });
  };

  // Update handleProcessBlock to handle single source
  const handleProcessBlock = async () => {
    try {
      props.onProcessingChange(true);
      const processedSystemPrompt = processVariablesInText(systemPrompt);
      const processedUserPrompt = processVariablesInText(userPrompt);

      let response;
      if (selectedSource && selectedSource !== "none" && sources[selectedSource]) {
        const sourceData = sources[selectedSource];
        response = await api.post("/api/call-model-with-source", {
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt,
          processed_data: sourceData.processedData,
          save_as_csv: saveAsCsv,
        });
      } else {
        response = await api.post("/api/call-model", {
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt,
          save_as_csv: saveAsCsv,
        });
      }

      if (response.success) {
        // Handle CSV download if present
        if (saveAsCsv && response.csv_content) {
          const blob = new Blob([response.csv_content], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = response.filename || "response.csv";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }

        setModelResponse(response.response);

        if (selectedVariableId) {
          const selectedVariable = variables.find(
            (v) => v.id === selectedVariableId
          );
          if (selectedVariable) {
            selectedVariable.value = response.response;
            props.onAddVariable(selectedVariable);
          }
        }

        if (props.onProcessedPrompts) {
          props.onProcessedPrompts(processedSystemPrompt, processedUserPrompt);
        }

        return true;
      } else {
        if (response.needs_api_key) {
          alert("Please add your own API key to continue using the service.");
        } else {
          console.error("Error from model:", response.response);
        }
        return false;
      }
    } catch (error) {
      console.error("Error processing block:", error);
      return false;
    } finally {
      props.onProcessingChange(false);
    }
  };

  const handleDeleteBlock = () => {
    if (typeof props.onDeleteBlock === "function") {
      props.onDeleteBlock(props.blockNumber);
    } else {
      console.error("onDeleteBlock is not properly defined");
    }
  };

  useImperativeHandle(ref, () => ({
    processBlock: handleProcessBlock,
  }));

  // Update the save functions to include saveAsCsv
  const handleSavePrompts = () => {
    props.onSavePrompts(props.blockNumber, systemPrompt, userPrompt, saveAsCsv);
  };

  return (
    <>
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">
              Block #{props.blockNumber}
            </h3>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Popover>
            <PopoverTrigger>
              <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
                ⚙️
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={handleDeleteBlock}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        {/* System Prompt Section */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer text-gray-300"
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
          >
            <span>System Prompt</span>
            <span className="transition-transform">
              {isSystemPromptOpen ? "▼" : "▶"}
            </span>
          </div>
          {isSystemPromptOpen && (
            <div className="mt-2">
              <textarea
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-gray-200"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <div className="preview mt-2 text-gray-300">
                {formatTextWithVariables(systemPrompt)}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setSystemPrompt("")}>
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    setIsSystemPromptOpen(false);
                    handleSavePrompts();
                    console.log(
                      `Saved Block ${props.blockNumber} System Prompt:`,
                      systemPrompt
                    );
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User Prompt Section */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer text-gray-300"
            onClick={() => setIsUserPromptOpen(!isUserPromptOpen)}
          >
            <span>User Prompt</span>
            <span className="transition-transform">
              {isUserPromptOpen ? "▼" : "▶"}
            </span>
          </div>
          {isUserPromptOpen && (
            <div className="mt-2">
              <textarea
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-gray-200"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />
              <div className="preview mt-2 text-gray-300">
                {formatTextWithVariables(userPrompt)}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setUserPrompt("")}>
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    setIsUserPromptOpen(false);
                    handleSavePrompts();
                    console.log(
                      `Saved Block ${props.blockNumber} User Prompt:`,
                      userPrompt
                    );
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-700 my-4" />

        <div className="flex items-center gap-2 text-gray-300 mb-4">
          <span>Source:</span>
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {Object.entries(sources || {}).map(([name, source]) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <span>Set output as:</span>
          <Select
            value={selectedVariableId}
            onValueChange={handleVariableSelect}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Variables" />
            </SelectTrigger>
            <SelectContent>
              {variables
                .filter((v) => v.type === "intermediate")
                .map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              <SelectItem value="add_new" className="text-blue-400">
                + Add new variable
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <hr className="border-gray-700 my-4" />

        <div className="mb-4">
          <h4 className="text-gray-300 mb-2">Save Output as</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={saveAsCsv}
                onChange={(e) => {
                  setSaveAsCsv(e.target.checked);
                  // Save the preference immediately when changed
                  props.onSavePrompts(
                    props.blockNumber,
                    systemPrompt,
                    userPrompt,
                    e.target.checked
                  );
                }}
                className="form-checkbox bg-gray-700 border-gray-600"
              />
              CSV
            </label>
          </div>
        </div>

        <div className="mt-4 flex justify-start">
          <Button
            className="flex items-center gap-2"
            onClick={handleProcessBlock}
            disabled={props.isProcessing}
          >
            {props.isProcessing ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Running...
              </>
            ) : (
              "Run Block"
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      {showOutput && (
        <div className="mt-2 pl-4 font-mono text-white text-sm opacity-75">
          <div>Block #{props.blockNumber} output:</div>
          <div className="mt-2 whitespace-pre-wrap">
            {processVariablesInText(systemPrompt)}
            {"\n\n"}
            {processVariablesInText(userPrompt)}
          </div>
        </div>
      )}
      {/* <AddVariableDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      onAddVariable={onAddVariable}
      defaultType="input"
    /> */}
      <AddVariableDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Reset the select value when dialog closes
            const select = document.querySelector(
              "select"
            ) as HTMLSelectElement;
            if (select) select.value = "";
          }
        }}
        onAddVariable={(variable) => {
          props.onAddVariable(variable);
          setIsDialogOpen(false);
        }}
        defaultType="intermediate"
      />

      {modelResponse && !props.isProcessing && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <h4 className="text-sm font-medium mb-2 text-gray-300">
            Model Response:
          </h4>
          <div className="text-sm text-gray-300 whitespace-pre-wrap">
            {modelResponse}
          </div>
          {selectedVariableId && (
            <div className="mt-2 text-sm text-green-400">
              Saved as{" "}
              {variables.find((v) => v.id === selectedVariableId)?.name}
            </div>
          )}
        </div>
      )}
    </>
  );
});

AgentBlock.displayName = "AgentBlock";

export default AgentBlock;
