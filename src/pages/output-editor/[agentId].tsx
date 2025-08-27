"use client";

import { CSSProperties, useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/tools/firebase";
import Layout from "@/components/Layout";
import Header from "@/components/custom_components/header";
import EditableDataGrid from "@/components/custom_components/EditableDataGrid";
import { useAgentStore } from "@/lib/agentStore";
import { useVariableStore } from "@/lib/variableStore";
import { Block, Variable } from "@/types/types";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Upload } from "lucide-react";
import AddVariableDialog from "@/components/custom_components/AddVariableDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EditorBlock from "@/components/custom_components/EditorBlock";
import { api } from "@/tools/api";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import SearchPreviewDialog from "@/components/custom_components/SearchPreviewDialog";
import AddSourceDialog from "@/components/custom_components/AddSourceDialog";

// Define types for navigation items
type NavigationItem =
  | {
      type: "table";
      variable: Variable;
      displayName: string;
    }
  | {
      type: "input_intermediate";
      variables: Variable[];
      displayName: string;
    };

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  backgroundColor: "#000000",
  color: "#f3f4f6",
};

const mainStyle: CSSProperties = {
  flex: "1",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

export default function OutputEditor() {
  const router = useRouter();
  const { agentId } = router.query;
  const { loadAgent, currentAgent } = useAgentStore();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [selection, setSelection] = useState<any[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(
    undefined
  );
  const [isAddVariableDialogOpen, setIsAddVariableDialogOpen] = useState(false);
  const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false);
  const [loadingBlocks, setLoadingBlocks] = useState<Set<string>>(new Set());
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Load agent data
  useEffect(() => {
    async function loadAgentData() {
      if (agentId && typeof agentId === "string") {
        console.log("Loading agent for output editor:", agentId);
        try {
          await loadAgent(agentId);
          const currentAgent = useAgentStore.getState().currentAgent;

          if (currentAgent) {
            // Load variables for the agent
            await useVariableStore.getState().loadVariables(agentId);
            console.log("Variables loaded for agent:", agentId);
          }
        } catch (error) {
          console.error("Error loading agent:", error);
          toast.error("Failed to load agent");
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadAgentData();
  }, [agentId, loadAgent]);

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login/signup");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Get table variables from the store
  const { variables: storeVariables } = useVariableStore();

  // Function to get navigation items (table variables + one group for input/intermediate)
  const getNavigationItems = (): NavigationItem[] => {
    const allVariables = Object.values(storeVariables).filter(
      (variable) => variable.agentId === agentId
    );

    const tableVariables = allVariables.filter((v) => v.type === "table");
    const inputIntermediateVariables = allVariables.filter(
      (v) => v.type === "input" || v.type === "intermediate"
    );

    const navigationItems: NavigationItem[] = [];

    // Add table variables (each as separate item)
    tableVariables.forEach((tableVar) => {
      // Get the number of rows for this table
      const rowCount = Array.isArray(tableVar.value)
        ? tableVar.value.length
        : 0;
      const displayName = `${tableVar.name} (${rowCount} rows)`;

      navigationItems.push({
        type: "table",
        variable: tableVar,
        displayName: displayName,
      });
    });

    // Add input/intermediate variables as one group (if any exist)
    if (inputIntermediateVariables.length > 0) {
      navigationItems.push({
        type: "input_intermediate",
        variables: inputIntermediateVariables,
        displayName: "Input & Intermediate Variables",
      });
    }

    return navigationItems;
  };

  // Function to get Firebase data from current navigation item
  const getFirebaseDataFromVariables = () => {
    const navigationItems = getNavigationItems();

    // If we have items and the current index is valid
    if (
      navigationItems.length > 0 &&
      currentTableIndex < navigationItems.length
    ) {
      const currentItem = navigationItems[currentTableIndex];

      // Handle table variables (existing behavior)
      if (currentItem.type === "table") {
        return {
          columns: currentItem.variable.columns || [],
          value: Array.isArray(currentItem.variable.value)
            ? currentItem.variable.value
            : [],
        };
      }

      // Handle input/intermediate variables group
      if (currentItem.type === "input_intermediate") {
        const columns = currentItem.variables.map((v) => v.name);
        const values = currentItem.variables.map((v) =>
          typeof v.value === "string" ? v.value : String(v.value || "")
        );

        // Create single row with all values
        const tableData = [
          {
            id: "values-row",
            ...columns.reduce(
              (acc, col, index) => {
                acc[col] = values[index];
                return acc;
              },
              {} as Record<string, any>
            ),
          },
        ];

        return {
          columns: columns,
          value: tableData,
        };
      }
    }

    // Return placeholder data when no variables exist
    return {
      columns: ["no values yet"],
      value: [
        {
          id: "placeholder-row",
          "no values yet": "start adding variables to get started!",
        },
      ],
    };
  };

  // Navigation functions
  const goToPreviousVariable = () => {
    const navigationItems = getNavigationItems();
    if (navigationItems.length > 0) {
      setCurrentTableIndex((prev) =>
        prev > 0 ? prev - 1 : navigationItems.length - 1
      );
    }
  };

  const goToNextVariable = () => {
    const navigationItems = getNavigationItems();
    if (navigationItems.length > 0) {
      setCurrentTableIndex((prev) =>
        prev < navigationItems.length - 1 ? prev + 1 : 0
      );
    }
  };

  // Helper function to get current display name
  const getCurrentVariableName = () => {
    const navigationItems = getNavigationItems();
    if (
      navigationItems.length > 0 &&
      currentTableIndex < navigationItems.length
    ) {
      return navigationItems[currentTableIndex].displayName;
    }
    return `Variable ${currentTableIndex + 1}`;
  };

  // Reset variable index when variables change
  useEffect(() => {
    const navigationItems = getNavigationItems();
    if (currentTableIndex >= navigationItems.length) {
      setCurrentTableIndex(0);
    }
  }, [storeVariables, currentTableIndex]);

  // Handle adding new variables
  const handleAddVariable = (newVariable: Variable) => {
    // This will be handled by the AddVariableDialog
    toast.success(`Variable "${newVariable.name}" added successfully`);
  };

  // Handle opening the add variable dialog
  const handleOpenAddVariableDialog = () => {
    if (agentId) {
      setIsAddVariableDialogOpen(true);
    }
  };

  // Handle variable addition completion
  const handleAddVariableComplete = (variable: Variable) => {
    handleAddVariable(variable);
    setIsAddVariableDialogOpen(false);
  };

  const handleBlockRun = async (block: Block, mode: "selection" | "column") => {
    try {
      // Set loading state for this block
      setLoadingBlocks((prev) => new Set(prev).add(block.id));

      console.log("=== OUTPUT EDITOR BLOCK RUN DEBUG ===");
      console.log(`Running block ${block.blockNumber} in ${mode} mode`);
      console.log("Block type:", block.type);
      console.log("Full block data:", JSON.stringify(block, null, 2));

      // Get the current navigation item (table or variables being displayed)
      const navigationItems = getNavigationItems();
      const currentItem = navigationItems[currentTableIndex];
      console.log("Current navigation item:", currentItem);

      if (!currentItem) {
        toast.error("No data available to process");
        return;
      }

      // Determine what data to process based on mode
      let selectedRows: any[] = [];

      if (mode === "selection" && selection.length > 0) {
        // Process only the selected rows
        selectedRows = selection;
        console.log(
          `Processing ${selectedRows.length} selected rows:`,
          selectedRows
        );
      } else if (currentItem.type === "table") {
        // Process the entire table
        const tableData = Array.isArray(currentItem.variable.value)
          ? currentItem.variable.value
          : [];
        selectedRows = tableData;
        console.log(
          `Processing entire table with ${selectedRows.length} rows:`,
          selectedRows
        );
      } else {
        // Process input/intermediate variables
        toast.error(
          "Selection mode not supported for input/intermediate variables"
        );
        return;
      }

      if (selectedRows.length === 0) {
        toast.error("No data available to process");
        return;
      }

      // Get block configuration from Firebase
      const userId = auth.currentUser?.uid;
      if (!userId || !agentId || typeof agentId !== "string") {
        toast.error("Authentication error");
        return;
      }

      console.log("About to execute block with data:", {
        selectedRows,
        mode,
      });

      // Execute block based on type
      await executeBlock(block, selectedRows, mode);

      toast.success(
        `Block ${block.blockNumber} executed in ${mode} mode on ${selectedRows.length} rows`
      );
    } catch (error) {
      console.error("Error running block:", error);
      toast.error("Failed to run block");
    } finally {
      // Clear loading state for this block
      setLoadingBlocks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(block.id);
        return newSet;
      });
    }
  };

  // Helper function to execute different block types
  const executeBlock = async (
    block: Block,
    selectedRows: any[],
    mode: "selection" | "column"
  ) => {
    switch (block.type) {
      case "apolloagent":
        await executeApolloAgent(block, selectedRows, mode);
        break;
      case "searchagent":
        await executeSearchAgent(block, selectedRows, mode);
        break;
      case "webagent":
        await executeWebAgent(block, selectedRows, mode);
        break;
      case "agent":
        await executeAgentBlock(block, selectedRows, mode);
        break;
      case "codeblock":
        await executeCodeBlock(block, selectedRows, mode);
        break;
      case "deepresearchagent":
        await executeDeepResearchAgent(block, selectedRows, mode);
        break;
      default:
        toast.error(
          `Block type ${block.type} not yet supported in output editor`
        );
    }
  };

  // Helper function to extract input from selected rows (copied from notebook)
  const getInputFromRow = (
    row: any,
    blockType: string,
    selectedColumn?: string,
    formParams?: any
  ) => {
    switch (blockType) {
      case "webagent":
        if (selectedColumn) {
          return row[selectedColumn] || "";
        } else {
          // Fallback to URL-like values or first available value
          return (
            row.url ||
            row.link ||
            row.countries ||
            Object.values(row).find(
              (v) => typeof v === "string" && v.startsWith("http")
            ) ||
            Object.values(row)[0] ||
            ""
          );
        }
      case "searchagent":
        return selectedColumn
          ? row[selectedColumn]
          : Object.values(row)[0] || "";
      case "agent":
        return selectedColumn
          ? row[selectedColumn]
          : Object.values(row)[0] || "";
      case "apolloagent":
        // For Apollo agents, parse the form inputs to determine which columns to extract
        const fullNameInput = formParams?.fullName || "";
        const companyInput = formParams?.company || "";

        // Extract name value based on form input
        let nameValue = "";
        if (fullNameInput === "@selection") {
          const selectedColumn = formParams?.selectedColumn;
          if (selectedColumn && row[selectedColumn] !== undefined) {
            nameValue = String(row[selectedColumn]);
          } else {
            const firstValue = Object.values(row).find(
              (v) => v !== null && v !== undefined
            );
            nameValue = firstValue ? String(firstValue) : "";
          }
        } else if (
          fullNameInput.includes("{{") &&
          fullNameInput.includes("}}")
        ) {
          const match = fullNameInput.match(/{{([^}]+)}}/);
          if (match) {
            const [tableName, columnName] = match[1].split(".");
            const value = row[columnName];
            nameValue = value !== undefined ? String(value) : "";
          }
        } else {
          nameValue = fullNameInput;
        }

        // Extract company value based on form input
        let companyValue = "";
        if (companyInput === "@selection") {
          const selectedColumn = formParams?.selectedColumn;
          if (selectedColumn && row[selectedColumn] !== undefined) {
            companyValue = String(row[selectedColumn]);
          } else {
            const values = Object.values(row).filter(
              (v) => v !== null && v !== undefined
            );
            companyValue = values.length > 1 ? String(values[1]) : "";
          }
        } else if (companyInput.includes("{{") && companyInput.includes("}}")) {
          const match = companyInput.match(/{{([^}]+)}}/);
          if (match) {
            const [tableName, columnName] = match[1].split(".");
            const value = row[columnName];
            companyValue = value !== undefined ? String(value) : "";
          }
        } else {
          companyValue = companyInput;
        }

        if (nameValue && companyValue) {
          return `${nameValue}|${companyValue}`;
        } else {
          const values = Object.values(row).filter(
            (v) => v && String(v).trim()
          );
          if (values.length >= 2) {
            return `${String(values[0])}|${String(values[1])}`;
          }
          return values[0] ? String(values[0]) : "";
        }
      default:
        return row.countries || Object.values(row)[0] || "";
    }
  };

  // Helper function to replace @selection placeholder with actual value
  const replaceSelectionPlaceholder = (query: string, replacement: string) => {
    return query.replace(/@selection/g, replacement);
  };

  // Define which API endpoint to call for each block type
  const getApiCall = (blockType: string, input: string, params: any) => {
    switch (blockType) {
      case "webagent":
        return api.post("/scrape", {
          url: input,
          prompt: params.prompt || "",
        });
      case "searchagent":
        // Replace @selection placeholder with the actual input value
        const processedQuery = replaceSelectionPlaceholder(
          params.query || "",
          input
        );
        return api.post("/api/search", {
          query: processedQuery,
          engine: params.engine || "search",
          num: params.limit || 5,
        });
      case "agent":
        return api.post("/api/call-model", {
          userPrompt: params.userPrompt || "",
          systemPrompt: params.systemPrompt || "",
        });
      case "apolloagent":
        const [name, company] = input.split("|");
        return api.post("/api/apollo_enrich", {
          name: name || input,
          company: company || "",
          ...(params.prompt && { prompt: params.prompt }),
        });
      default:
        throw new Error(`Selection not supported for block type: ${blockType}`);
    }
  };

  // Apollo Agent execution
  const executeApolloAgent = async (
    block: any,
    selectedRows: any[],
    mode: "selection" | "column"
  ) => {
    try {
      console.log("=== APOLLO AGENT EXECUTION DEBUG ===");
      console.log("Block configuration:", {
        prompt: block.prompt,
        outputVariable: block.outputVariable,
      });
      console.log("Selected rows:", selectedRows);

      // Get Apollo API key
      const apolloApiKey = await getApolloApiKey();

      // Process each selected row
      for (const row of selectedRows) {
        try {
          console.log(`Processing row:`, row);

          const input = getInputFromRow(row, block.type, selectedColumn, {
            fullName: block.fullName || "@selection",
            company: block.company || "@selection",
            selectedColumn,
          });

          if (!input) {
            console.log(`Skipping row ${row.id} - no input value`);
            continue;
          }

          const response = await getApiCall(block.type, input, {
            prompt: block.prompt,
            fullName: block.fullName,
            company: block.company,
            selectedColumn,
          });

          const result = response.analysis || JSON.stringify(response);

          // Save to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]: result,
              });
          }
        } catch (error) {
          console.error(`Error processing row ${row.id}:`, error);

          // Save error to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]:
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
          }
        }
      }
    } catch (error) {
      console.error("Error in Apollo Agent execution:", error);
      throw error;
    }
  };

  // Search Agent execution
  const executeSearchAgent = async (
    block: any,
    selectedRows: any[],
    mode: "selection" | "column"
  ) => {
    try {
      console.log("=== SEARCH AGENT EXECUTION DEBUG ===");
      console.log("Block configuration:", {
        engine: block.engine,
        limit: block.limit,
        outputVariable: block.outputVariable,
      });
      console.log("Selected rows:", selectedRows);

      // Process each selected row as a search query
      for (const row of selectedRows) {
        try {
          console.log(`Processing row:`, row);

          const input = getInputFromRow(row, block.type, selectedColumn);

          if (!input) {
            console.log(`Skipping row ${row.id} - no input value`);
            continue;
          }

          const response = await getApiCall(block.type, input, {
            query: block.query,
            engine: block.engine,
            limit: block.limit,
          });

          const result = response.analysis || JSON.stringify(response);

          // Save to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            console.log(
              "Saving to output column:",
              block.outputVariable.columnName
            );
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]: result,
              });
          }
        } catch (error) {
          console.error(`Error processing row ${row.id}:`, error);
          console.error("Error details:", {
            row,
            block,
            error: error instanceof Error ? error.message : String(error),
          });

          // Save error to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]:
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
          }
        }
      }
    } catch (error) {
      console.error("Error in Search Agent execution:", error);
      throw error;
    }
  };

  // Web Agent execution
  const executeWebAgent = async (
    block: any,
    selectedRows: any[],
    mode: "selection" | "column"
  ) => {
    try {
      console.log("=== WEB AGENT EXECUTION DEBUG ===");
      console.log("Block configuration:", {
        prompt: block.prompt,
        outputVariable: block.outputVariable,
      });
      console.log("Selected rows:", selectedRows);
      console.log("Mode:", mode);

      // Process each selected row as a URL
      for (const row of selectedRows) {
        try {
          console.log(`Processing row:`, row);

          const input = getInputFromRow(row, block.type, selectedColumn);

          if (!input) {
            console.log(`Skipping row ${row.id} - no input value`);
            continue;
          }

          const response = await getApiCall(block.type, input, {
            prompt: block.prompt,
          });

          const result =
            response.analysis || response.markdown || JSON.stringify(response);

          console.log("Processing result:", result);

          // Save to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            console.log(
              "Saving to output column:",
              block.outputVariable.columnName
            );
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]: result,
              });
          }
        } catch (error) {
          console.error(`Error processing row ${row.id}:`, error);
          console.error("Error details:", {
            row,
            block,
            error: error instanceof Error ? error.message : String(error),
          });

          // Save error to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]:
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
          }
        }
      }
    } catch (error) {
      console.error("Error in Web Agent execution:", error);
      throw error;
    }
  };

  // Agent Block execution (for LLM-based blocks)
  const executeAgentBlock = async (
    block: any,
    selectedRows: any[],
    mode: "selection" | "column"
  ) => {
    try {
      console.log("=== AGENT BLOCK EXECUTION DEBUG ===");
      console.log("Block configuration:", {
        systemPrompt: block.systemPrompt,
        userPrompt: block.userPrompt,
        saveAsCsv: block.saveAsCsv,
        outputVariable: block.outputVariable,
      });
      console.log("Selected rows:", selectedRows);

      // Process each selected row with the agent's prompts
      for (const row of selectedRows) {
        try {
          console.log(`Processing row:`, row);

          const input = getInputFromRow(row, block.type, selectedColumn);

          if (!input) {
            console.log(`Skipping row ${row.id} - no input value`);
            continue;
          }

          const response = await getApiCall(block.type, input, {
            userPrompt: block.userPrompt,
            systemPrompt: block.systemPrompt,
          });

          const result = response.response || JSON.stringify(response);

          console.log("Processing result:", result);

          // Save to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            console.log(
              "Saving to output column:",
              block.outputVariable.columnName
            );
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]: result,
              });
          }
        } catch (error) {
          console.error(`Error processing row ${row.id}:`, error);
          console.error("Error details:", {
            row,
            block,
            error: error instanceof Error ? error.message : String(error),
          });

          // Save error to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]:
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
          }
        }
      }
    } catch (error) {
      console.error("Error in Agent Block execution:", error);
      throw error;
    }
  };

  // Code Block execution
  const executeCodeBlock = async (
    block: any,
    selectedRows: any[],
    mode: "selection" | "column"
  ) => {
    try {
      // Process each selected row with the code
      for (const row of selectedRows) {
        try {
          const input = getInputFromRow(row, block.type, selectedColumn);

          if (!input) {
            console.log(`Skipping row ${row.id} - no input value`);
            continue;
          }

          const response = await api.post("/api/execute-code", {
            code: block.code || "",
            language: block.language || "python",
            input_data: input,
            request_id: crypto.randomUUID(),
          });

          const result = response.result || JSON.stringify(response);

          // Save to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]: result,
              });
          }
        } catch (error) {
          console.error(`Error processing row ${row.id}:`, error);

          // Save error to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]:
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
          }
        }
      }
    } catch (error) {
      console.error("Error in Code Block execution:", error);
      throw error;
    }
  };

  // Deep Research Agent execution
  const executeDeepResearchAgent = async (
    block: any,
    selectedRows: any[],
    mode: "selection" | "column"
  ) => {
    try {
      // Process each selected row as a research topic
      for (const row of selectedRows) {
        try {
          const input = getInputFromRow(row, block.type, selectedColumn);

          if (!input) {
            console.log(`Skipping row ${row.id} - no input value`);
            continue;
          }

          const response = await api.post("/deepresearch", {
            prompt: input,
            search_engine: block.searchEngine || "firecrawl",
            request_id: crypto.randomUUID(),
          });

          const result = response.message || JSON.stringify(response);

          // Save to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]: result,
              });
          }
        } catch (error) {
          console.error(`Error processing row ${row.id}:`, error);

          // Save error to output column
          if (
            block.outputVariable?.type === "table" &&
            block.outputVariable?.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, row.id, {
                [block.outputVariable.columnName]:
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
          }
        }
      }
    } catch (error) {
      console.error("Error in Deep Research Agent execution:", error);
      throw error;
    }
  };

  // Helper function to get Apollo API key (copied from ApolloAgent)
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
        throw new Error("Apollo API key not found. Please add it in Settings.");
      }
    } catch (error) {
      console.error("Error fetching Apollo API key:", error);
      throw new Error(
        "Failed to fetch Apollo API key. Please check your settings."
      );
    }
  };

  // Handle preview confirmation
  const handlePreviewConfirm = async (
    selectedResults: { [rowId: string]: string[] },
    targetVariableId: string
  ) => {
    const navigationItems = getNavigationItems();
    const currentItem = navigationItems[currentTableIndex];

    if (currentItem.type === "table") {
      const tableVariable = currentItem.variable;
      const updatedRows = Array.isArray(tableVariable.value)
        ? tableVariable.value.map((row) => {
            if (row.id === "values-row") {
              return {
                ...row,
                ...selectedResults[row.id]?.reduce(
                  (acc, url) => {
                    const [name, value] = url.split("|");
                    acc[name] = value;
                    return acc;
                  },
                  {} as Record<string, any>
                ),
              };
            }
            return row;
          })
        : [];

      // Fix: Pass just the value, not the entire variable object
      await useVariableStore
        .getState()
        .updateVariable(tableVariable.id, updatedRows);
    } else if (currentItem.type === "input_intermediate") {
      const inputIntermediateVariable = currentItem.variables.find(
        (v) => v.name === "Search Results"
      );
      if (inputIntermediateVariable) {
        const updatedRows = Array.isArray(inputIntermediateVariable.value)
          ? inputIntermediateVariable.value.map((row) => {
              if (row.id === "values-row") {
                return {
                  ...row,
                  ...selectedResults[row.id]?.reduce(
                    (acc, url) => {
                      const [name, value] = url.split("|");
                      acc[name] = value;
                      return acc;
                    },
                    {} as Record<string, any>
                  ),
                };
              }
              return row;
            })
          : [];

        // Fix: Pass just the value, not the entire variable object
        await useVariableStore
          .getState()
          .updateVariable(inputIntermediateVariable.id, updatedRows);
      }
    }

    setIsPreviewDialogOpen(false);
    setPreviewData([]);
    toast.success("Search results confirmed and saved.");
  };

  // Add this handler function
  const handleOpenTools = () => {
    setIsAddSourceDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <div style={pageStyle}>
          <div className="flex items-center justify-center h-screen">
            <div className="text-white">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  const navigationItems = getNavigationItems();
  const blocks = currentAgent?.blocks || [];

  return (
    <Layout>
      <div style={pageStyle}>
        {/* Header with back button and agent info */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push(`/notebook?agentId=${agentId}`)}
              className="text-white hover:bg-gray-800"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Notebook
            </Button>
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Output Editor
                </h1>
                {currentAgent && (
                  <p className="text-gray-400 text-sm">
                    Agent: {currentAgent.name}
                  </p>
                )}
              </div>
              <Select defaultValue="table">
                <SelectTrigger className="w-[140px] h-8 text-xs bg-gray-700 border-gray-600 text-gray-300">
                  <SelectValue placeholder="Output Format" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem
                    value="table"
                    className="text-white hover:bg-gray-700"
                  >
                    Table
                  </SelectItem>
                  <SelectItem
                    value="document"
                    disabled
                    className="text-gray-500 cursor-not-allowed"
                  >
                    Document (Coming Soon)
                  </SelectItem>
                  <SelectItem
                    value="slides"
                    disabled
                    className="text-gray-500 cursor-not-allowed"
                  >
                    Slides (Coming Soon)
                  </SelectItem>
                  <SelectItem
                    value="emails"
                    disabled
                    className="text-gray-500 cursor-not-allowed"
                  >
                    Emails (Coming Soon)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Upload Table as Variable button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenTools}
            className="text-xs bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
          >
            <Upload className="h-3 w-3 mr-1" />
            Upload Table as Variable
          </Button>
        </div>

        <main style={mainStyle}>
          <div className="flex w-full h-[calc(100vh-200px)] gap-4">
            {/* Main Output Editor */}
            <div className="flex-1 min-w-0">
              {/* Variable Navigation Controls */}
              {navigationItems.length > 1 && (
                <div className="flex items-center justify-between mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
                  <button
                    onClick={goToPreviousVariable}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    <span>←</span> Previous
                  </button>

                  <div className="text-center">
                    <div className="text-white font-medium">
                      {getCurrentVariableName()}
                    </div>
                    <div className="text-gray-400 text-sm">
                      {currentTableIndex + 1} of {navigationItems.length}
                    </div>
                  </div>

                  <button
                    onClick={goToNextVariable}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                  >
                    Next <span>→</span>
                  </button>
                </div>
              )}

              {/* EditableDataGrid */}
              <EditableDataGrid
                firebaseData={getFirebaseDataFromVariables()}
                tableWidth="100%"
                tableHeight="100%"
                currentTableId={(() => {
                  if (
                    navigationItems.length > 0 &&
                    currentTableIndex < navigationItems.length
                  ) {
                    const currentItem = navigationItems[currentTableIndex];
                    return currentItem.type === "table"
                      ? currentItem.variable.id
                      : undefined;
                  }
                  return undefined;
                })()}
                currentAgentId={agentId as string}
                onAddVariable={handleAddVariable}
                onDataChange={(updatedData) => {
                  const navigationItems = getNavigationItems();
                  if (
                    navigationItems.length > 0 &&
                    currentTableIndex < navigationItems.length
                  ) {
                    const currentItem = navigationItems[currentTableIndex];

                    // Handle table variables (existing behavior)
                    if (currentItem.type === "table") {
                      useVariableStore
                        .getState()
                        .updateVariable(currentItem.variable.id, updatedData);
                    }

                    // Handle input/intermediate variables group
                    else if (currentItem.type === "input_intermediate") {
                      // Update each input/intermediate variable with its new value
                      if (updatedData.length > 0) {
                        const newValues = updatedData[0];

                        // Update each variable with its new value
                        currentItem.variables.forEach((variable) => {
                          if (newValues[variable.name] !== undefined) {
                            useVariableStore
                              .getState()
                              .updateVariable(
                                variable.id,
                                newValues[variable.name]
                              );
                          }
                        });
                      }
                    }
                  }
                }}
                onSelectionChange={(
                  selectedRows,
                  selectedData,
                  selectedColumn
                ) => {
                  setSelection(selectedData);
                  setSelectedColumn(selectedColumn);
                }}
                onColumnsChange={(newColumns) => {
                  const navigationItems = getNavigationItems();
                  if (
                    navigationItems.length > 0 &&
                    currentTableIndex < navigationItems.length
                  ) {
                    const currentItem = navigationItems[currentTableIndex];

                    // Only handle column changes for table variables
                    if (currentItem.type === "table") {
                      const currentColumns = currentItem.variable.columns || [];

                      // Find new columns that need to be added
                      const columnsToAdd = newColumns.filter(
                        (col) => !currentColumns.includes(col)
                      );

                      // Find columns that need to be removed
                      const columnsToRemove = currentColumns.filter(
                        (col) => !newColumns.includes(col)
                      );

                      // Add each new column to the table
                      columnsToAdd.forEach((columnName) => {
                        useVariableStore
                          .getState()
                          .addColumnToTable(
                            currentItem.variable.id,
                            columnName
                          );
                      });

                      // Remove each deleted column from the table
                      columnsToRemove.forEach((columnName) => {
                        useVariableStore
                          .getState()
                          .removeColumnFromTable(
                            currentItem.variable.id,
                            columnName
                          );
                      });
                    }
                  }
                }}
              />
            </div>

            {/* Blocks Sidebar */}
            <div className="w-[300px] min-w-[300px] border-l border-gray-700 bg-gray-900 p-4">
              <h3 className="text-lg font-semibold text-white mb-4">
                Agent Tools
              </h3>
              <div className="h-[calc(100vh-300px)] overflow-y-auto space-y-2">
                {blocks.map((block, index) => {
                  // Get row count for the current variable being displayed
                  const navigationItems = getNavigationItems();
                  const currentItem = navigationItems[currentTableIndex];
                  let rowCount = 0;

                  if (currentItem?.type === "table") {
                    rowCount = Array.isArray(currentItem.variable.value)
                      ? currentItem.variable.value.length
                      : 0;
                  }

                  return (
                    <EditorBlock
                      key={block.id}
                      block={block}
                      hasSelection={selection.length > 0}
                      rowCount={rowCount}
                      onRun={handleBlockRun}
                      onOpen={(block) => {
                        console.log(
                          `Opening block ${block.blockNumber} for editing`
                        );
                        // TODO: Implement block configuration dialog
                      }}
                      isLoading={loadingBlocks.has(block.id)}
                    />
                  );
                })}
                {blocks.length === 0 && (
                  <div className="text-gray-400 text-sm text-center py-4">
                    No blocks found
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Add Variable Dialog */}
        {agentId && (
          <AddVariableDialog
            open={isAddVariableDialogOpen}
            onOpenChange={setIsAddVariableDialogOpen}
            onAddVariable={handleAddVariableComplete}
            currentAgentId={agentId as string}
          />
        )}

        {/* Add the SearchPreviewDialog */}
        <SearchPreviewDialog
          open={isPreviewDialogOpen}
          onOpenChange={(open) => {
            setIsPreviewDialogOpen(open);
            if (!open) {
              setPreviewData([]);
            }
          }}
          previewData={previewData}
          onConfirm={handlePreviewConfirm}
          agentId={agentId as string}
        />

        {/* Add the AddSourceDialog */}
        <AddSourceDialog
          open={isAddSourceDialogOpen}
          onOpenChange={setIsAddSourceDialogOpen}
          onAddSource={() => {}}
          openToTableVariable={true}
        />
      </div>
    </Layout>
  );
}
