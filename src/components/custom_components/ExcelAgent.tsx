import React, { forwardRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { FaFileExcel } from "react-icons/fa";
import { FiSettings, FiInfo } from "react-icons/fi";
import { ExcelAgentBlock } from "@/types/types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSourceStore } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";
import { auth } from "@/tools/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { api, API_URL } from "@/tools/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
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

interface ExcelAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<ExcelAgentBlock>
  ) => void;
  initialFileUrl?: string;
  initialSheetName?: string;
  initialRange?: string;
  initialOperations?: ExcelAgentBlock["operations"];
  initialPrompt?: string;
  isProcessing?: boolean;
}

interface ExcelAgentRef {
  processBlock: () => Promise<boolean>;
}

const ExcelAgent = forwardRef<ExcelAgentRef, ExcelAgentProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onUpdateBlock,
      initialPrompt = "",
      isProcessing = false,
    },
    ref
  ) => {
    const [userPrompt, setUserPrompt] = useState(initialPrompt);
    const [selectedSource, setSelectedSource] = useState("none");
    const [selectedFormatSource, setSelectedFormatSource] = useState("none");
    const [outputFilename, setOutputFilename] = useState("");
    const [user] = useAuthState(auth);
    const { addFileNickname } = useSourceStore();
    const variables = useVariableStore((state) => state.variables);
    const currentAgentId = useAgentStore((state) => state.currentAgent?.id);
    const [files, setFiles] = useState<
      Array<{ name: string; url: string; nickname?: string }>
    >([]);
    const [output, setOutput] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

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
        return variable?.value || `no value saved to ${varName.trim()}`;
      });
    };

    const processBlock = async () => {
      try {
        setError("");
        setOutput("");
        setIsLoading(true);

        if (!userPrompt.trim()) {
          setError("Please enter a prompt");
          return false;
        }

        // Process variables in the prompt
        const processedPrompt = processVariablesInText(userPrompt.trim());
        console.log("Excel Agent - Original prompt:", userPrompt);
        console.log("Excel Agent - Processed prompt:", processedPrompt);

        const requestBody = {
          prompt: processedPrompt,
          ...(selectedSource !== "none" && { source: selectedSource }),
          ...(selectedFormatSource !== "none" && {
            format_source: selectedFormatSource,
          }),
          ...(outputFilename && { output_filename: outputFilename }),
        };

        // Get the base URL from the api module
        const baseUrl = API_URL;
        console.log("Excel Agent - Using base URL:", baseUrl);
        console.log("Excel Agent - Request body:", requestBody);

        // Make direct fetch call instead of using api.post since we're expecting binary data
        const response = await fetch(`${baseUrl}/api/excel_agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
          body: JSON.stringify(requestBody),
          credentials: "include", // Add this to handle CORS properly
        });

        console.log("Excel Agent - Response status:", response.status);
        console.log(
          "Excel Agent - Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        const contentType = response.headers.get("Content-Type");
        console.log("Excel Agent - Content Type:", contentType);

        if (!response.ok) {
          // If we got HTML, it's likely an error page
          if (contentType?.includes("text/html")) {
            console.error(
              "Excel Agent - Received HTML error page instead of expected response"
            );
            throw new Error(
              "Received unexpected HTML response. The server might be unavailable."
            );
          }

          try {
            // Try to parse as JSON error
            const errorData = await response.json();
            console.error("Excel Agent - Error response:", errorData);
            throw new Error(errorData.error || "Failed to generate Excel file");
          } catch (parseError) {
            // If we can't parse as JSON, return the status text
            console.error(
              "Excel Agent - Could not parse error response:",
              parseError
            );
            throw new Error(`Server error: ${response.statusText}`);
          }
        }

        // Check if we received an Excel file
        if (contentType && contentType.includes("spreadsheetml")) {
          console.log(
            "Excel Agent - Received Excel file, processing download..."
          );
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = outputFilename || "output.xlsx";
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          setOutput("✅ Excel file generated and downloaded successfully!");
          return true;
        }

        // If we got here, something unexpected happened
        console.error("Excel Agent - Unexpected response type:", contentType);
        throw new Error("Received unexpected response format from server");
      } catch (err: any) {
        console.error("Excel Agent - Error processing request:", err);
        const message =
          err.message || "An error occurred while processing the Excel file";
        setError(message);
        setOutput("");
        return false;
      } finally {
        setIsLoading(false);
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
            <h3 className="text-lg font-semibold text-gray-100">
              Excel Agent {blockNumber}
            </h3>
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
                    {/* Content can be controlled here */}
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
            <PopoverTrigger>
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

          {/* Commented out for future use
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Data to Analyse
            </label>
            <Select value={selectedSource} onValueChange={setSelectedSource}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {files.map((file) => (
                  <SelectItem key={file.name} value={file.name}>
                    {file.nickname || file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Match the formatting of
            </label>
            <Select
              value={selectedFormatSource}
              onValueChange={setSelectedFormatSource}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-gray-100">
                <SelectValue placeholder="Select a source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {files.map((file) => (
                  <SelectItem key={file.name} value={file.name}>
                    {file.nickname || file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Output File
            </label>
            <Input
              value={outputFilename}
              onChange={(e) => setOutputFilename(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
              placeholder="Name of the output file"
            />
          </div>
          */}

          {error && <div className="text-red-500 text-sm">{error}</div>}

          {output && (
            <div className="mt-4 p-4 bg-gray-800 rounded border border-gray-700">
              <h4 className="text-sm font-medium mb-2 text-gray-300">
                Response:
              </h4>
              <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
                {output}
              </pre>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
          <Button
            onClick={processBlock}
            disabled={isLoading || isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Processing...
              </>
            ) : (
              "Process Excel"
            )}
          </Button>
        </div>
      </div>
    );
  }
);

ExcelAgent.displayName = "ExcelAgent";

export default ExcelAgent;
