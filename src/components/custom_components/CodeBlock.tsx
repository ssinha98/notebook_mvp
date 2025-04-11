import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
  useRef,
} from "react";
import { Variable, CodeBlock as CodeBlockType } from "@/types/types";
import { Button } from "@/components/ui/button";
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
import { Settings, Copy } from "lucide-react";
import { EditorView, basicSetup } from "codemirror";
import { python } from "@codemirror/lang-python";
import { oneDark } from "@codemirror/theme-one-dark";
import { api } from "@/tools/api";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { toast } from "sonner";
import VariableDropdown from "./VariableDropdown";

interface CodeBlockProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onUpdateBlock: (blockNumber: number, updates: any) => void;
  onAddVariable: (variable: Variable) => void;
  onOpenTools?: () => void;
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  initialLanguage?: string;
  initialCode?: string;
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate";
  } | null;
  initialStatus?: "approved" | "tbd";
}

export interface CodeBlockRef {
  processBlock: () => Promise<boolean>;
}

const CodeBlock = forwardRef<CodeBlockRef, CodeBlockProps>((props, ref) => {
  const [language, setLanguage] = useState(props.initialLanguage || "python");
  const [code, setCode] = useState(props.initialCode || "");
  const [status, setStatus] = useState<"approved" | "tbd">(
    props.initialStatus || "tbd"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState<string | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<string>(
    props.initialOutputVariable?.id || ""
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Get variables from the store and convert to array
  const variablesObj = useVariableStore((state) => state.variables);
  const variables = Object.values(variablesObj);
  const currentAgent = useAgentStore((state) => state.currentAgent);

  // Add debugging logs
  useEffect(() => {
    console.log("CodeBlock mount/update - Debug info:", {
      blockNumber: props.blockNumber,
      initialOutputVariable: props.initialOutputVariable,
      variablesObj,
      variables,
      currentAgent,
      selectedVariableId,
    });
  }, [
    props.initialOutputVariable,
    variablesObj,
    variables,
    currentAgent,
    selectedVariableId,
  ]);

  // Load variables when component mounts
  useEffect(() => {
    const loadVars = async () => {
      const currentAgentId = currentAgent?.id;
      if (currentAgentId) {
        console.log("Loading variables for agent:", currentAgentId);
        await useVariableStore.getState().loadVariables(currentAgentId);
      }
    };
    loadVars();
  }, [currentAgent?.id]);

  // Update effect to initialize selected variable from initialOutputVariable
  useEffect(() => {
    if (props.initialOutputVariable?.id) {
      setSelectedVariableId(props.initialOutputVariable.id);
    }
  }, [props.initialOutputVariable]);

  // Refs for CodeMirror
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  // Initialize CodeMirror
  useEffect(() => {
    if (editorRef.current && !viewRef.current) {
      // Create the editor view
      const view = new EditorView({
        doc: code,
        extensions: [
          basicSetup,
          python(),
          oneDark,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const newCode = update.state.doc.toString();
              setCode(newCode);
            }
          }),
        ],
        parent: editorRef.current,
      });

      viewRef.current = view;
    }

    // Cleanup function
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, []);

  // Update editor content when code changes externally
  useEffect(() => {
    if (viewRef.current && code !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: code,
        },
      });
    }
  }, [code]);

  // Update block when language or code changes
  useEffect(() => {
    if (props.onUpdateBlock) {
      // Only update if the values have changed from their initial values
      if (language !== props.initialLanguage || code !== props.initialCode) {
        const updates: Partial<CodeBlockType> = {
          language,
          code,
          outputVariable: selectedVariableId
            ? {
                id: selectedVariableId,
                name:
                  variables.find((v) => v.id === selectedVariableId)?.name ||
                  "",
                type: "intermediate",
              }
            : null,
        };

        // Only reset status if the code has changed significantly
        if (code !== props.initialCode) {
          updates.status = "tbd";
          setStatus("tbd");
        }

        props.onUpdateBlock(props.blockNumber, updates);
      }
    }
  }, [
    language,
    code,
    selectedVariableId,
    props.blockNumber,
    props.onUpdateBlock,
    props.initialLanguage,
    props.initialCode,
    variables,
  ]);

  // Update variable selection handler
  const handleVariableSelect = (value: string) => {
    if (value === "add_new" && props.onOpenTools) {
      props.onOpenTools();
    } else {
      setSelectedVariableId(value);
      const selectedVariable = Object.values(variables).find(
        (v) => v.id === value
      );
      if (selectedVariable) {
        props.onUpdateBlock(props.blockNumber, {
          language,
          code,
          outputVariable: {
            id: selectedVariable.id,
            name: selectedVariable.name,
            type: selectedVariable.type,
          },
        });
      }
    }
  };

  const processBlock = async () => {
    if (status === "tbd") {
      setOutput(
        "Your code needs to be approved for safety, before it can be run"
      );
      return false;
    }

    if (!code.trim()) {
      setError("Please enter some code to run");
      return false;
    }

    setIsLoading(true);
    setError(null);
    setOutput(null);

    try {
      // Replace variables in the code
      let interpolatedCode = code;
      const variableRegex = /{{(.*?)}}/g;
      const matches = [...code.matchAll(variableRegex)];

      for (const match of matches) {
        const [fullMatch, varName] = match;
        // Get the variable value directly from Firebase
        const variableValue = useVariableStore
          .getState()
          .getVariableByName(varName.trim())?.value;

        if (variableValue !== undefined) {
          // Always wrap string values in quotes to ensure valid Python syntax
          const value =
            typeof variableValue === "string"
              ? `"${variableValue}"` // Add quotes around strings
              : variableValue; // Leave non-strings (like numbers) as is

          interpolatedCode = interpolatedCode.replace(fullMatch, value);
        } else {
          setError(`Variable ${varName} not found or has no value`);
          setIsLoading(false);
          return false;
        }
      }

      console.log("Original code:", code);
      console.log("Interpolated code:", interpolatedCode);

      // Send the interpolated code to the backend endpoint
      const response = await api.post("/api/run_code_local", {
        language,
        code: interpolatedCode,
      });

      console.log("API Response:", response); // Log the response for debugging

      let outputText = "";
      // Check if we have a success response
      if (response.success) {
        outputText = response.output;
        setOutput(`✅ Code run successfully\n${outputText}`);
      } else {
        setError(
          `🤔 Your code had an error\n${response.output || "Unknown error"}`
        );
      }

      // Save output to selected variable if one is selected
      if (selectedVariableId && outputText) {
        const selectedVariable = variables.find(
          (v) => v.id === selectedVariableId
        );
        if (selectedVariable) {
          // Update the variable in the store
          useVariableStore
            .getState()
            .updateVariable(selectedVariableId, outputText);
          // Also update the local state through onAddVariable
          props.onAddVariable({
            ...selectedVariable,
            value: outputText,
          });
          console.log("Variable updated:", {
            id: selectedVariableId,
            value: outputText,
            name: selectedVariable.name,
          });
        }
      }

      setIsLoading(false);
      return true;
    } catch (error) {
      console.error("Error processing code block:", error);
      setError("Failed to process code block. Please try again.");
      setIsLoading(false);
      return false;
    }
  };

  useImperativeHandle(ref, () => ({
    processBlock,
  }));

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-white">
            Code Block #{props.blockNumber}
          </h3>
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
          <span>Language:</span>
          <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="python">Python</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <span>Set output as:</span>
          <VariableDropdown
            value={selectedVariableId}
            onValueChange={handleVariableSelect}
            agentId={currentAgent?.id || null}
            onAddNew={props.onOpenTools}
          />
        </div>
      </div>

      <div className="mb-4 border border-gray-700 rounded-md overflow-hidden">
        <div ref={editorRef} className="h-64 bg-gray-900" />
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
              {variables.find((v) => v.id === selectedVariableId)?.name}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            // Clear the code field
            setCode("");
            if (viewRef.current) {
              viewRef.current.dispatch({
                changes: {
                  from: 0,
                  to: viewRef.current.state.doc.length,
                  insert: "",
                },
              });
            }
          }}
        >
          Clear
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            // Save the code and language
            if (props.onUpdateBlock) {
              props.onUpdateBlock(props.blockNumber, {
                language,
                code,
                status: "tbd", // Reset status to tbd when saving
                outputVariable: selectedVariableId
                  ? {
                      id: selectedVariableId,
                      name:
                        variables.find((v) => v.id === selectedVariableId)
                          ?.name || "",
                      type: "intermediate",
                    }
                  : null,
              });
              setStatus("tbd"); // Update local state
            }
          }}
        >
          Save Code
        </Button>
        <Button
          onClick={processBlock}
          disabled={isLoading || props.isProcessing || status === "tbd"}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isLoading || props.isProcessing ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Running...
            </>
          ) : status === "tbd" ? (
            "Code Needs Approval"
          ) : (
            "Run Code"
          )}
        </Button>
      </div>
    </div>
  );
});

CodeBlock.displayName = "CodeBlock";

export default CodeBlock;
