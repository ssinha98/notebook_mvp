import React, { forwardRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FiSettings, FiInfo } from "react-icons/fi";
import { ApolloAgentBlock } from "@/types/types";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";
import VariableDropdown from "./VariableDropdown";
import { API_URL, api } from "@/tools/api";
import { auth } from "@/tools/firebase";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { BlockButton } from "./BlockButton";
import CustomEditor from "@/components/CustomEditor";
import { toast } from "sonner";

interface ApolloAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void;
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<ApolloAgentBlock>
  ) => void;
  initialFullName?: string;
  initialFirstName?: string; // Add this
  initialLastName?: string; // Add this
  initialCompany?: string;
  initialPrompt?: string;
  initialOutputVariable?: any;
  isProcessing?: boolean;
  selectedData?: any[];
  formData?: any;
}

export interface ApolloAgentRef {
  processBlock: () => Promise<boolean>;
  setSelectedVariableId: (variableId: string) => void; // Add this method
}

const ApolloAgent = forwardRef<ApolloAgentRef, ApolloAgentProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onCopyBlock,
      onUpdateBlock,
      initialFullName = "",
      initialFirstName = "", // Add this
      initialLastName = "", // Add this
      initialCompany = "",
      initialPrompt = "",
      initialOutputVariable = null,
      isProcessing = false,
      selectedData = [],
      formData,
    },
    ref
  ) => {
    const [fullName, setFullName] = useState(initialFullName);
    const [firstName, setFirstName] = useState(initialFirstName); // Add this
    const [lastName, setLastName] = useState(initialLastName); // Add this
    const [company, setCompany] = useState(initialCompany);
    const [prompt, setPrompt] = useState(initialPrompt);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>("");
    const [result, setResult] = useState<string>("");
    const [selectedVariableId, setSelectedVariableId] = useState<string>(() => {
      // Initialize with the output variable from the block
      if (initialOutputVariable) {
        if (
          initialOutputVariable.type === "table" &&
          initialOutputVariable.columnName
        ) {
          return `${initialOutputVariable.id}:${initialOutputVariable.columnName}`;
        } else {
          return initialOutputVariable.id || "";
        }
      }
      return "";
    });

    const variables = useVariableStore((state) => state.variables);
    const currentAgent = useAgentStore((state) => state.currentAgent);
    const { updateBlockName } = useSourceStore();
    const currentBlock = useSourceStore((state) =>
      state.blocks.find((block) => block.blockNumber === blockNumber)
    );

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
      }
    };

    // Helper function to get Apollo API key from Firebase
    const getApolloApiKey = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);

      try {
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists() && docSnap.data().Apollo_API_Key) {
          return docSnap.data().Apollo_API_Key;
        } else {
          throw new Error(
            "Apollo API key not found. Please add it in Settings."
          );
        }
      } catch (error) {
        console.error("Error fetching Apollo API key:", error);
        throw new Error(
          "Failed to fetch Apollo API key. Please check your settings."
        );
      }
    };

    // Helper function to get the combined full name
    const getCombinedFullName = (): string => {
      if (fullName.trim()) {
        return fullName.trim();
      }
      if (firstName.trim() && lastName.trim()) {
        return `${firstName.trim()} ${lastName.trim()}`;
      }
      return "";
    };

    // Helper function to validate name input
    const validateNameInput = (): boolean => {
      const hasFullName = fullName.trim() !== "";
      const hasFirstName = firstName.trim() !== "";
      const hasLastName = lastName.trim() !== "";

      // Either full name is provided, OR both first and last name are provided
      if (hasFullName) {
        return true; // Full name takes precedence
      }
      if (hasFirstName && hasLastName) {
        return true; // Both first and last name are provided
      }
      return false; // Invalid state
    };

    const handleVariableSelect = (value: string) => {
      setSelectedVariableId(value);
    };

    React.useEffect(() => {
      const timeoutId = setTimeout(() => {
        onUpdateBlock(blockNumber, {
          fullName,
          firstName, // Add this
          lastName, // Add this
          company,
          prompt,
          outputVariable: selectedVariableId
            ? {
                id: selectedVariableId.includes(":")
                  ? selectedVariableId.split(":")[0]
                  : selectedVariableId,
                name: selectedVariableId.includes(":")
                  ? selectedVariableId.split(":")[1]
                  : "",
                type: selectedVariableId.includes(":")
                  ? "table"
                  : "intermediate",
                columnName: selectedVariableId.includes(":")
                  ? selectedVariableId.split(":")[1]
                  : undefined,
              }
            : null,
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }, [
      fullName,
      firstName, // Add this
      lastName, // Add this
      company,
      prompt,
      selectedVariableId,
      blockNumber,
      onUpdateBlock,
    ]);

    const processBlock = async () => {
      // Generate request ID and set running state
      const newRequestId = crypto.randomUUID();
      setRequestId(newRequestId);
      setIsRunning(true);

      // Helper: detect {{table.column}} syntax
      const isTableVariable = (value: string) => /{{.*?}}/.test(value);
      const parseTableColumn = (template: string) => {
        const match = template.match(/{{\s*(\w+)\.(\w+)\s*}}/);
        if (!match) return null;
        return { table: match[1], column: match[2] };
      };
      const getTableRows = (tableName: string) => {
        const variables = useVariableStore.getState().variables;
        const tableVar = Object.values(variables).find(
          (v) => v.type === "table" && v.name === tableName
        );
        return tableVar && Array.isArray(tableVar.value)
          ? { rows: tableVar.value, tableVar }
          : { rows: [], tableVar: null };
      };

      try {
        setError("");
        setResult("");
        setIsLoading(true);

        // Validate name input
        if (!validateNameInput()) {
          setError(
            "Please provide either a full name OR both first name and last name"
          );
          return false;
        }

        // Get the combined full name
        const combinedFullName = getCombinedFullName();
        if (!combinedFullName) {
          setError("Please provide a valid name");
          return false;
        }

        // DEBUG: Log the initial state
        // console.log("=== APOLLO DEBUG START ===");
        // console.log("selectedVariableId:", selectedVariableId);
        // console.log("fullName:", fullName);
        // console.log("company:", company);
        // console.log("prompt:", prompt);
        // console.log("selectedData:", selectedData);

        // Get Apollo API key from Firebase
        const apolloApiKey = await getApolloApiKey();

        // Get the output variable info - make it optional
        let tableId, outputColumn;
        let variableIdToUse = selectedVariableId;

        // Convert object format to string format if needed (like in WebAgent)
        if (typeof variableIdToUse === "object" && variableIdToUse !== null) {
          const objValue = variableIdToUse as any;
          if (objValue.type === "table" && objValue.columnName) {
            variableIdToUse = `${objValue.id}:${objValue.columnName}`;
          } else {
            variableIdToUse = objValue.id;
          }
        }

        if (variableIdToUse && variableIdToUse.includes(":")) {
          [tableId, outputColumn] = variableIdToUse.split(":");
          // console.log("Apollo: Using table variable:", {
          //   tableId,
          //   outputColumn,
          //   variableIdToUse,
          // });
        } else if (variableIdToUse) {
          // Regular variable selected
          // console.log("Apollo: Using regular variable:", variableIdToUse);
        } else {
          // console.log(
          //   "Apollo: No output variable selected - will display result only"
          // );
        }

        // Check if we're using table variables
        const nameIsTableVar = isTableVariable(combinedFullName);
        const companyIsTableVar = isTableVariable(company);
        const hasSelection = selectedData && selectedData.length > 0;

        // console.log("Apollo: Variable analysis:", {
        //   nameIsTableVar,
        //   companyIsTableVar,
        //   hasSelection,
        // });

        // Case 1: Both are table variables
        if (nameIsTableVar && companyIsTableVar) {
          //   console.log("Apollo: Executing Case 1 - Both table variables");
          const nameRef = parseTableColumn(combinedFullName);
          const companyRef = parseTableColumn(company);

          if (!nameRef || !companyRef) {
            setError("Invalid table variable reference.");
            return false;
          }

          // Both columns must be from the same table
          if (nameRef.table !== companyRef.table) {
            setError("Both columns must be from the same table.");
            return false;
          }

          const { rows, tableVar } = getTableRows(nameRef.table);
          if (!rows.length || !tableVar) {
            setError("No rows found in the referenced table.");
            return false;
          }

          // Filter rows if we have a selection
          let filteredRows = rows;
          if (hasSelection) {
            const selectionIds = new Set(selectedData.map((row) => row.id));
            filteredRows = rows.filter((row) => selectionIds.has(row.id));
          }

          //   console.log("Apollo: Processing rows:", {
          //     totalRows: rows.length,
          //     filteredRows: filteredRows.length,
          //   });

          let successCount = 0;
          let allResults: string[] = [];

          for (const row of filteredRows) {
            const nameValue = row[nameRef.column];
            const companyValue = row[companyRef.column];
            if (!nameValue || !companyValue) continue;

            try {
              const response = await fetch(`${API_URL}/api/apollo_enrich`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: nameValue,
                  company: companyValue,
                  api_key: apolloApiKey,
                  request_id: newRequestId,
                  ...(prompt.trim() && { prompt: prompt.trim() }),
                }),
              });

              let responseData;
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                responseData = await response.json();
              } else {
                const textResponse = await response.text();
                responseData = { message: textResponse };
              }

              // DEBUG: Print the whole response
              //   console.log(
              //     `Apollo response for ${nameValue} at ${companyValue}:`,
              //     responseData
              //   );

              const valueToSave =
                typeof responseData === "object" && responseData.analysis
                  ? responseData.analysis
                  : JSON.stringify(responseData);

              console.log("Apollo: Saving value:", {
                valueToSave,
                tableId,
                outputColumn,
                variableIdToUse,
                rowId: row.id,
              });

              // Save to variable if selected
              if (tableId && outputColumn) {
                // console.log("Apollo: Saving to table row");
                await useVariableStore
                  .getState()
                  .updateTableRow(tableId, row.id, {
                    [outputColumn]: valueToSave,
                  });
              } else if (variableIdToUse) {
                // Save to regular variable
                // console.log("Apollo: Saving to regular variable");
                await useVariableStore
                  .getState()
                  .updateVariable(variableIdToUse, valueToSave);
              }

              allResults.push(
                `${nameValue} at ${companyValue}: ${valueToSave}`
              );
              successCount++;
            } catch (err) {
              console.error(
                `Apollo error for ${nameValue} at ${companyValue}:`,
                err
              );
              const errorMessage = `Error: ${err instanceof Error ? err.message : String(err)}`;

              if (tableId && outputColumn) {
                await useVariableStore
                  .getState()
                  .updateTableRow(tableId, row.id, {
                    [outputColumn]: errorMessage,
                  });
              }
              allResults.push(
                `${nameValue} at ${companyValue}: ${errorMessage}`
              );
            }
          }

          const resultMessage = `Processed ${successCount} row(s).\n\n${allResults.join("\n\n")}`;
          setResult(resultMessage);
          //   console.log("=== APOLLO DEBUG END ===");
          return true;
        }

        // Case 2: Mixed mode - one table variable, one selection
        if (
          (nameIsTableVar && hasSelection) ||
          (companyIsTableVar && hasSelection)
        ) {
          const tableRef = nameIsTableVar
            ? parseTableColumn(combinedFullName) // Use combinedFullName here
            : parseTableColumn(company);
          if (!tableRef) {
            setError("Invalid table variable reference.");
            return false;
          }

          const { rows, tableVar } = getTableRows(tableRef.table);
          if (!rows.length || !tableVar) {
            setError("No rows found in the referenced table.");
            return false;
          }

          // Filter table rows to match selection
          const selectionIds = new Set(selectedData.map((row) => row.id));
          const filteredRows = rows.filter((row) => selectionIds.has(row.id));

          if (filteredRows.length === 0) {
            setError("No matching rows found between table and selection.");
            return false;
          }

          let successCount = 0;
          let allResults: string[] = [];

          for (const row of filteredRows) {
            let nameValue, companyValue;

            if (nameIsTableVar) {
              // Name comes from table variable - use the column name from the variable reference
              nameValue = row[tableRef.column];
              // Company comes from selection - use the form input value
              const selectionRow = selectedData.find((s) => s.id === row.id);
              if (selectionRow) {
                // Use the company form input to determine which column to use
                if (company.includes("{{") && company.includes("}}")) {
                  // Extract column name from {{table.column}} format
                  const columnMatch = company.match(/{{.*?\.(.*?)}}/);
                  if (columnMatch) {
                    const columnName = columnMatch[1];
                    companyValue = selectionRow[columnName];
                  }
                } else {
                  // If no table reference, use the first available column
                  const availableColumns = Object.keys(selectionRow).filter(
                    (key) => key !== "id"
                  );
                  companyValue =
                    availableColumns.length > 0
                      ? selectionRow[availableColumns[0]]
                      : "";
                }
              }
            } else {
              // Company comes from table variable - use the column name from the variable reference
              companyValue = row[tableRef.column];
              // Name comes from selection - use the form input value
              const selectionRow = selectedData.find((s) => s.id === row.id);
              if (selectionRow) {
                // Use the fullName form input to determine which column to use
                if (fullName.includes("{{") && fullName.includes("}}")) {
                  // Extract column name from {{table.column}} format
                  const columnMatch = fullName.match(/{{.*?\.(.*?)}}/);
                  if (columnMatch) {
                    const columnName = columnMatch[1];
                    nameValue = selectionRow[columnName];
                  }
                } else {
                  // If no table reference, use the first available column
                  const availableColumns = Object.keys(selectionRow).filter(
                    (key) => key !== "id"
                  );
                  nameValue =
                    availableColumns.length > 0
                      ? selectionRow[availableColumns[0]]
                      : "";
                }
              }
            }

            if (!nameValue || !companyValue) continue;

            try {
              const response = await fetch(`${API_URL}/api/apollo_enrich`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: nameValue,
                  company: companyValue,
                  api_key: apolloApiKey,
                  request_id: newRequestId,
                  ...(prompt.trim() && { prompt: prompt.trim() }),
                }),
              });

              let responseData;
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                responseData = await response.json();
              } else {
                const textResponse = await response.text();
                responseData = { message: textResponse };
              }

              // DEBUG: Print the whole response
              //   console.log(
              //     `Apollo response for ${nameValue} at ${companyValue} using API key ${apolloApiKey}:`,
              //     responseData
              //   );

              const valueToSave =
                typeof responseData === "object" && responseData.analysis
                  ? responseData.analysis
                  : JSON.stringify(responseData);

              // Save to variable if selected
              if (tableId && outputColumn) {
                await useVariableStore
                  .getState()
                  .updateTableRow(tableId, row.id, {
                    [outputColumn]: valueToSave,
                  });
              } else if (variableIdToUse) {
                // Save to regular variable
                await useVariableStore
                  .getState()
                  .updateVariable(variableIdToUse, valueToSave);
              }

              allResults.push(
                `${nameValue} at ${companyValue}: ${valueToSave}`
              );
              successCount++;
            } catch (err) {
              console.error(
                `Apollo error for ${nameValue} at ${companyValue}:`,
                err
              );
              const errorMessage = `Error: ${err instanceof Error ? err.message : String(err)}`;

              if (tableId && outputColumn) {
                await useVariableStore
                  .getState()
                  .updateTableRow(tableId, row.id, {
                    [outputColumn]: errorMessage,
                  });
              }
              allResults.push(
                `${nameValue} at ${companyValue}: ${errorMessage}`
              );
            }
          }

          const resultMessage = `Processed ${successCount} row(s).\n\n${allResults.join("\n\n")}`;
          setResult(resultMessage);
          return true;
        }

        // Case 3: Single value mode (default)
        if (!combinedFullName || !company) {
          setError("Please enter both name and company");
          return false;
        }

        // console.log("Apollo: Executing Case 3 - Single value mode");

        const response = await fetch(`${API_URL}/api/apollo_enrich`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: combinedFullName, // Use the combined full name
            company,
            api_key: apolloApiKey,
            request_id: newRequestId,
            ...(prompt.trim() && { prompt: prompt.trim() }),
          }),
        });

        let responseData;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
          // DEBUG: Print the whole response
          // console.log(
          //   `Apollo response for ${fullName} at ${company}:`,
          //   responseData
          // );
        } else {
          const textResponse = await response.text();
          responseData = { message: textResponse };
        }

        let displayMessage;
        if (typeof responseData === "object" && responseData.analysis) {
          displayMessage = responseData.analysis;
        } else if (typeof responseData === "object") {
          displayMessage = JSON.stringify(responseData, null, 2);
        } else {
          displayMessage =
            responseData.message || "Operation completed successfully";
        }
        setResult(displayMessage);

        // console.log("Apollo: Single value mode - saving to variable:", {
        //   selectedVariableId,
        //   displayMessage,
        // });

        // Save to variable if selected
        if (selectedVariableId) {
          const selectedVariable = Object.values(variables).find(
            (v) => v.id === selectedVariableId
          );
          if (selectedVariable) {
            // console.log(
            //   "Apollo: Found selected variable, updating:",
            //   selectedVariableId
            // );
            await useVariableStore
              .getState()
              .updateVariable(selectedVariableId, displayMessage);
          } else {
            // console.log(
            //   "Apollo: Selected variable not found:",
            //   selectedVariableId
            // );
          }
        } else {
          // console.log("Apollo: No selectedVariableId provided");
        }

        // console.log("=== APOLLO DEBUG END ===");
        return true;
      } catch (err: any) {
        console.error("Apollo: Error in processBlock:", err);
        setError(
          err.message || "An error occurred while processing the Apollo request"
        );
        return false;
      } finally {
        setIsLoading(false);
        setIsRunning(false);
        setRequestId(null);
      }
    };

    React.useImperativeHandle(ref, () => ({
      processBlock,
      setSelectedVariableId, // Expose this method
    }));

    return (
      <div className="bg-gray-900 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span role="img" aria-label="Apollo" className="text-2xl">
              🧑‍🚀
            </span>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-100">
                  Apollo Agent {blockNumber}
                </h3>
                <BlockNameEditor
                  blockName={
                    currentBlock?.name || `Apollo Agent ${blockNumber}`
                  }
                  blockNumber={blockNumber}
                  onNameUpdate={updateBlockName}
                />
              </div>
              <Badge
                variant="secondary"
                className="text-xs bg-blue-600 text-white"
              >
                beta
              </Badge>
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
                    Apollo Agent
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    This agent enriches contact data using Apollo.io. Enter a
                    full name and company to search for more information.
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
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-gray-400 hover:text-gray-100"
              >
                <FiSettings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <Button
                variant="ghost"
                className="w-full justify-start text-red-500 hover:bg-red-950 hover:text-red-400"
                onClick={() => onDeleteBlock(blockNumber)}
              >
                Delete Block
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-blue-500 hover:bg-blue-950 hover:text-blue-400"
                onClick={() => {
                  onCopyBlock?.(blockNumber);
                  toast.success("Block copied!");
                }}
              >
                Copy Block
              </Button>
            </PopoverContent>
          </Popover>
        </div>
        <div className="p-4 space-y-4">
          {/* Full Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Full Name (optional)
            </label>
            <input
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter full name (or use first/last name below)"
            />
          </div>

          {/* First Name and Last Name Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                First Name
              </label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter first name"
                disabled={fullName.trim() !== ""} // Disable if full name is provided
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Last Name
              </label>
              <input
                className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter last name"
                disabled={fullName.trim() !== ""} // Disable if full name is provided
              />
            </div>
          </div>

          {/* Company Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Company</label>
            <input
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 text-gray-100"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name"
            />
          </div>
          {/* NEW: Prompt input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">
              Prompt (optional)
            </label>
            <CustomEditor
              value={prompt}
              onChange={setPrompt}
              placeholder="Enter prompt (optional)"
              className=""
              disabled={false}
              showListButtons={true}
            />
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
            />
          </div>
          {error && <div className="text-red-500 text-sm">{error}</div>}
          {result && (
            <div
              className="p-4 bg-gray-800 rounded-lg border border-gray-700"
              style={{
                maxHeight: 250, // or 200/300px as you prefer
                overflowY: "auto",
                fontSize: "0.92rem", // slightly smaller font
                whiteSpace: "pre-wrap",
              }}
            >
              <h4 className="text-sm font-medium mb-2 text-gray-300">Result</h4>
              <div className="text-gray-200">{result}</div>
              {selectedVariableId && (
                <div className="mt-2 text-sm text-green-400">
                  Saved as{" "}
                  {
                    Object.values(variables).find(
                      (v) => v.id === selectedVariableId
                    )?.name
                  }
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
            runLabel="Run Apollo"
            runningLabel="Processing..."
            disabled={isLoading || isProcessing}
          />
        </div>
      </div>
    );
  }
);

ApolloAgent.displayName = "ApolloAgent";

export default ApolloAgent;
