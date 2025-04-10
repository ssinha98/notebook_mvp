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
import { api } from "@/tools/api";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  isProcessing?: boolean;
}

interface ExcelAgentRef {
  processBlock: () => Promise<boolean>;
}

const ExcelAgent = forwardRef<ExcelAgentRef, ExcelAgentProps>(
  (
    { blockNumber, onDeleteBlock, onUpdateBlock, isProcessing = false },
    ref
  ) => {
    const [userPrompt, setUserPrompt] = useState("");
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
        console.log("Original prompt:", userPrompt);
        console.log("Processed prompt:", processedPrompt);

        const requestBody: Record<string, string> = {
          prompt: processedPrompt,
        };

        if (selectedSource !== "none") {
          requestBody.source = selectedSource;
        }

        if (selectedFormatSource !== "none") {
          requestBody.format_source = selectedFormatSource;
        }

        if (outputFilename) {
          requestBody.output_filename = outputFilename;
        }

        console.log("Sending request with body:", requestBody);

        const response = await fetch(`${API_URL}/api/excel_agent`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
          body: JSON.stringify(requestBody),
        });

        console.log("Full API Response:", response);
        console.log("Response status:", response.status);
        console.log(
          "Response headers:",
          Object.fromEntries(response.headers.entries())
        );

        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
          // Try to parse error as JSON (if it's a proper JSON error)
          if (contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to generate Excel file");
          } else {
            // If not JSON, just throw a generic error
            throw new Error(
              "Failed to generate Excel file (non-JSON response)"
            );
          }
        }

        // Handle Excel file download
        if (
          contentType.includes(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          )
        ) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "output.xlsx"; // or outputFilename if you want to customize it
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);

          setOutput("✅ Excel file generated and downloaded successfully!");
          return true;
        }

        // If neither Excel nor JSON — fallback
        throw new Error("Unknown response format received from the server");
      } catch (err: any) {
        console.error("Error processing Excel:", err);

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
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-100"
            >
              <FiInfo className="h-4 w-4" />
            </Button>
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
              onChange={(e) => setUserPrompt(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
              placeholder="Describe what you want to do with the Excel data..."
            />
          </div>

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
