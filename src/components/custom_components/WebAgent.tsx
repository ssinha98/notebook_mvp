import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Variable } from "@/types/types";
import ReactMarkdown from "react-markdown";
import { api } from "@/tools/api";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import VariableDropdown from "./VariableDropdown";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";
import { BlockButton } from "./BlockButton";
import CustomEditor from "@/components/CustomEditor";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { getDoc, doc } from "firebase/firestore";
import { db, auth } from "@/tools/firebase";
import { useRouter } from "next/router";
import { Agent } from "@/types/types";

interface WebAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void; // Add this line
  onUpdateBlock: (blockNumber: number, updates: Partial<any>) => void;
  onAddVariable: (newVariable: Variable) => void;
  initialUrl?: string;
  initialPrompt?: string;
  initialSelectedVariableId?: string;
  initialOutputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string;
  } | null;
  onOpenTools?: () => void;
  containsPrimaryInput?: boolean;
  skip?: boolean; // Add this line
}

interface WebResponse {
  markdown?: string;
  analysis?: string;
  error?: string;
}

export interface WebAgentRef {
  processBlock: () => Promise<boolean>;
  getOutput: () => any;
}

// Add debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const WebAgent = forwardRef<WebAgentRef, WebAgentProps>((props, ref) => {
  const router = useRouter();
  const {
    blockNumber,
    onDeleteBlock,
    onCopyBlock,
    onUpdateBlock,
    onAddVariable,
    initialUrl = "",
    initialPrompt = "",
    initialSelectedVariableId,
    initialOutputVariable,
  } = props;

  const [url, setUrl] = useState(initialUrl);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<WebResponse | null>(null);
  const [isOutputExpanded, setIsOutputExpanded] = useState(false);
  const [selectedVariableId, setSelectedVariableId] = useState<string>(() => {
    // Initialize with table column format if needed
    if (
      initialOutputVariable?.type === "table" &&
      initialOutputVariable.columnName
    ) {
      return `${initialOutputVariable.id}:${initialOutputVariable.columnName}`;
    }
    return initialSelectedVariableId || initialOutputVariable?.id || "";
  });
  const [output, setOutput] = useState<any>(null);

  // Add new state for test dialog
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Debounce the inputs to avoid excessive updates
  const debouncedUrl = useDebounce(url, 500);
  const debouncedPrompt = useDebounce(prompt, 500);

  // const variables = useVariableStore((state) => state.variables);
  const currentAgent = useAgentStore((state) => state.currentAgent);

  // Get reordering functions from AgentStore instead of SourceStore
  const { updateBlockName, copyBlockAfter } = useAgentStore();

  // Get current block from AgentStore instead of SourceStore
  const currentBlock = currentAgent?.blocks?.find(
    (block) => block.blockNumber === blockNumber
  );

  // Variables are now loaded centrally in the notebook page
  // No need to load them in each individual block component

  // Update local state when props change
  React.useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  React.useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  // Update selection when initialOutputVariable changes
  React.useEffect(() => {
    // Handle the case where initialOutputVariable is null or undefined
    if (!initialOutputVariable) {
      setSelectedVariableId("");
      return;
    }

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
  }, [initialOutputVariable]);

  // Remove the useEffect that syncs local state with props
  // React.useEffect(() => {
  //   setskip(props.skip || false);
  // }, [props.skip]);

  // Debounced update functions
  const debouncedUpdateBlock = useCallback(
    (updates: any) => {
      if (typeof onUpdateBlock === "function") {
        onUpdateBlock(blockNumber, updates);
      }
    },
    [onUpdateBlock, blockNumber]
  );

  // Save URL changes only when user stops typing
  React.useEffect(() => {
    if (debouncedUrl !== initialUrl) {
      debouncedUpdateBlock({ url: debouncedUrl });
    }
  }, [debouncedUrl, initialUrl, debouncedUpdateBlock]);

  // Save prompt changes only when user stops typing
  React.useEffect(() => {
    if (debouncedPrompt !== initialPrompt) {
      debouncedUpdateBlock({ prompt: debouncedPrompt });
    }
  }, [debouncedPrompt, initialPrompt, debouncedUpdateBlock]);

  // Auto-resize textarea when prompt changes
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [prompt]);

  // Memoize expensive text processing function
  const formatTextWithVariables = useCallback((text: string) => {
    const parts: React.ReactNode[] = [];
    const regex = /{{(.*?)}}/g;
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const [fullMatch, varName] = match;
      const startIndex = match.index!;

      // Add text before the variable
      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex));
      }

      // Check if variable exists
      let varExists = false;
      const cleanVarName = varName.trim();

      // Check if it's a table column reference (contains dot)
      if (cleanVarName.includes(".")) {
        const [tableName, columnName] = cleanVarName.split(".");
        const variables = useVariableStore.getState().variables;
        const tableVar = Object.values(variables).find(
          (v) => v.name === tableName
        );

        // Variable is valid if table exists and has the specified column
        varExists = !!(
          tableVar &&
          tableVar.type === "table" &&
          Array.isArray(tableVar.columns) &&
          tableVar.columns.includes(columnName)
        );
      } else {
        // Regular variable check
        varExists = !!useVariableStore
          .getState()
          .getVariableByName(cleanVarName);
      }

      // Add the variable part with styling
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
  }, []); // No dependencies needed since we're calling getState() directly

  // Process variables in text (for actual URL resolution)
  const processVariablesInText = (text: string): string => {
    const regex = /{{(.*?)}}/g;
    return text.replace(regex, (match, varName) => {
      const trimmedName = varName.trim();

      // Handle table.column references
      if (trimmedName.includes(".")) {
        const [tableName, columnName] = trimmedName.split(".");
        const tableVar = useVariableStore
          .getState()
          .getVariableByName(tableName);
        if (tableVar?.type === "table") {
          const columnValues = useVariableStore
            .getState()
            .getTableColumn(tableVar.id, columnName);
          return JSON.stringify(columnValues);
        }
      }

      // Handle regular variables
      const variable = useVariableStore
        .getState()
        .getVariableByName(trimmedName);
      if (!variable) return match;

      // Handle table variables
      if (variable.type === "table") {
        const rows = Array.isArray(variable.value) ? variable.value : [];
        return JSON.stringify(rows);
      }

      return String(variable.value || match);
    });
  };

  // Handle variable selection
  const handleVariableSelect = (value: string) => {
    if (value === "add_new" && props.onOpenTools) {
      props.onOpenTools();
    } else {
      setSelectedVariableId(value);

      // Find the selected variable and format it properly
      const variables = useVariableStore.getState().variables;
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
        selectedVariable = Object.values(variables).find((v) => v.id === value);

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

  // Add this helper function to handle table variables
  const getTableColumnValues = (variableName: string): string[] => {
    const cleanVariableName = variableName.replace(/[{}]/g, "");
    // console.log("Clean variable name:", cleanVariableName);

    const [tableName, columnName] = cleanVariableName.split(".");
    // console.log("Table name:", tableName, "Column name:", columnName);

    const variables = useVariableStore.getState().variables;
    // console.log("All variables:", variables);

    const tableVar = Object.values(variables).find((v) => v.name === tableName);
    // console.log("Found table:", tableVar);

    if (
      !tableVar ||
      tableVar.type !== "table" ||
      !Array.isArray(tableVar.value)
    ) {
      // console.log("Table not found or invalid:", { tableName, tableVar });
      return [];
    }

    // Use the columnName from the variable reference
    const values = tableVar.value.map((row) => row[columnName]).filter(Boolean);
    // console.log("Extracted values:", values);
    return values;
  };

  // 🆕 ADD: Helper function to extract column name from URL variable reference
  const extractColumnNameFromUrl = (urlText: string): string => {
    const match = urlText.match(/{{(.*?)}}/);
    if (match) {
      const variableName = match[1].trim();
      if (variableName.includes(".")) {
        const [tableName, columnName] = variableName.split(".");
        return columnName;
      }
    }
    return "urls"; // fallback
  };

  // Add state variables after existing state
  const [isRunning, setIsRunning] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);

  // Add cancel handler
  const handleCancel = async () => {
    if (requestId) {
      try {
        console.log("Sending cancel for request_id:", requestId);
        const result = await api.cancelRequest(requestId);
        console.log("Cancel request result:", result);
      } catch (err) {
        console.error("Cancel request error:", err);
      }
      setIsRunning(false);
      setRequestId(null);
    }
  };

  // Replace the existing handleFetch function
  const handleFetch = async () => {
    const newRequestId = crypto.randomUUID();
    setRequestId(newRequestId);
    setIsRunning(true);

    try {
      // Direct Firebase fetch for fresh data
      const userId = auth.currentUser?.uid;
      const { agentId } = router.query;

      console.log("=== WebAgent Debug ===");
      console.log("User ID:", userId);
      console.log("Agent ID:", agentId);

      if (!userId || !agentId || typeof agentId !== "string") {
        toast.error("Authentication or agent error");
        return false;
      }

      const agentDoc = await getDoc(doc(db, `users/${userId}/agents`, agentId));
      if (!agentDoc.exists()) {
        toast.error("Agent not found");
        return false;
      }

      const agent = { id: agentDoc.id, ...agentDoc.data() } as Agent;
      const freshBlock = agent.blocks.find(
        (b) => b.blockNumber === blockNumber
      );

      console.log("Fresh block from Firebase:", freshBlock);

      if (!freshBlock || freshBlock.type !== "webagent") {
        toast.error("Web agent block not found");
        return false;
      }

      // 🆕 ADD: Check skip status from fresh Firebase data
      if (freshBlock.skip) {
        console.log(
          `❌ SKIPPING WebAgent ${blockNumber} - skip flag is true in Firebase`
        );
        return true; // Return true to indicate successful skip
      }

      console.log(
        `✅ EXECUTING WebAgent ${blockNumber} - skip flag is false in Firebase`
      );

      // Refresh variables from Firebase before processing
      await useVariableStore.getState().loadVariables(agent.id);

      // Use fresh Firebase data
      const urlToUse = freshBlock.url || "";
      const promptToUse = freshBlock.prompt || "";

      console.log("URL to use:", urlToUse);
      console.log("Prompt to use:", promptToUse);

      if (!urlToUse.trim()) {
        toast.error("URL is required");
        return false;
      }

      const processedUrl = processVariablesInText(urlToUse);
      const processedPrompt = processVariablesInText(promptToUse);

      console.log("Processed URL:", processedUrl);
      console.log("Processed prompt:", processedPrompt);

      // Check if processedUrl is a JSON array (table column values)
      let urlsToProcess: string[] = [];
      try {
        const parsedUrls = JSON.parse(processedUrl);
        if (Array.isArray(parsedUrls)) {
          urlsToProcess = parsedUrls.filter(
            (url) => url && typeof url === "string"
          );
        } else {
          urlsToProcess = [processedUrl];
        }
      } catch {
        // Not JSON, treat as single URL
        urlsToProcess = [processedUrl];
      }

      console.log("URLs to process:", urlsToProcess);

      // Process each URL individually
      const results = [];
      for (const singleUrl of urlsToProcess) {
        if (!singleUrl.trim()) continue;

        const requestPayload = {
          url: singleUrl,
          prompt: processedPrompt,
          request_id: newRequestId,
        };

        console.log("Processing URL:", singleUrl);

        try {
          const response = await api.post("/scrape", requestPayload);

          if (response && (response.markdown || response.analysis)) {
            const content = response.analysis || response.markdown;
            results.push({
              url: singleUrl,
              content: content,
            });

            // Save to variable if selected - update existing rows
            if (selectedVariableId && selectedVariableId.includes(":")) {
              const [tableId, outputColumn] = selectedVariableId.split(":");
              const tableVar = useVariableStore.getState().variables[tableId];

              if (tableVar?.type === "table" && Array.isArray(tableVar.value)) {
                const urlColumnName = extractColumnNameFromUrl(urlToUse);
                const rowToUpdate = tableVar.value.find(
                  (row) => row[urlColumnName] === singleUrl
                );
                if (rowToUpdate) {
                  await useVariableStore
                    .getState()
                    .updateTableRow(tableId, rowToUpdate.id, {
                      [outputColumn]: content,
                    });
                }
              }
            }
          } else {
            console.log("No valid data for URL:", singleUrl);
            // Save error message to table
            if (selectedVariableId && selectedVariableId.includes(":")) {
              const [tableId, outputColumn] = selectedVariableId.split(":");
              const tableVar = useVariableStore.getState().variables[tableId];

              if (tableVar?.type === "table" && Array.isArray(tableVar.value)) {
                const urlColumnName = extractColumnNameFromUrl(urlToUse);
                const rowToUpdate = tableVar.value.find(
                  (row) => row[urlColumnName] === singleUrl
                );
                if (rowToUpdate) {
                  await useVariableStore
                    .getState()
                    .updateTableRow(tableId, rowToUpdate.id, {
                      [outputColumn]: "Error: No valid data returned",
                    });
                }
              }
            }
          }
        } catch (error) {
          console.error("Error processing URL:", singleUrl, error);

          // Save error message to table
          if (selectedVariableId && selectedVariableId.includes(":")) {
            const [tableId, outputColumn] = selectedVariableId.split(":");
            const tableVar = useVariableStore.getState().variables[tableId];

            if (tableVar?.type === "table" && Array.isArray(tableVar.value)) {
              const urlColumnName = extractColumnNameFromUrl(urlToUse);
              const rowToUpdate = tableVar.value.find(
                (row) => row[urlColumnName] === singleUrl
              );
              if (rowToUpdate) {
                const errorMessage = `Error: ${error instanceof Error ? error.message : "Unknown error"}`;
                await useVariableStore
                  .getState()
                  .updateTableRow(tableId, rowToUpdate.id, {
                    [outputColumn]: errorMessage,
                  });
              }
            }
          }
          // Continue with next URL instead of stopping
        }
      }

      // Combine results
      if (results.length > 0) {
        const combinedContent = results
          .map((r) => `${r.url}: ${r.content}`)
          .join("\n\n");
        setResponse({ analysis: combinedContent });
        setOutput(combinedContent);
        return true;
      } else {
        toast.error("No valid results from any URLs");
        return false;
      }
    } catch (error: any) {
      console.error("❌ Catch block - Fetch error:", error);
      console.error("Error type:", typeof error);
      console.error("Error message:", error?.message);
      console.error("Error stack:", error?.stack);

      if (error instanceof Error && error.message.includes("cancelled")) {
        console.log("Web scraping was cancelled by user");
      } else {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        toast.error("Web scraping failed: " + errorMessage);
      }
      return false;
    } finally {
      setIsRunning(false);
      setRequestId(null);
      console.log("=== End WebAgent Debug ===");
    }
  };

  // Add new function to handle test runs
  const handleTest = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setTestResult(null);

    const newRequestId = crypto.randomUUID();

    try {
      let processedUrl = url.trim();

      // Handle table variables
      if (url.match(/{{.*?}}/)) {
        const [tableName, columnName] = url.replace(/[{}]/g, "").split(".");
        const tableUrls = getTableColumnValues(`${tableName}.${columnName}`);

        if (tableUrls.length === 0) {
          throw new Error("No URLs found in table column");
        }

        // Take only the first URL for testing
        processedUrl = tableUrls[0];
      }

      const data = {
        url: processedUrl, // Use the processed URL instead of raw URL
        request_id: newRequestId,
        ...(prompt.trim() && { prompt: prompt.trim() }),
      };

      console.log("Test payload:", data);
      const response = await api.post("/scrape", data);

      if (response.cancelled) {
        console.log("Test scraping was cancelled");
        return;
      }

      setTestResult(
        response.analysis || response.markdown || "No content returned"
      );
      setIsTestDialogOpen(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to process test request";
      setTestResult(`Error: ${errorMessage}`);
      setIsTestDialogOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper method to save data to table column with error handling
  const saveToTableColumn = async (
    processedUrl: string,
    columnName: string,
    content: string
  ) => {
    try {
      const variable =
        useVariableStore.getState().variables[selectedVariableId.split(":")[0]];

      if (variable?.value && Array.isArray(variable.value)) {
        const rowWithUrl = variable.value.find(
          (row) => row[columnName] === processedUrl
        );

        if (rowWithUrl) {
          const targetColumn = selectedVariableId.split(":")[1];
          await useVariableStore
            .getState()
            .updateTableRow(selectedVariableId.split(":")[0], rowWithUrl.id, {
              [targetColumn]: content,
            });
        } else {
          console.warn(`Row with URL ${processedUrl} not found in table`);
        }
      }
    } catch (err) {
      console.error(
        `Failed to save to table column for URL ${processedUrl}:`,
        err
      );
      // Don't throw here - we want to continue processing other URLs
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className="text-gray-400">Loading...</div>;
    }

    if (!response) {
      return "Enter a URL and click Fetch to see website content here";
    }

    if (response.error) {
      return <div className="text-red-400">{response.error}</div>;
    }

    // Always show table if we have a table variable selected
    if (selectedVariableId?.includes(":")) {
      const tableVar =
        useVariableStore.getState().variables[selectedVariableId.split(":")[0]];

      const rows = Array.isArray(tableVar?.value) ? tableVar.value : [];
      const columns =
        rows.length > 0
          ? Object.keys(rows[0]).filter((col) => col !== "id")
          : [];

      return (
        <div className="space-y-4">
          <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column}>{column}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row: any, index: number) => (
                  <TableRow key={index}>
                    {columns.map((column) => (
                      <TableCell key={column} className="max-w-xl">
                        {row[column]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }

    // Show regular response content if not a table
    if (typeof response !== "string" && response.analysis) {
      return (
        <div className="space-y-4">
          <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="text-blue-400 mb-2">Analysis</h4>
            <p className="text-gray-300">{response.analysis}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown>
          {typeof response === "string" ? response : response.markdown || ""}
        </ReactMarkdown>
      </div>
    );
  };

  useImperativeHandle(ref, () => ({
    processBlock: async () => {
      await handleFetch();
      return true;
    },
    getOutput: () => output,
    setOutputVariable: (outputVariable: any) => {
      // Convert outputVariable object to string format for internal use
      if (outputVariable && typeof outputVariable === "object") {
        if (outputVariable.type === "table" && outputVariable.columnName) {
          setSelectedVariableId(
            `${outputVariable.id}:${outputVariable.columnName}`
          );
        } else {
          setSelectedVariableId(outputVariable.id);
        }
      } else if (typeof outputVariable === "string") {
        setSelectedVariableId(outputVariable);
      }
    },
  }));

  // Add state for row count
  const [rowCount, setRowCount] = useState<number>(0);

  // Get variables from store to watch for changes - FIXED SYNTAX
  const variables = useVariableStore((state) => state.variables);

  // Add function to get row count for table column variables
  const getRowCountForUrl = (urlText: string): number => {
    if (!urlText.trim()) return 0;

    // Check if URL contains a table column reference
    const match = urlText.match(/{{(.*?)}}/);
    if (!match) return 0;

    const variableName = match[1].trim();
    if (!variableName.includes(".")) return 0;

    const [tableName, columnName] = variableName.split(".");
    const tableUrls = getTableColumnValues(`${tableName}.${columnName}`);

    return tableUrls.length;
  };

  // Update row count when URL changes OR when variables change
  useEffect(() => {
    const count = getRowCountForUrl(url);
    setRowCount(count);
  }, [url]); // Remove variables dependency - getRowCountForUrl gets fresh data internally

  // Add auto-resize functionality for textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Add copy block handler
  const handleCopyBlock = () => {
    copyBlockAfter(blockNumber);
    toast.success("Block copied successfully!");
  };

  return (
    <div className="p-4 rounded-lg border border-white bg-[#141414]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold text-white">
            Web Agent {blockNumber}
          </h3>
          <BlockNameEditor
            blockName={currentBlock?.name || `Web Agent ${blockNumber}`}
            blockNumber={blockNumber}
            onNameUpdate={updateBlockName}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id={`primary-input-${blockNumber}`}
              checked={currentBlock?.containsPrimaryInput || false}
              onCheckedChange={(checked) => {
                onUpdateBlock(blockNumber, {
                  containsPrimaryInput: checked as boolean,
                });
              }}
              className="border-gray-600 bg-gray-700"
            />
            <label
              htmlFor={`primary-input-${blockNumber}`}
              className="text-sm text-gray-400"
            >
              Contains Primary Input
            </label>
          </div>
          {/* Add the skipControl here */}
          <Checkbox
            id={`skip-if-no-input-${blockNumber}`}
            checked={currentBlock?.skip || false}
            onCheckedChange={(checked) => {
              props.onUpdateBlock(blockNumber, {
                skip: checked as boolean,
              });
            }}
            className="border-gray-600 bg-gray-700"
          />
          <label
            htmlFor={`skip-if-no-input-${blockNumber}`}
            className="text-sm text-gray-400"
          >
            Skip block
          </label>
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
              onClick={() => onDeleteBlock(blockNumber)}
            >
              Delete Block
            </button>
            <button
              className="w-full px-4 py-2 text-blue-500 hover:bg-blue-950 text-left transition-colors"
              onClick={handleCopyBlock}
            >
              Copy Block
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <Input
              placeholder="The URL you want us to visit"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="flex-1"
            />
          </div>
          {url && (
            <div className="text-sm text-gray-300">
              {formatTextWithVariables(url)}
            </div>
          )}
          <div className="flex gap-2">
            <CustomEditor
              value={prompt}
              onChange={setPrompt}
              placeholder="Enter your prompt for the URL (optional)"
              className="flex-1"
              disabled={false}
              showListButtons={true}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <span>Save output as:</span>
          <VariableDropdown
            value={selectedVariableId}
            onValueChange={handleVariableSelect}
            agentId={currentAgent?.id || null}
            onAddNew={props.onOpenTools}
          />
        </div>

        <hr className="border-gray-700 my-4" />

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div
              className="text-sm text-gray-400 mb-2 flex items-center gap-2 cursor-pointer hover:text-gray-300 transition-colors"
              onClick={() => setIsOutputExpanded(!isOutputExpanded)}
            >
              <span
                className={`transition-transform duration-200 ${
                  isOutputExpanded ? "rotate-90" : "rotate-0"
                }`}
              >
                ▶
              </span>
              <span>{url || "No URL specified"}</span>
            </div>
            {isOutputExpanded && (
              <div className="text-white prose prose-invert max-w-none h-[25vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                {renderContent()}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-2">
          <BlockButton
            isRunning={isRunning}
            onRun={handleFetch}
            onCancel={handleCancel}
            runLabel="Fetch"
            runningLabel="Fetching..."
            disabled={!url.trim() || isLoading}
            needsConfirmation={rowCount > 0}
            rowCount={rowCount}
          />
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={!url.trim() || isLoading}
          >
            Test prompt
          </Button>
          {rowCount > 0 && (
            <span className="text-sm text-gray-400">({rowCount} rows)</span>
          )}
        </div>
      </div>

      {/* Add the test result dialog */}
      <AlertDialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Test Result</AlertDialogTitle>
            <AlertDialogDescription className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap">
              {testResult}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
});

WebAgent.displayName = "WebAgent";

export default WebAgent;
