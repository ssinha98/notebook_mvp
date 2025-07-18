import React, { forwardRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaFileExcel } from "react-icons/fa";
import { FiSettings, FiInfo } from "react-icons/fi";
import { ExcelAgentBlock } from "@/types/types";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/tools/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { api } from "@/tools/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import VariableDropdown from "./VariableDropdown";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import BlockNameEditor from "./BlockNameEditor";
import { BlockButton } from "./BlockButton";

interface ExcelAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void; // Add this line
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<ExcelAgentBlock>
  ) => void;
  initialPrompt?: string;
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  onOpenTools?: () => void;
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string;
  } | null;
}

interface ExcelAgentRef {
  processBlock: () => Promise<boolean>;
}

const ExcelAgent = forwardRef<ExcelAgentRef, ExcelAgentProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onCopyBlock,
      onUpdateBlock,
      initialPrompt = "",
      isProcessing = false,
      onProcessingChange,
      onOpenTools,
      initialOutputVariable = null,
    },
    ref
  ) => {
    const [userPrompt, setUserPrompt] = useState(initialPrompt);
    const [selectedVariableId, setSelectedVariableId] = useState<string>(() => {
      // Initialize with table column format if needed
      if (
        initialOutputVariable?.type === "table" &&
        initialOutputVariable.columnName
      ) {
        return `${initialOutputVariable.id}:${initialOutputVariable.columnName}`;
      }
      return initialOutputVariable?.id || "";
    });
    const [user] = useAuthState(auth);
    const { addFileNickname } = useSourceStore();
    const variables = useVariableStore((state) => state.variables);
    const currentAgentId = useAgentStore((state) => state.currentAgent?.id);
    const currentAgent = useAgentStore((state) => state.currentAgent);
    const [files, setFiles] = useState<
      Array<{ name: string; url: string; nickname?: string }>
    >([]);
    const [result, setResult] = useState<{
      download_url?: string;
      message?: string;
      success?: boolean;
      storage_path?: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Add cancellation state variables
    const [isRunning, setIsRunning] = useState(false);
    const [requestId, setRequestId] = useState<string | null>(null);

    // Add cancel handler
    const handleCancel = async () => {
      if (requestId) {
        try {
          const result = await api.cancelRequest(requestId);
          console.log("Cancel request result:", result);
        } catch (err) {
          console.error("Cancel request error:", err);
        }
        setIsRunning(false);
        setRequestId(null);
        onProcessingChange?.(false);
      }
    };

    // Add store hook for updating block names
    const { updateBlockName } = useSourceStore();

    // Get current block to display its name
    const currentBlock = useSourceStore((state) =>
      state.blocks.find((block) => block.blockNumber === blockNumber)
    );

    useEffect(() => {
      if (!user) return;

      const fetchFiles = async () => {
        const db = getFirestore();
        try {
          const filesSnapshot = await getDocs(
            collection(db, "users", user.uid, "files")
          );
          const fileList = filesSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              name: data.full_name,
              url: data.download_link,
              nickname: data.nickname,
            };
          });
          setFiles(fileList);

          // Add files to nickname store
          fileList.forEach((file) => {
            if (file.nickname) {
              addFileNickname(file.nickname, file.name, file.url);
            }
          });
        } catch (error) {
          console.error("Error fetching files:", error);
        }
      };

      fetchFiles();
    }, [user, addFileNickname]);

    // Load variables when component mounts
    useEffect(() => {
      if (currentAgentId) {
        useVariableStore.getState().loadVariables(currentAgentId);
      }
    }, [currentAgentId]);

    // Load initial prompt only once
    useEffect(() => {
      if (initialPrompt && userPrompt !== initialPrompt) {
        setUserPrompt(initialPrompt);
      }
    }, [initialPrompt]);

    // Update selection when initialOutputVariable changes
    useEffect(() => {
      if (initialOutputVariable?.id) {
        // If it's a table variable with column name, construct the proper value
        if (
          initialOutputVariable.type === "table" &&
          initialOutputVariable.columnName
        ) {
          setSelectedVariableId(
            `${initialOutputVariable.id}:${initialOutputVariable.columnName}`
          );
        } else {
          setSelectedVariableId(initialOutputVariable.id);
        }
      }
    }, [initialOutputVariable]);

    // Save prompt with debounce
    useEffect(() => {
      const timeoutId = setTimeout(() => {
        // Only update if the prompt has actually changed
        if (userPrompt !== initialPrompt) {
          onUpdateBlock(blockNumber, { prompt: userPrompt });
        }
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
    }, [userPrompt, blockNumber, onUpdateBlock, initialPrompt]);

    // Function to process variables in text
    const processVariablesInText = (text: string): string => {
      const regex = /{{(.*?)}}/g;
      return text.replace(regex, (match, varName) => {
        // Filter variables by current agent ID
        const variable = Object.values(variables)
          .filter((v) => v.agentId === currentAgentId)
          .find((v) => v.name === varName.trim());

        if (!variable) return `no value saved to ${varName.trim()}`;

        // Handle table variables by converting to CSV
        if (variable.type === "table") {
          const rows = Array.isArray(variable.value) ? variable.value : [];
          const columns = variable.columns || [];

          // Filter out 'id' column as it's usually not needed in spreadsheets
          const relevantColumns = columns.filter((col) => col !== "id");

          if (relevantColumns.length === 0 || rows.length === 0) {
            return `empty table ${varName.trim()}`;
          }

          // Create CSV header
          const headerRow = relevantColumns.join(",");

          // Create CSV data rows
          const dataRows = rows.map((row) => {
            return relevantColumns
              .map((col) => {
                const value = row[col] || "";
                // Escape quotes and wrap in quotes if value contains comma or quote
                if (value.includes(",") || value.includes('"')) {
                  return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
              })
              .join(",");
          });

          // Combine header and data rows
          return [headerRow, ...dataRows].join("\n");
        }

        // Handle regular variables
        return String(variable.value || `no value saved to ${varName.trim()}`);
      });
    };

    const handleVariableSelect = (value: string) => {
      if (value === "add_new" && onOpenTools) {
        onOpenTools();
      } else {
        setSelectedVariableId(value);

        // Find the selected variable and format it properly
        let selectedVariable;
        let outputVariable;

        if (value.includes(":")) {
          // Table variable with column name
          const [tableId, columnName] = value.split(":");
          selectedVariable = Object.values(variables).find(
            (v) => v.id === tableId
          );

          if (selectedVariable) {
            outputVariable = {
              id: selectedVariable.id,
              name: `${selectedVariable.name}.${columnName}`,
              type: "table" as const,
              columnName: columnName,
            };
          }
        } else {
          // Regular variable
          selectedVariable = Object.values(variables).find(
            (v) => v.id === value
          );

          if (selectedVariable) {
            outputVariable = {
              id: selectedVariable.id,
              name: selectedVariable.name,
              type: selectedVariable.type as "input" | "intermediate" | "table",
            };
          }
        }

        // Update the block with the output variable
        onUpdateBlock(blockNumber, {
          outputVariable: outputVariable || null,
        });
      }
    };

    const processBlock = async (): Promise<boolean> => {
      const newRequestId = crypto.randomUUID();
      setRequestId(newRequestId);
      setIsRunning(true);

      try {
        setResult(null);
        setIsLoading(true);
        onProcessingChange?.(true);

        if (!userPrompt.trim()) {
          setResult({
            success: false,
            message: "Please enter a prompt",
          });
          return false;
        }

        // Process variables in the prompt
        const processedPrompt = processVariablesInText(userPrompt.trim());
        // console.log("Excel Agent - Original prompt:", userPrompt);
        // console.log("Excel Agent - Processed prompt:", processedPrompt);

        const requestBody = {
          prompt: processedPrompt,
          user_id: user?.uid || "user1234",
          request_id: newRequestId,
        };

        // console.log("Excel Agent - Request body:", requestBody);

        // Use api.post instead of direct fetch
        const response = await api.post("/api/excel_agent", requestBody);

        // Handle cancellation gracefully
        if (response.cancelled) {
          console.log("Excel agent request was cancelled by user");
          return false;
        }

        // console.log("Excel Agent - Response:", response);

        // Save the result
        setResult(response);

        // If successful and we have a variable selected, save the download URL
        if (response.success && response.download_url && selectedVariableId) {
          if (selectedVariableId.includes(":")) {
            // Table variable - save as new row
            const [tableId, columnName] = selectedVariableId.split(":");
            await useVariableStore
              .getState()
              .addTableRow(tableId, { [columnName]: response.download_url });
          } else {
            // Regular variable - save as value
            await useVariableStore
              .getState()
              .updateVariable(selectedVariableId, response.download_url);
          }
        }

        // Update the block
        onUpdateBlock(blockNumber, { prompt: userPrompt.trim() });

        return response.success || false;
      } catch (err: any) {
        console.error("Excel Agent - Error processing request:", err);
        const message =
          err.message || "An error occurred while processing the Excel file";
        setResult({
          success: false,
          message,
        });
        return false;
      } finally {
        setIsLoading(false);
        onProcessingChange?.(false);
        setIsRunning(false);
        setRequestId(null);
      }
    };

    React.useImperativeHandle(ref, () => ({
      processBlock,
    }));

    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <FaFileExcel className="text-blue-500 text-xl" />
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-gray-100">
                Excel Agent {blockNumber}
              </h3>
              <BlockNameEditor
                blockName={currentBlock?.name || `Excel Agent ${blockNumber}`}
                blockNumber={blockNumber}
                onNameUpdate={updateBlockName}
              />
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-100"
                >
                  <FiInfo className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-gray-100">
                    the Excel Agent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This agent creates spreadsheets based on your instructions.
                    Spreadsheets can include charts, editable fonts and tables.
                    Its best used with earlier blocks analysing the data, and
                    using the excel agent to create the final spreadsheet.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-800 text-gray-100 hover:bg-gray-700 border-gray-700">
                    Close
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Popover>
            <PopoverTrigger asChild={true}>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-100"
              >
                <FiSettings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={() => onDeleteBlock(blockNumber)}
              >
                Delete Block
              </button>
              <button
                className="w-full px-4 py-2 text-blue-500 hover:bg-blue-950 text-left transition-colors"
                onClick={() => onCopyBlock?.(blockNumber)}
              >
                Copy Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              User Prompt
            </label>
            <Textarea
              value={userPrompt}
              onChange={(e) => {
                setUserPrompt(e.target.value);
              }}
              className="bg-gray-800 border-gray-700 text-gray-100"
              placeholder="Describe the Excel file you want the agent to create"
            />
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
              onAddNew={onOpenTools}
            />
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-800 rounded border border-gray-700">
              {result.success && result.download_url ? (
                <div className="text-sm text-gray-300">
                  <div className="break-words">
                    {result.message || "Excel file generated successfully!"}{" "}
                    <a
                      href={result.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      click here
                    </a>
                  </div>
                  {selectedVariableId && (
                    <div className="mt-2 text-sm text-green-400">
                      Saved download link as{" "}
                      {
                        Object.values(variables).find(
                          (v) => v.id === selectedVariableId
                        )?.name
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-400 break-words">
                  Error: {result.message || "Failed to generate Excel file"}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-start gap-2 p-4 border-t border-gray-700">
          <BlockButton
            isRunning={isRunning}
            onRun={processBlock}
            onCancel={handleCancel}
            runLabel="Process Excel"
            runningLabel="Processing..."
            disabled={isLoading || isProcessing}
          />
        </div>
      </div>
    );
  }
);

ExcelAgent.displayName = "ExcelAgent";

export default ExcelAgent;
