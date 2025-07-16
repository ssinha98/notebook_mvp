import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Image from "next/image";
import { api } from "@/tools/api";
import { Variable } from "@/types/types";
import { Settings } from "lucide-react";
import { useVariableStore } from "@/lib/variableStore";
import VariableDropdown from "./VariableDropdown";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";

interface MakeBlockProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onUpdateBlock: (blockNumber: number, updates: any) => void;
  onAddVariable: (variable: Variable) => void;
  variables: Variable[];
  initialWebhookUrl?: string;
  initialParameters?: Array<{ key: string; value: string }>;
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate";
  } | null;
  isProcessing?: boolean;
  onOpenTools?: () => void;
}

export interface MakeBlockRef {
  processBlock: () => Promise<boolean>;
}

const MakeBlock = forwardRef<MakeBlockRef, MakeBlockProps>((props, ref) => {
  const [webhookUrl, setWebhookUrl] = useState(props.initialWebhookUrl || "");
  const [parameters, setParameters] = useState<
    Array<{ key: string; value: string }>
  >(props.initialParameters || [{ key: "", value: "" }]);
  const [selectedVariableId, setSelectedVariableId] = useState<string | null>(
    props.initialOutputVariable?.id || null
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentAgent = useAgentStore((state) => state.currentAgent);

  // Add store hook for updating block names
  const { updateBlockName } = useSourceStore();

  // Get current block to display its name
  const currentBlock = useSourceStore((state) =>
    state.blocks.find((block) => block.blockNumber === props.blockNumber)
  );

  // Helper function to interpolate variables in a string
  const interpolateVariables = (text: string): string => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
      const variable = useVariableStore
        .getState()
        .getVariableByName(varName.trim());
      return variable?.value?.toString() || match;
    });
  };

  const handleParameterChange = (
    index: number,
    field: "key" | "value",
    value: string
  ) => {
    const newParameters = [...parameters];
    newParameters[index][field] = value;
    setParameters(newParameters);

    // Only add a new row if this is the last row and both key and value are non-empty
    if (
      index === parameters.length - 1 &&
      newParameters[index].key.trim() !== "" &&
      newParameters[index].value.trim() !== ""
    ) {
      handleAddRow();
    }

    // Update block data
    const selectedVariable = props.variables.find(
      (v) => v.id === selectedVariableId
    );
    props.onUpdateBlock(props.blockNumber, {
      webhookUrl,
      parameters: newParameters,
      outputVariable: selectedVariable
        ? {
            id: selectedVariable.id,
            name: selectedVariable.name,
            type: "intermediate",
          }
        : null,
    });
  };

  const handleWebhookUrlChange = (newUrl: string) => {
    setWebhookUrl(newUrl);
    props.onUpdateBlock(props.blockNumber, {
      webhookUrl: newUrl,
      parameters,
      outputVariable: props.variables.find((v) => v.id === selectedVariableId)
        ? {
            id: selectedVariableId!,
            name: props.variables.find((v) => v.id === selectedVariableId)!
              .name,
            type: "intermediate",
          }
        : null,
    });
  };

  const handleVariableSelect = (value: string) => {
    if (value === "add_new" && props.onOpenTools) {
      props.onOpenTools();
    } else {
      setSelectedVariableId(value || null);
      if (value) {
        // Handle both regular variables and table columns
        if (value.includes(":")) {
          // Table column selection - for now just use the table ID
          const [tableId] = value.split(":");
          const selectedVariable = props.variables.find(
            (v) => v.id === tableId
          );
          if (selectedVariable) {
            props.onUpdateBlock(props.blockNumber, {
              webhookUrl,
              parameters,
              outputVariable: {
                id: selectedVariable.id,
                name: selectedVariable.name,
                type: "intermediate",
              },
            });
          }
        } else {
          // Regular variable selection
          const selectedVariable = props.variables.find((v) => v.id === value);
          if (selectedVariable) {
            props.onUpdateBlock(props.blockNumber, {
              webhookUrl,
              parameters,
              outputVariable: {
                id: selectedVariable.id,
                name: selectedVariable.name,
                type: "intermediate",
              },
            });
          }
        }
      }
    }
  };

  const handleClear = () => {
    setWebhookUrl("");
    setParameters([{ key: "", value: "" }]);
    setSelectedVariableId(null);
    props.onUpdateBlock(props.blockNumber, {
      webhookUrl: "",
      parameters: [{ key: "", value: "" }],
      outputVariable: null,
    });
  };

  const handleAddRow = () => {
    setParameters([...parameters, { key: "", value: "" }]);
  };

  const processBlock = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      setOutput(null);

      // Interpolate variables in webhook URL
      const interpolatedWebhookUrl = interpolateVariables(webhookUrl);

      // Filter out empty parameters and interpolate variables in values
      const validParameters = parameters
        .filter((p) => p.key && p.value)
        .map((p) => ({
          key: p.key,
          value: interpolateVariables(p.value),
        }));

      // Convert parameters array to object
      const paramsObject = validParameters.reduce(
        (acc, curr) => {
          acc[curr.key] = curr.value;
          return acc;
        },
        {} as Record<string, string>
      );

      const response = await api.post("/api/run_code_local", {
        code: `
import requests
webhook_url = "${interpolatedWebhookUrl}"
payload = ${JSON.stringify(paramsObject)}
print("Making request to:", webhook_url)
print("With payload:", payload)
response = requests.post(webhook_url, json=payload)
print("Status:", response.status_code)
print("Response:", response.text)
        `,
        language: "python",
      });

      if (response.success) {
        setOutput(
          `✅ Webhook call successful\n${response.raw?.output || "No response received"}`
        );
        if (selectedVariableId) {
          // Update the variable with the response
          props.onAddVariable({
            id: selectedVariableId,
            name:
              props.variables.find((v) => v.id === selectedVariableId)?.name ||
              "",
            value: response.raw?.output || "",
            type: "intermediate",
          });
        }
        return true;
      } else {
        setError(
          `❌ Webhook call failed\n${response.raw?.output || "Unknown error"}`
        );
        return false;
      }
    } catch (error) {
      console.error("Error processing make block:", error);
      setError("Failed to process webhook call. Please try again.");
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  useImperativeHandle(ref, () => ({
    processBlock,
  }));

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              Make Block #{props.blockNumber}
            </h3>
            <BlockNameEditor
              blockName={
                currentBlock?.name || `Make Block ${props.blockNumber}`
              }
              blockNumber={props.blockNumber}
              onNameUpdate={updateBlockName}
            />
          </div>
          <Image
            src="https://images.ctfassets.net/un655fb9wln6/3xu9WYYJyMScG7FKnuVd1V/c4072d425c64525ea94ae9b60093fbaa/Make-Icon-Circle-Purple.svg"
            alt="Make.com"
            width={24}
            height={24}
          />
        </div>
        <Popover>
          <PopoverTrigger>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-0 bg-black border border-red-500">
            <button
              className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
              onClick={() => props.onDeleteBlock(props.blockNumber)}
            >
              Delete Block
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 text-gray-300 mb-2">
          <span>Webhook URL:</span>
          <Input
            placeholder="Enter the webhook URL here"
            value={webhookUrl}
            onChange={(e) => handleWebhookUrlChange(e.target.value)}
            className="flex-1"
          />
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <span>Set output as:</span>
          <VariableDropdown
            value={selectedVariableId || ""}
            onValueChange={handleVariableSelect}
            agentId={currentAgent?.id || null}
            onAddNew={props.onOpenTools}
          />
        </div>
      </div>

      <div className="mb-4 border border-gray-700 rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Key</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parameters.map((param, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    value={param.key}
                    onChange={(e) =>
                      handleParameterChange(index, "key", e.target.value)
                    }
                    placeholder="Enter key"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={param.value}
                    onChange={(e) =>
                      handleParameterChange(index, "value", e.target.value)
                    }
                    placeholder="Enter value"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-2 border-t border-gray-700">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAddRow}
            className="w-full text-gray-400 hover:text-gray-200 hover:bg-gray-700"
          >
            + Add Row
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-900/50 border border-red-700 rounded text-red-300">
          {error}
        </div>
      )}

      {output && (
        <div className="mb-4 p-4 bg-gray-900 border border-gray-700 rounded overflow-auto max-h-60">
          <pre className="text-gray-300 whitespace-pre-wrap font-mono text-sm">
            {output}
          </pre>
          {selectedVariableId && (
            <div className="mt-2 text-sm text-green-400">
              Output set as{" "}
              {props.variables.find((v) => v.id === selectedVariableId)?.name}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-start gap-2">
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button
          onClick={processBlock}
          disabled={isProcessing || props.isProcessing}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isProcessing || props.isProcessing ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Running...
            </>
          ) : (
            "Run"
          )}
        </Button>
      </div>
    </div>
  );
});

MakeBlock.displayName = "MakeBlock";

export default MakeBlock;
