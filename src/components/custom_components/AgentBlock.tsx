import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Variable } from "@/types/types";
import { Button } from "@/components/ui/button";
import AddVariableDialog from "@/components/custom_components/AddVariableDialog";
import { api } from "@/tools/api";
import { useSourceStore } from "@/lib/store";

interface AgentBlockProps {
  blockNumber: number;
  variables: Array<Variable>;
  onAddVariable: (variable: Variable) => void;
  onOpenTools?: () => void;
  onSavePrompts: (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string
  ) => void;
  onProcessedPrompts?: (processedSystem: string, processedUser: string) => void;
  isProcessing: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
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
    "You are a helpful assistant"
  );
  const [userPrompt, setUserPrompt] = useState("");
  // const [showOutput, setShowOutput] = useState(false);
  const [showOutput] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modelResponse, setModelResponse] = useState<string | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>("");
  const sources = useSourceStore((state) => state.sources) || {};

  // Add null check for variables prop
  const variables = props.variables || [];

  const handleVariableSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "add_new" && props.onOpenTools) {
      props.onOpenTools();
      e.target.value = "";
    } else {
      setSelectedVariableId(e.target.value);
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
      if (selectedSource && sources[selectedSource]) {
        const sourceData = sources[selectedSource];
        response = await api.post("/api/call-model-with-source", {
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt,
          processed_data: sourceData.processedData,
        });
      } else {
        response = await api.post("/api/call-model", {
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt,
        });
      }

      if (response.success) {
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

  useImperativeHandle(ref, () => ({
    processBlock: handleProcessBlock,
  }));

  return (
    <>
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">
              Block #{props.blockNumber}
            </h3>
            <select className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-200">
              <option value="" disabled selected>
                Select model
              </option>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-3.5">GPT-3.5</option>
            </select>
          </div>
          <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
            ⚙️
          </span>
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
                    props.onSavePrompts(
                      props.blockNumber,
                      systemPrompt,
                      userPrompt
                    );
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
                    props.onSavePrompts(
                      props.blockNumber,
                      systemPrompt,
                      userPrompt
                    );
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
          <select
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1"
            value={selectedSource}
            onChange={(e) => {
              setSelectedSource(e.target.value);
              if (e.target.value && sources[e.target.value]) {
                const preview = sources[
                  e.target.value
                ].processedData?.substring(0, 100);
                console.log(
                  `Source preview for ${e.target.value}:`,
                  preview ? `${preview}...` : "No processed data available"
                );
              }
            }}
          >
            <option value="">None</option>
            {Object.entries(sources || {}).map(([name, source]) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <span>Set output as:</span>
          <select
            className="bg-gray-700 border border-gray-600 rounded px-2 py-1"
            onChange={handleVariableSelect}
          >
            <option value="" disabled selected>
              Variables
            </option>
            {variables
              .filter((v) => v.type === "intermediate")
              .map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            <option disabled className="bg-gray-800 text-gray-500 h-px my-1">
              ───────────────
            </option>
            <option value="add_new" className="text-blue-400">
              + Add new variable
            </option>
          </select>
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
