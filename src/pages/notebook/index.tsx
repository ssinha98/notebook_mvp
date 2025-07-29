"use client";

import { CSSProperties, useState, useRef, useEffect } from "react";
import Header from "@/components/custom_components/header";
import Footer from "@/components/custom_components/footer";
import CollapsibleBox from "@/components/custom_components/CollapsibleBox";
import React from "react";
import ApiKeySheet from "@/components/custom_components/ApiKeySheet";
import ToolsSheet from "@/components/custom_components/ToolsSheet";
import { Block, SourceInfo, Variable } from "@/types/types";
import usePromptStore from "@/lib/store";
import { api } from "@/tools/api";
import { AgentBlockRef } from "@/components/custom_components/AgentBlock";
import posthog from "posthog-js";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
// import { Button } from "@/components/ui/button"; // commented out
import { useSourceStore } from "@/lib/store";
import { useRouter } from "next/router";
import { auth } from "@/tools/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAgentStore } from "@/lib/agentStore";
import AgentHeader from "@/components/custom_components/AgentHeader";
import { SaveOutlined } from "@ant-design/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CheckInBlock from "@/components/custom_components/CheckInBlock";
import ContactBlock from "@/components/custom_components/ContactBlock";
import TransformBlock from "@/components/custom_components/TransformBlock";
// import { useBlockManager } from "@/hooks/useBlockManager";
import AgentBlock from "@/components/custom_components/AgentBlock";
import { useBlockManager } from "@/hooks/useBlockManager";
import { getBlockList } from "@/lib/store";
import SearchAgent from "@/components/custom_components/SearchAgent";
import Layout from "@/components/Layout";
import { useVariableStore } from "@/lib/variableStore";
import WebAgent from "@/components/custom_components/WebAgent";
import CodeBlock from "@/components/custom_components/CodeBlock";
import MakeBlock from "@/components/custom_components/MakeBlock";
import ExcelAgent from "@/components/custom_components/ExcelAgent";
import InstagramAgent from "@/components/custom_components/InstagramAgent";
import RateAgentRun from "@/components/custom_components/RateAgentRun";
import DeepResearchAgent from "@/components/custom_components/DeepResearchAgent";
import PipedriveAgent from "@/components/custom_components/PipedriveAgent";
import { Info } from "lucide-react";
import InputVariablesSheet from "@/components/custom_components/InputVariablesSheet";
import { ChevronDown } from "lucide-react";
import DataVizAgent, {
  DataVizAgentRef,
} from "@/components/custom_components/DataVizAgent";
import ClickUpAgent from "@/components/custom_components/ClickUpAgent";
import GoogleDriveAgent from "@/components/custom_components/GoogleDriveAgent";
import { useAutoSave } from "@/hooks/useAutoSave";
import { toast } from "sonner";
import EditableDataGrid from "../../components/custom_components/EditableDataGrid";
import ChatSidebar from "../../components/custom_components/ChatSidebar";
import ApolloAgent from "@/components/custom_components/ApolloAgent";
import SearchPreviewDialog from "@/components/custom_components/SearchPreviewDialog";
import { PreviewRow } from "@/types/types";
import FloatingAgentNav from "@/components/custom_components/FloatingAgentNav";
import AddSourceDialog from "@/components/custom_components/AddSourceDialog";

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  backgroundColor: "#141414",
  color: "#f3f4f6",
};

const mainStyle: CSSProperties = {
  flex: "1",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

// Sample Firebase data structure
// const sampleFirebaseData = {
//   columns: [
//     "prospective_customers",
//     "description_of_needs",
//     "stage",
//     "summary_of_company_website",
//   ],
//   value: [
//     {
//       prospective_customers: "Windsurf (via BI)",
//       description_of_needs: "Looking for engineering leadership best practices",
//       stage: "Researching",
//       summary_of_company_website: "BI article highlights developer success",
//     },
//     {
//       prospective_customers: "Windsurf (via FC)",
//       description_of_needs: "Branding & marketing strategy",
//       stage: "Interest",
//       summary_of_company_website: "Feature on AI branding transformation",
//     },
//     {
//       prospective_customers: "Windsurf (via TC)",
//       description_of_needs: "Building AI assistants for dev workflows",
//       stage: "Engaged",
//       summary_of_company_website: "TC article details their AI roadmap",
//     },
//     {
//       prospective_customers: "AeroStack",
//       description_of_needs: "Needs help automating internal tooling with AI",
//       stage: "Qualified",
//       summary_of_company_website: "Early-stage SaaS for enterprise ops teams",
//     },
//   ],
// };

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

export default function Notebook() {
  const [isApiKeySheetOpen, setIsApiKeySheetOpen] = useState(false);
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [isEditMode, setIsEditMode] = useState(true); // Changed from false to true - always default to edit mode
  const [isRunning, setIsRunning] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<Block | null>(null);
  // const [blockNumberInput, setBlockNumberInput] = useState<string>("");
  // const [promptTypeSelect, setPromptTypeSelect] = useState<"system" | "user">(
  //   "system"
  // );

  const [apiCallCount, setApiCallCount] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const blockRefs = useRef<{ [key: number]: AgentBlockRef | DataVizAgentRef }>(
    {}
  );

  const router = useRouter();
  const { agentId } = router.query;
  const { loadAgent, currentAgent } = useAgentStore();
  const [isLoading, setIsLoading] = useState(true);

  // const testBackend = async () => {
  //   try {
  //     const data = await api.get("/api/test");
  //     setApiCallCount(data.count);
  //   } catch (error) {
  //     console.error("Error fetching from backend:", error);
  //   }
  // };

  const { addPrompt, getPrompt, getAllPrompts, clearPrompts } =
    usePromptStore();

  // Keep only one instance of blocks from the store
  const { blocks, deleteBlock, updateBlockData } = useSourceStore(
    (state) => state
  );

  // Add this line near other store hooks
  const nextBlockNumber = useSourceStore((state) => state.nextBlockNumber);
  const addBlockToNotebook = useSourceStore(
    (state) => state.addBlockToNotebook
  );

  const handleSavePrompts = (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string,
    saveAsCsv: boolean,
    sourceInfo?: SourceInfo,
    outputVariable?: {
      id: string;
      name: string;
      type: "input" | "intermediate" | "table";
      columnName?: string;
    } | null
  ) => {
    // Update the block in the store
    updateBlockData(blockNumber, {
      systemPrompt,
      userPrompt,
      saveAsCsv,
      sourceInfo,
      outputVariable,
    });

    // Also update prompts if needed
    addPrompt(blockNumber, "system", systemPrompt);
    addPrompt(blockNumber, "user", userPrompt);

    // Update focused block index
    const blockIndex = blocks.findIndex((b) => b.blockNumber === blockNumber);
    if (blockIndex !== -1) {
      handleBlockEdit(blockIndex);
    }
  };

  const handleAddVariable = (newVariable: Variable) => {
    setVariables((prev) => {
      // First check if a variable with the same name exists
      const existingIndex = prev.findIndex((v) => v.name === newVariable.name);

      if (existingIndex >= 0) {
        // Update existing variable
        return prev.map((v, index) =>
          index === existingIndex ? { ...v, value: newVariable.value } : v
        );
      } else {
        // Add new variable
        return [...prev, newVariable];
      }
    });
  };

  const handleKeyPress = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      runAllBlocks();
    }
  };

  const handleClearPrompts = () => {
    if (window.confirm("Are you sure you want to clear all saved prompts?")) {
      clearPrompts();
    }
  };

  // Add this near your other state declarations
  const [checkInRefs, setCheckInRefs] = useState<{ [key: number]: boolean }>(
    {}
  );

  // Add this state
  const [pausedAtBlock, setPausedAtBlock] = useState<number | null>(null);

  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(
    null
  );
  const [isRunPaused, setIsRunPaused] = useState(false);

  const [isInputVariablesSheetOpen, setIsInputVariablesSheetOpen] =
    useState(false);

  // Add these new state variables
  const [isMasterUser, setIsMasterUser] = useState(false);
  const [targetUserId, setTargetUserId] = useState("");
  const [masterMode, setMasterMode] = useState(false);

  // Add this state near other useState hooks
  const [selection, setSelection] = useState<any[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string | undefined>(
    undefined
  );

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  // Add this near your other state declarations
  const blockElementRefs = useRef<{ [blockId: string]: HTMLDivElement | null }>(
    {}
  );

  // Add state for FloatingAgentNav
  const [isFloatingNavExpanded, setIsFloatingNavExpanded] = useState(false);

  // Add state for block navigation
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number>(-1);

  // Function to scroll to a specific block
  const scrollToBlock = (blockIndex: number) => {
    if (blockIndex < 0 || blockIndex >= blocks.length) {
      return; // Do nothing for invalid indices
    }

    const block = blocks[blockIndex];
    const element = blockElementRefs.current[block.id];
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
      setFocusedBlockIndex(blockIndex);
    }
  };

  // Function to handle when a block is edited/interacted with
  const handleBlockEdit = (blockIndex: number) => {
    setFocusedBlockIndex(blockIndex);
  };

  // Add keyboard shortcut handler for FloatingAgentNav and block navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Command + / to toggle FloatingAgentNav
      if ((event.metaKey || event.ctrlKey) && event.key === "/") {
        event.preventDefault(); // Prevent default browser behavior
        console.log("Toggle FloatingAgentNav");
        setIsFloatingNavExpanded((prev) => !prev);
      }
      // Command + Up to navigate to previous block
      if ((event.metaKey || event.ctrlKey) && event.key === "ArrowUp") {
        event.preventDefault();
        if (blocks.length > 0) {
          const newIndex =
            focusedBlockIndex <= 0 ? blocks.length - 1 : focusedBlockIndex - 1;
          scrollToBlock(newIndex);
        }
      }
      // Command + Down to navigate to next block
      if ((event.metaKey || event.ctrlKey) && event.key === "ArrowDown") {
        event.preventDefault();
        if (blocks.length > 0) {
          const newIndex =
            focusedBlockIndex >= blocks.length - 1 ? 0 : focusedBlockIndex + 1;
          scrollToBlock(newIndex);
        }
      }
      // Escape to close FloatingAgentNav
      if (event.key === "Escape") {
        setIsFloatingNavExpanded(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [blocks.length, focusedBlockIndex]);

  const renderBlock = (block: Block, index: number) => {
    const blockContent = (() => {
      switch (block.type) {
        case "agent":
          // Add the copy block function
          const handleCopyBlock = (blockNumber: number) => {
            useSourceStore.getState().copyBlockAfter(blockNumber);
          };

          return (
            <AgentBlock
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={handleCopyBlock} // Add this line
              initialOutputVariable={block.outputVariable}
              variables={variables}
              onAddVariable={handleAddVariable}
              onOpenTools={() => setIsToolsSheetOpen(true)}
              onSavePrompts={handleSavePrompts}
              isProcessing={isProcessing}
              onProcessingChange={setIsProcessing}
              initialSystemPrompt={block.systemPrompt}
              initialUserPrompt={block.userPrompt}
              initialSaveAsCsv={block.saveAsCsv}
              initialSource={block.sourceInfo}
              onEdit={() => handleBlockEdit(index)}
            />
          );
        case "transform":
          return (
            <TransformBlock
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              originalFilePath={block.originalFilePath || ""}
              sourceName={block.sourceName || ""}
              fileType={block.fileType || "csv"}
              transformations={{
                filterCriteria: block.transformations?.filterCriteria || [],
                columns: block.transformations?.columns || [],
                previewData: block.transformations?.previewData || [],
              }}
              onTransformationsUpdate={(updates) => {
                updateBlockData(block.blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
            />
          );
        case "checkin":
          return (
            <CheckInBlock
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              agentId={agentId as string}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              isProcessing={isProcessing && pausedAtBlock === block.blockNumber}
              onResume={resumeRun}
              variables={variables}
              editedVariableNames={[]}
              onSaveVariables={(updatedVariables, editedNames) => {
                setVariables(updatedVariables);
                handleBlockEdit(index);
              }}
            />
          );
        case "searchagent":
          return (
            <SearchAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              variables={variables}
              onAddVariable={handleAddVariable}
              initialEngine={block.engine}
              initialQuery={block.query}
              initialLimit={block.limit}
              initialTopic={block.topic}
              initialSection={block.section}
              initialTimeWindow={block.timeWindow}
              initialTrend={block.trend}
              initialRegion={block.region}
              initialOutputVariable={block.outputVariable}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
              onProcessingChange={setIsProcessing}
              onOpenTools={() => setIsToolsSheetOpen(true)}
            />
          );
        case "contact":
          return (
            <ContactBlock
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              initialChannel={block.channel}
              initialRecipient={block.recipient}
              initialSubject={block.subject}
              initialBody={block.body}
              onSave={(values) => {
                updateBlockData(block.blockNumber, {
                  channel: values.channel,
                  recipient: values.recipient,
                  subject: values.subject,
                  body: values.body,
                });
                handleBlockEdit(index);
              }}
            />
          );
        case "webagent":
          return (
            <WebAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onAddVariable={handleAddVariable}
              onOpenTools={() => setIsToolsSheetOpen(true)}
              initialUrl={block.url}
              initialPrompt={block.prompt}
              initialSelectedVariableId={block.selectedVariableId}
              initialOutputVariable={block.outputVariable}
            />
          );
        case "codeblock":
          return (
            <CodeBlock
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              onAddVariable={handleAddVariable}
              onOpenTools={() => setIsToolsSheetOpen(true)}
              initialLanguage={block.language}
              initialCode={block.code}
              initialOutputVariable={
                block.outputVariable
                  ? {
                      id: block.outputVariable.id,
                      name: block.outputVariable.name,
                      type:
                        block.outputVariable.type === "table"
                          ? "intermediate"
                          : block.outputVariable.type,
                    }
                  : null
              }
            />
          );
        case "make":
          return (
            <MakeBlock
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialWebhookUrl={block.webhookUrl}
              initialParameters={block.parameters}
              onAddVariable={handleAddVariable}
              variables={variables}
              onOpenTools={() => setIsToolsSheetOpen(true)}
            />
          );
        case "excelagent":
          return (
            <ExcelAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialPrompt={block.prompt}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
              onProcessingChange={setIsProcessing}
              onOpenTools={() => setIsToolsSheetOpen(true)}
              initialOutputVariable={block.outputVariable}
            />
          );
        case "deepresearchagent":
          return (
            <DeepResearchAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialTopic={block.topic}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
              onOpenTools={() => setIsToolsSheetOpen(true)}
              initialSearchEngine={block.searchEngine}
              initialOutputVariable={block.outputVariable}
              blockId={block.id}
              agentId={block.agentId}
            />
          );
        case "instagramagent":
          return (
            <InstagramAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              variables={variables}
              onAddVariable={handleAddVariable}
              onOpenTools={() => setIsToolsSheetOpen(true)}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
              onProcessingChange={setIsProcessing}
              initialUrl={block.url}
              initialPostCount={block.postCount}
            />
          );
        case "pipedriveagent":
          return (
            <PipedriveAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialPrompt={block.prompt}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
            />
          );
        case "datavizagent":
          return (
            <DataVizAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialPrompt={block.prompt}
              initialChartType={block.chartType}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
              onProcessingChange={setIsProcessing}
              onOpenTools={() => setIsToolsSheetOpen(true)}
            />
          );
        case "clickupagent":
          return (
            <ClickUpAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialPrompt={block.prompt}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
            />
          );
        case "googledriveagent":
          return (
            <GoogleDriveAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialPrompt={block.prompt}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
            />
          );
        case "apolloagent":
          return (
            <ApolloAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialFullName={block.fullName}
              initialCompany={block.company}
              initialPrompt={block.prompt}
              initialOutputVariable={block.outputVariable}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
            />
          );
        default:
          const _exhaustiveCheck: never = block;
          throw new Error(`Unhandled block type: ${(block as any).type}`);
      }
    })();

    // Wrap the block content with a div that has the block ID for scrolling
    return (
      <div
        key={block.id}
        id={`block-${block.id}`}
        ref={(el) => {
          blockElementRefs.current[block.id] = el;
        }}
      >
        {(() => {
          // console.log(
          //   "Rendering block with ID:",
          //   `block-${block.id}`,
          //   "for block:",
          //   block.name
          // );
          return null;
        })()}
        {blockContent}
      </div>
    );
  };

  // Add this near your other useEffects
  useEffect(() => {
    // console.log("Current blockRefs contents:", blockRefs.current);
  }, [blockRefs.current]);

  // And modify runAllBlocks to wait for refs
  const runAllBlocks = () => {
    console.log("Starting new run");
    setIsRunning(true); // Show the side panel
    runBlocks(0); // Use our new implementation

    // Temporarily commented out for testing - DO NOT DELETE
    /*
     */
  };

  React.useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  React.useEffect(() => {
    // Generate a random ID for anonymous users
    // const anonymousId = Math.random().toString(36).substring(2, 15);

    posthog
      .identify
      // anonymousId, {
      // anonymous_id: anonymousId,
      // first_seen: new Date().toISOString(),
      // app_version: "1.0.0",
      // }
      ();
  }, []);

  // Add this effect to fetch the initial count and update it periodically
  React.useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await api.get("/api/check-api-key");
        setApiCallCount(response.count);
      } catch (error) {
        console.error("Error fetching API count:", error);
      }
    };

    fetchCount();
    // Update count every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login/signup");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Add this effect to load blocks from the agent if there is a current agent
  useEffect(() => {
    const currentAgent = useAgentStore.getState().currentAgent;
    if (currentAgent && currentAgent.blocks) {
      // Clear existing blocks
      useSourceStore.getState().resetBlocks();

      // Load agent's blocks with their prompts
      currentAgent.blocks.forEach((block) => {
        useSourceStore.getState().addBlockToNotebook(
          block.type === "agent"
            ? {
                ...block,
                systemPrompt: block.systemPrompt || "",
                userPrompt: block.userPrompt || "",
              }
            : block
        );
      });
    }
  }, []);

  // Load agent when agentId is available
  useEffect(() => {
    async function loadAgentData() {
      if (agentId && typeof agentId === "string") {
        // console.log("Loading agent with ID:", agentId);
        try {
          await loadAgent(agentId);
          // console.log("Agent loaded successfully");
        } catch (error) {
          console.error("Error loading agent:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadAgentData();
  }, [agentId, loadAgent]);

  // Debug current agent state
  useEffect(() => {
    // console.log("Current agent state:", currentAgent);
  }, [currentAgent]);

  // Add this effect to check master role on component mount
  useEffect(() => {
    const checkMasterRole = async () => {
      const { checkMasterRole } = useAgentStore.getState();
      const isMaster = await checkMasterRole();
      setIsMasterUser(isMaster);
    };

    checkMasterRole();
  }, []);

  // Add this state for the new agent name
  const [newAgentName, setNewAgentName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Update the save function
  const handleSaveAsAgent = async () => {
    if (!newAgentName.trim()) {
      alert("Please enter an agent name");
      return;
    }

    if (masterMode && !targetUserId.trim()) {
      alert("Please enter a target user ID");
      return;
    }

    setIsSaving(true);
    try {
      if (masterMode && targetUserId.trim()) {
        // Create agent for another user
        const { createAgentForUser } = useAgentStore.getState();
        await createAgentForUser(newAgentName, targetUserId);
        alert(`Agent created successfully for user: ${targetUserId}`);
      } else {
        // Create agent for current user (existing functionality)
        const { createAgent } = useAgentStore.getState();
        await createAgent(newAgentName);
        alert("Agent saved successfully!");
      }

      setNewAgentName("");
      setTargetUserId("");
      setMasterMode(false);
    } catch (error) {
      console.error("Error saving agent:", error);
      alert("Failed to save agent. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const [checkInBlocks, setCheckInBlocks] = useState<number[]>([]);
  const [nextCheckInNumber, setNextCheckInNumber] = useState(1);

  const handleAddCheckIn = () => {
    // console.log("Add Check-In button clicked!");
    const { addBlockToNotebook, blocks } = useSourceStore.getState();

    // Calculate the next block number based on existing blocks
    const nextBlockNumber =
      blocks.length > 0 ? Math.max(...blocks.map((b) => b.blockNumber)) + 1 : 1;

    const newBlock: Block = {
      agentId: agentId as string,
      type: "checkin",
      blockNumber: nextBlockNumber,
      id: crypto.randomUUID(),
      name: `Check-in ${nextBlockNumber}`,
      // Add missing required fields
      systemPrompt: "",
      userPrompt: "",
      saveAsCsv: false,
    };

    addBlockToNotebook(newBlock);
  };

  const [editedVariableNames, setEditedVariableNames] = useState<string[]>([]);

  const {
    blocks: blockManagerBlocks,
    addBlock,
    deleteBlock: blockManagerDeleteBlock,
  } = useBlockManager();

  const processVariablesInText = (text: string): string => {
    const regex = /{{(.*?)}}/g;
    return text.replace(regex, (match, varName) => {
      const trimmedName = varName.trim();
      if (trimmedName.includes(".")) {
        // Handle table.column reference
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
      // Handle regular variable
      const variable = useVariableStore
        .getState()
        .getVariableByName(trimmedName);
      return variable ? String(variable.value) : match;
    });
  };

  const runBlocks = async (startIndex: number = 0) => {
    setIsRunning(true);
    const blockList = getBlockList();
    // console.log("Starting run from index:", startIndex);
    if (startIndex === 0) {
      useSourceStore.getState().clearVariables();
    }
    setIsProcessing(true);

    try {
      for (let i = startIndex; i < blockList.length; i++) {
        const block = blockList[i];
        setCurrentBlock(block as unknown as Block);
        setCurrentBlockIndex(i);
        // console.log(`Processing block ${block.blockNumber} (${block.type})`);

        try {
          const blockRef = blockRefs.current[block.blockNumber];
          if (!blockRef) {
            console.error(`Block ref not found for block ${block.blockNumber}`);
            continue;
          }

          // Process block based on type
          let success = false;
          let output = null;

          switch (block.type) {
            case "checkin":
              // console.log(`Pausing at CheckInBlock ${block.blockNumber}`);

              // Send email notification before pausing
              try {
                const currentUser = auth.currentUser;
                // console.log("Current user data:", {
                //   email: currentUser?.email,
                //   uid: currentUser?.uid,
                //   displayName: currentUser?.displayName,
                // });

                if (currentUser?.email) {
                  const response = await api.get(
                    `/api/send-checkin-email?email=${encodeURIComponent(currentUser.email)}`
                  );
                  if (response.success) {
                    // console.log(
                    //   "Check-in email sent successfully to:",
                    //   response.sent_to
                    // );
                  } else {
                    console.error("Failed to send email:", response.error);
                  }
                }
              } catch (error) {
                console.error("Error sending check-in email:", error);
              }

              setPausedAtBlock(block.blockNumber);
              setIsRunPaused(true);
              return; // Stop execution after sending email
            case "contact":
              // console.log("Processing contact block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Contact block failed, stopping execution");
                return;
              }
              break;
            case "agent":
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Agent block failed, stopping execution");
                return;
              }
              break;
            case "searchagent":
              // console.log("Processing search agent block", block.blockNumber);
              const searchRef = blockRefs.current[block.blockNumber];
              if (!searchRef) {
                console.error(
                  "Search agent ref not found for block",
                  block.blockNumber
                );
                return;
              }
              try {
                success = await searchRef.processBlock();
                if (!success) {
                  console.error(
                    "Search agent block failed, stopping execution"
                  );
                  return;
                }
              } catch (error) {
                console.error("Error processing search agent block:", error);
                return;
              }
              break;
            case "webagent":
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Web agent block failed, stopping execution");
                return;
              }
              break;
            case "codeblock":
              // console.log("Processing code block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Code block failed, stopping execution");
                return;
              }
              break;
            case "excelagent":
              // console.log("Processing Excel agent block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Excel agent block failed, stopping execution");
                return;
              }
              break;
            case "instagramagent":
              // console.log(
              //   "Processing Instagram agent block",
              //   block.blockNumber
              // );
              success = await blockRef.processBlock();
              if (!success) {
                console.error(
                  "Instagram agent block failed, stopping execution"
                );
                return;
              }
              break;
            case "deepresearchagent":
              // console.log(
              //   "Processing deep research agent block",
              //   block.blockNumber
              // );
              success = await blockRef.processBlock();
              if (!success) {
                console.error(
                  "Deep research agent block failed, stopping execution"
                );
                return;
              }
              break;
            case "pipedriveagent":
              // console.log(
              //   "Processing Pipedrive agent block",
              //   block.blockNumber
              // );
              success = await blockRef.processBlock();
              if (!success) {
                console.error(
                  "Pipedrive agent block failed, stopping execution"
                );
                return;
              }
              break;
            case "datavizagent":
              // console.log("Processing DataViz agent block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("DataViz agent block failed, stopping execution");
                return;
              }
              break;
            case "clickupagent":
              success = await blockRef.processBlock();
              if (!success) {
                console.error("ClickUp agent block failed, stopping execution");
                return;
              }
              break;
            case "googledriveagent":
              // console.log(
              //   "Processing Google Drive agent block",
              //   block.blockNumber
              // );
              success = await blockRef.processBlock();
              if (!success) {
                console.error(
                  "Google Drive agent block failed, stopping execution"
                );
                return;
              }
              break;
            case "apolloagent":
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Apollo agent block failed, stopping execution");
                return;
              }
              break;
          }

          // Handle output variable if present
          const blockData = useSourceStore
            .getState()
            .blocks.find((b) => b.blockNumber === block.blockNumber);
          if (
            blockData?.outputVariable &&
            blockData.outputVariable.type === "table" &&
            blockData.outputVariable.columnName
          ) {
            const tableId = blockData.outputVariable.id;
            const columnName = blockData.outputVariable.columnName;
            const tableVar = useVariableStore.getState().variables[tableId];

            if (tableVar?.type === "table" && "getOutput" in blockRef) {
              const output = blockRef.getOutput();
              // console.log(
              //   `Appending to table column ${tableVar.name}.${columnName}:`,
              //   output
              // );

              // If the output is a string, always create a new row (append)
              if (typeof output === "string" && output.trim()) {
                await useVariableStore
                  .getState()
                  .addTableRow(tableId, { [columnName]: output.trim() });
              }
              // If the output is an array, create new rows for each value (append all)
              else if (Array.isArray(output)) {
                for (const value of output) {
                  if (value && String(value).trim()) {
                    await useVariableStore.getState().addTableRow(tableId, {
                      [columnName]: String(value).trim(),
                    });
                  }
                }
              }
            }
          } else if (blockData?.outputVariable && "getOutput" in blockRef) {
            // Handle regular variable output
            const output = blockRef.getOutput();
            await useVariableStore
              .getState()
              .updateVariable(blockData.outputVariable.id, output);
          }
        } catch (error) {
          console.error(`Error processing block ${block.blockNumber}:`, error);
          return;
        }
      }
    } finally {
      if (!isRunPaused) {
        setIsProcessing(false);
        setCurrentBlockIndex(null);
      }
    }
  };

  const resumeRun = async () => {
    console.log("Resuming run...");
    if (pausedAtBlock) {
      const nextIndex = blocks.findIndex((b) => b.blockNumber > pausedAtBlock);
      runBlocks(nextIndex);
    }
  };

  const addNewCheckInBlock = () => {
    const newBlock: Block = {
      type: "checkin",
      blockNumber: nextBlockNumber,
      id: crypto.randomUUID(),
      name: `Check-in ${nextBlockNumber}`,
      agentId: agentId as string,
      // Add required BaseBlock fields
      systemPrompt: "",
      userPrompt: "",
      saveAsCsv: false,
    };

    addBlockToNotebook(newBlock);
  };

  // Add a handler for ratings
  const handleRateAgent = (isPositive: boolean) => {
    // We can add API call or state management here later
    console.log("Agent rated:", isPositive);
  };

  const [isRunComplete, setIsRunComplete] = useState(false);

  // Custom handler for creating new agents
  const handleCreateNewAgent = async (name: string) => {
    setIsSaving(true);
    try {
      if (masterMode && targetUserId.trim()) {
        const { createAgentForUser } = useAgentStore.getState();
        await createAgentForUser(name, targetUserId);
        toast.success(`Agent created successfully for user: ${targetUserId}`);
      } else {
        const { createAgent } = useAgentStore.getState();
        await createAgent(name);
        toast.success("Agent saved successfully!");
      }
      setNewAgentName("");
      setTargetUserId("");
      setMasterMode(false);
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Failed to save agent. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Use auto-save hook for new agents and Cmd+S
  useAutoSave({
    onCreateNewAgent: handleCreateNewAgent,
    isEditMode: isEditMode,
  });

  // Get table variables from the store
  const { variables: storeVariables } = useVariableStore();

  // State for managing multiple tables
  const [currentTableIndex, setCurrentTableIndex] = useState(0);

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

  // Navigation functions (simplified)
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

  // Add this helper function before the onBlockExecute function
  const handleSelectionExecution = async (block: Block, params: any) => {
    // console.log("Notebook: Running block with selection:", params.selectedData);

    // Define how to extract input from selected rows for each block type
    const getInputFromRow = (
      row: any,
      blockType: string,
      selectedColumn?: string,
      formParams?: any // Add formParams parameter
    ) => {
      // console.log("getInputFromRow called with:", {
      //   blockType,
      //   selectedColumn,
      //   rowKeys: Object.keys(row),
      //   rowValues: Object.values(row).slice(0, 3), // Show first 3 values for debugging
      // });

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
          // Use the selected column if provided, otherwise fallback
          // console.log("searchagent case - selectedColumn:", selectedColumn);
          // console.log(
          //   "searchagent case - row[selectedColumn]:",
          //   selectedColumn ? row[selectedColumn] : "selectedColumn is undefined"
          // );
          // console.log(
          //   "searchagent case - Object.values(row)[0]:",
          //   Object.values(row)[0]
          // );

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

          // console.log("Apollo form inputs:", { fullNameInput, companyInput });
          // console.log("Selected row data:", row);

          // Extract name value based on form input
          let nameValue = "";
          if (fullNameInput === "@selection") {
            // When @selection is used, we need to determine which column was actually selected
            // The selectedData should contain the column information
            const selectedColumn = formParams?.selectedColumn;
            if (selectedColumn && row[selectedColumn] !== undefined) {
              nameValue = String(row[selectedColumn]);
            } else {
              // Fallback to first available value
              const firstValue = Object.values(row).find(
                (v) => v !== null && v !== undefined
              );
              nameValue = firstValue ? String(firstValue) : "";
            }
          } else if (
            fullNameInput.includes("{{") &&
            fullNameInput.includes("}}")
          ) {
            // Parse table variable reference like "{{test_table.company}}"
            const match = fullNameInput.match(/{{([^}]+)}}/);
            if (match) {
              const [tableName, columnName] = match[1].split(".");
              // Use the column name directly from the row
              const value = row[columnName];
              nameValue = value !== undefined ? String(value) : "";
            }
          } else {
            // Direct value
            nameValue = fullNameInput;
          }

          // Extract company value based on form input
          let companyValue = "";
          if (companyInput === "@selection") {
            // When @selection is used, we need to determine which column was actually selected
            const selectedColumn = formParams?.selectedColumn;
            if (selectedColumn && row[selectedColumn] !== undefined) {
              companyValue = String(row[selectedColumn]);
            } else {
              // Fallback to second available value
              const values = Object.values(row).filter(
                (v) => v !== null && v !== undefined
              );
              companyValue = values.length > 1 ? String(values[1]) : "";
            }
          } else if (
            companyInput.includes("{{") &&
            companyInput.includes("}}")
          ) {
            // Parse table variable reference like "{{test_table.company}}"
            const match = companyInput.match(/{{([^}]+)}}/);
            if (match) {
              const [tableName, columnName] = match[1].split(".");
              // Use the column name directly from the row
              const value = row[columnName];
              companyValue = value !== undefined ? String(value) : "";
            }
          } else {
            // Direct value
            companyValue = companyInput;
          }

          // console.log("Extracted Apollo values:", { nameValue, companyValue });

          if (nameValue && companyValue) {
            return `${nameValue}|${companyValue}`;
          } else {
            // Fallback to first two values if specific columns not found
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
    const replaceSelectionPlaceholder = (
      query: string,
      replacement: string
    ) => {
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
            // Add other agent params as needed
          });
        case "apolloagent":
          // For Apollo agents, we need both name and company
          // The input should contain both values separated by a delimiter
          const [name, company] = input.split("|");
          return api.post("/api/apollo_enrich", {
            name: name || input,
            company: company || "",
            ...(params.prompt && { prompt: params.prompt }),
          });
        // Add more block types as needed
        default:
          throw new Error(
            `Selection not supported for block type: ${blockType}`
          );
      }
    };

    // Check if preview mode is enabled
    if (params.previewMode) {
      // console.log("Notebook: Preview mode enabled for selection execution");

      // For each selected row, make a search and collect results
      const previewRows: PreviewRow[] = [];

      for (let i = 0; i < params.selectedData.length; i++) {
        const selectedRow = params.selectedData[i];
        const input = getInputFromRow(
          selectedRow,
          block.type,
          params.selectedColumn,
          params
        );

        if (input && selectedRow.id) {
          try {
            // Make API call for this row
            const response = await getApiCall(block.type, input, params);

            // Add to preview rows with the processed query
            const processedQuery = replaceSelectionPlaceholder(
              params.query || "",
              input
            );
            previewRows.push({
              rowId: selectedRow.id,
              rowIndex: i,
              searchQuery: processedQuery,
              results: response.results || [],
            });
          } catch (error) {
            console.error(`Error processing selection ${i + 1}:`, error);
          }
        }
      }

      // Show preview dialog with all results
      setPreviewData(previewRows);
      setIsPreviewDialogOpen(true);
      return;
    }

    // For each selected item, run the block and save to that row
    for (let i = 0; i < params.selectedData.length; i++) {
      const selectedRow = params.selectedData[i];
      // console.log(`Notebook: Processing selection ${i + 1}:`, selectedRow);
      // console.log(
      //   `Notebook: selectedColumn from params:`,
      //   params.selectedColumn
      // );

      const input = getInputFromRow(
        selectedRow,
        block.type,
        params.selectedColumn,
        params
      );
      // console.log(`Notebook: Using input for selection ${i + 1}:`, input);

      if (input && selectedRow.id) {
        try {
          // Make API call
          const response = await getApiCall(block.type, input, params);

          // Extract the result based on response structure
          let result = "";
          if (response.analysis) {
            result = response.analysis;
          } else if (response.markdown) {
            result = response.markdown;
          } else {
            result =
              typeof response === "string"
                ? response
                : JSON.stringify(response);
          }

          // SPECIAL HANDLING FOR APOLLO AGENTS
          if (block.type === "apolloagent") {
            // console.log("=== APOLLO AGENT EXECUTION ===");
            // console.log("Selected row:", selectedRow);
            // console.log("Input:", input);
            // console.log("Full API response:", response);
            // console.log("Extracted result:", result);
            // console.log("Selected variable ID:", params.selectedVariableId);

            // Save the result to the selected variable/column
            if (params.selectedVariableId) {
              if (params.selectedVariableId.includes(":")) {
                // Table column selection
                const [tableId, columnName] =
                  params.selectedVariableId.split(":");
                // console.log(`Saving to table ${tableId}, column ${columnName}`);
                await useVariableStore
                  .getState()
                  .updateTableRow(tableId, selectedRow.id, {
                    [columnName]: result,
                  });
                // console.log(
                //   `✅ Apollo: Saved result to table ${tableId}, column ${columnName}:`,
                //   result
                // );
              } else {
                // Regular variable
                // console.log(`Saving to variable ${params.selectedVariableId}`);
                await useVariableStore
                  .getState()
                  .updateVariable(params.selectedVariableId, result);
                // console.log(
                //   `✅ Apollo: Saved result to variable ${params.selectedVariableId}:`,
                //   result
                // );
              }
            } else {
              // console.log("❌ Apollo: No selectedVariableId provided");
            }
            // console.log("=== END APOLLO AGENT EXECUTION ===");
          } else {
            // Handle other block types (existing logic)
            if (
              block.outputVariable &&
              block.outputVariable.type === "table" &&
              block.outputVariable.columnName
            ) {
              await useVariableStore
                .getState()
                .updateTableRow(block.outputVariable.id, selectedRow.id, {
                  [block.outputVariable.columnName]: result,
                });
            }
          }
        } catch (error) {
          console.error(
            `Notebook: Error processing selection ${i + 1}:`,
            error
          );

          // Save the error to the row
          if (
            block.outputVariable &&
            block.outputVariable.type === "table" &&
            block.outputVariable.columnName
          ) {
            await useVariableStore
              .getState()
              .updateTableRow(block.outputVariable.id, selectedRow.id, {
                [block.outputVariable.columnName]:
                  `Error: ${error instanceof Error ? error.message : String(error)}`,
              });
          }
        }
      }
    }
  };

  const handlePreviewConfirm = async (
    selectedResults: {
      [rowId: string]: string[];
    },
    targetVariableId: string
  ) => {
    // console.log("Preview confirmed with results:", selectedResults);
    // console.log("Target variable ID:", targetVariableId);

    try {
      // Get all variables from the store for debugging
      const allVariables = useVariableStore.getState().variables;
      // console.log("All available variables:", allVariables);

      // Handle table column selection (format: "tableId:columnName")
      let targetVariable;
      let columnName = "search_results"; // default column name

      if (targetVariableId.includes(":")) {
        // This is a table column selection
        const [tableId, selectedColumn] = targetVariableId.split(":");
        targetVariable = allVariables[tableId];
        columnName = selectedColumn;
        // console.log(
        //   "Table column selection - Table ID:",
        //   tableId,
        //   "Column:",
        //   selectedColumn
        // );
      } else {
        // This is a regular variable
        targetVariable = allVariables[targetVariableId];
        // console.log("Regular variable selection");
      }

      // console.log("Target variable:", targetVariable);
      // console.log("Column name:", columnName);

      if (!targetVariable) {
        console.error("Target variable not found:", targetVariableId);
        console.error("Available variable IDs:", Object.keys(allVariables));
        toast.error("Target variable not found");
        return;
      }

      // For table variables, we need to determine which column to save to
      if (targetVariable.type === "table" && targetVariable.columns) {
        // Add the column if it doesn't exist
        if (!targetVariable.columns.includes(columnName)) {
          await useVariableStore
            .getState()
            .addColumnToTable(targetVariable.id, columnName);
          // console.log(
          //   `Added column "${columnName}" to table "${targetVariable.name}"`
          // );
        }

        // Update each selected row with its corresponding URL (only the first one)
        for (const [rowId, urls] of Object.entries(selectedResults)) {
          if (urls.length > 0) {
            // Take only the first URL from the selection (single result per row)
            const singleUrl = urls[0];

            // Use updateTableRow to update the existing row
            await useVariableStore
              .getState()
              .updateTableRow(targetVariable.id, rowId, {
                [columnName]: singleUrl,
              });

            // console.log(`Updated row ${rowId} with URL: ${singleUrl}`);
          }
        }

        const updatedRows = Object.keys(selectedResults).length;
        // console.log(`Updated ${updatedRows} rows with single URLs`);
        toast.success(`Updated ${updatedRows} rows with search results`);
      } else {
        // For regular variables (intermediate, input), take only the first URL from the first row
        const allSelectedUrls: string[] = [];
        Object.values(selectedResults).forEach((urls) => {
          if (urls.length > 0) {
            allSelectedUrls.push(urls[0]); // Only take the first URL from each row
          }
        });

        if (allSelectedUrls.length === 0) {
          console.warn("No URLs selected");
          toast.warning("No URLs selected");
          return;
        }

        // For regular variables, we might want to concatenate multiple single URLs
        const urlsString = allSelectedUrls.join(", ");
        await useVariableStore
          .getState()
          .updateVariable(targetVariable.id, urlsString);

        // console.log(
        //   `Updated variable "${targetVariable.name}" with ${allSelectedUrls.length} URLs`
        // );
        toast.success(
          `Updated variable "${targetVariable.name}" with ${allSelectedUrls.length} URLs`
        );
      }

      // Close the dialog and clear the data
      setIsPreviewDialogOpen(false);
      setPreviewData([]);
    } catch (error) {
      console.error("Error saving selected URLs to variable:", error);
      toast.error("Failed to save selected URLs to variable");
    }
  };

  const handleOpenTools = () => {
    setIsAddSourceDialogOpen(true);
  };

  const [isAddSourceDialogOpen, setIsAddSourceDialogOpen] = useState(false);

  return (
    <Layout>
      <div style={pageStyle}>
        {!isLoading && agentId ? (
          <AgentHeader
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
          />
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
            <div className="flex items-center gap-4">
              <Input
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Add an agent name"
                className="w-64 bg-gray-800 border-gray-700 text-white"
              />

              {/* Master role UI - only show if user is master */}
              {isMasterUser && (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="masterMode"
                      checked={masterMode}
                      onChange={(e) => setMasterMode(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <label htmlFor="masterMode" className="text-white text-sm">
                      Create for another user
                    </label>
                  </div>

                  {masterMode && (
                    <Input
                      value={targetUserId}
                      onChange={(e) => setTargetUserId(e.target.value)}
                      placeholder="Target user ID"
                      className="w-64 bg-gray-800 border-gray-700 text-white"
                    />
                  )}
                </>
              )}
            </div>
            <Button
              onClick={handleSaveAsAgent}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Saving...
                </>
              ) : (
                <>
                  <SaveOutlined className="mr-2" />
                  {masterMode ? "Create Agent for User" : "Save New Agent"}
                </>
              )}
            </Button>
          </div>
        )}
        <main style={mainStyle}>
          {/* Add the floating navigation */}
          {agentId && (
            <FloatingAgentNav
              agentId={agentId as string}
              blockRefs={blockElementRefs}
              isExpanded={isFloatingNavExpanded}
              onExpandedChange={setIsFloatingNavExpanded}
            />
          )}

          {/* Updated Input Variables Section */}
          <div
            style={{
              borderRadius: "10px",
              backgroundColor: "transparent",
              color: "black",
              padding: "10px",
              border: "1px solid white",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "white" }}
                >
                  Input variables
                </h3>
                <button
                  className="text-gray-400 hover:text-gray-100"
                  onClick={() =>
                    alert(
                      "Input variables let you configure agent flows using placeholders, which are replaced with actual values when the agent runs."
                    )
                  }
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
              <button
                className="text-gray-400 hover:text-gray-100 flex items-center gap-1"
                onClick={() => setIsInputVariablesSheetOpen(true)}
              >
                <span>Set input variables</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
          </div>
          <CollapsibleBox
            title="Workflow and Tools"
            variables={variables}
            agentId={agentId as string}
            onAddVariable={handleAddVariable}
            onOpenTools={() => setIsToolsSheetOpen(true)}
            onSavePrompts={handleSavePrompts}
            blockRefs={blockRefs}
            blockElementRefs={blockElementRefs}
            isEditMode={isEditMode}
            isRunning={isRunning}
            onMinimize={() => setIsRunning(false)}
            currentBlock={currentBlock}
            isRunComplete={isRunComplete}
          >
            <div id="workflow-and-tools">
              {blocks.map((block, index) => renderBlock(block, index))}
              {currentBlock && currentBlock.modelResponse && (
                <RateAgentRun onRate={handleRateAgent} />
              )}
            </div>
          </CollapsibleBox>
          <CollapsibleBox title="Output Editor" onOpenTools={handleOpenTools}>
            <div id="output-editor" className="w-full">
              {/* Variable Navigation Controls */}
              {getNavigationItems().length > 1 && (
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
                      {currentTableIndex + 1} of {getNavigationItems().length}
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

              {/* Full width table */}
              <div className="flex w-full h-[600px] gap-4">
                <div className="flex-1 min-w-0">
                  <EditableDataGrid
                    firebaseData={getFirebaseDataFromVariables()}
                    tableWidth="100%"
                    currentTableId={(() => {
                      const navigationItems = getNavigationItems();
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
                      // console.log("Data updated:", updatedData);
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
                            .updateVariable(
                              currentItem.variable.id,
                              updatedData
                            );
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
                      selectedCells,
                      selectedData,
                      selectedColumn
                    ) => {
                      setSelection(selectedData); // Store for @selection
                      setSelectedColumn(selectedColumn); // Store the selected column
                    }}
                    onColumnsChange={(newColumns) => {
                      // console.log("Columns changed:", newColumns);
                      const navigationItems = getNavigationItems();
                      if (
                        navigationItems.length > 0 &&
                        currentTableIndex < navigationItems.length
                      ) {
                        const currentItem = navigationItems[currentTableIndex];

                        // Only handle column changes for table variables
                        if (currentItem.type === "table") {
                          const currentColumns =
                            currentItem.variable.columns || [];

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

                        // For input/intermediate variables, we don't allow column changes
                        // since the columns represent the variable names themselves
                      }
                    }}
                  />
                </div>
                <div className="w-[350px] min-w-[300px] max-w-[400px] border-l border-gray-700 bg-gray-900">
                  <ChatSidebar
                    blocks={blocks}
                    selectedData={selection}
                    selectedColumn={selectedColumn}
                    onBlockExecute={async (blockNameOrNumber, params) => {
                      // console.log(
                      //   "Notebook: Executing block:",
                      //   blockNameOrNumber,
                      //   "with params:",
                      //   params
                      // );

                      // Find the block
                      let block = blocks.find(
                        (b) =>
                          (b.name &&
                            b.name.toLowerCase() ===
                              blockNameOrNumber.toLowerCase()) ||
                          (b.type &&
                            `${b.type} ${b.blockNumber}`.toLowerCase() ===
                              blockNameOrNumber.toLowerCase())
                      );

                      if (!block) {
                        block = blocks.find(
                          (b) =>
                            String(b.blockNumber) === String(blockNameOrNumber)
                        );
                      }

                      if (!block) {
                        throw new Error(
                          `Block "${blockNameOrNumber}" not found.`
                        );
                      }

                      // Handle selection execution (works for all block types)
                      if (
                        params.selectedData &&
                        params.selectedData.length > 0
                      ) {
                        await handleSelectionExecution(block, params);
                        return; // Skip normal execution
                      }

                      // Normal execution (existing switch statement)
                      switch (block.type) {
                        case "webagent":
                          if (
                            params.url ||
                            params.prompt ||
                            params.outputVariable
                          ) {
                            updateBlockData(block.blockNumber, {
                              url: params.url || "",
                              prompt: params.prompt || "",
                              outputVariable: params.outputVariable || null,
                            });
                          }
                          break;
                        case "searchagent":
                          // Update block data with the query from chat
                          if (params.query) {
                            updateBlockData(block.blockNumber, {
                              query: params.query,
                              engine: params.engine || "search",
                              limit: params.limit || 5,
                            });
                          }

                          // Handle preview mode selected results (when user confirms from dialog)
                          if (params.selectedResults) {
                            // Execute with selected results
                            let payload: any = {
                              engine: params.engine || "search",
                            };

                            if (params.engine === "news") {
                              if (params.topic) {
                                payload.topic_token = params.topic;
                                if (params.section)
                                  payload.section_token = params.section;
                              } else {
                                payload.query = params.query;
                                payload.num = params.limit || 5;
                              }
                            } else {
                              payload.query = params.query;
                              payload.num = params.limit || 5;
                            }

                            // console.log("Notebook: Search payload:", payload);
                            const searchResponse = await api.post(
                              "/api/search",
                              payload
                            );
                            // console.log(
                            //   "Notebook: Full search response:",
                            //   searchResponse
                            // );

                            // Check if preview mode is enabled
                            if (params.previewMode) {
                              // console.log(
                              //   "Notebook: Preview mode enabled, showing dialog"
                              // );
                              // Transform search results into the expected format
                              const previewRows: PreviewRow[] = [
                                {
                                  rowId: "0", // Single row for now
                                  rowIndex: 0,
                                  searchQuery: params.query || "",
                                  results: searchResponse.results || [],
                                },
                              ];
                              setPreviewData(previewRows);
                              setIsPreviewDialogOpen(true);
                              return; // Exit early, don't save results yet
                            }

                            // If not preview mode, save results immediately
                            if (block.outputVariable && searchResponse) {
                              try {
                                const allUrls: string[] = [];
                                Object.values(
                                  params.selectedResults as {
                                    [key: string]: string[];
                                  }
                                ).forEach((urls: string[]) => {
                                  allUrls.push(...urls);
                                });

                                if (
                                  block.outputVariable.type === "table" &&
                                  block.outputVariable.columnName
                                ) {
                                  // Table variable - save as rows
                                  for (const url of allUrls) {
                                    if (url && url.trim()) {
                                      await useVariableStore
                                        .getState()
                                        .addTableRow(block.outputVariable.id, {
                                          [block.outputVariable.columnName]:
                                            url.trim(),
                                        });
                                    }
                                  }
                                } else {
                                  // Regular variable - save as comma-separated list
                                  await useVariableStore
                                    .getState()
                                    .updateVariable(
                                      block.outputVariable.id,
                                      allUrls.join(", ")
                                    );
                                }
                              } catch (error) {
                                console.error(
                                  "Error saving selected results to variable:",
                                  error
                                );
                                toast.error(
                                  "Failed to save selected results to variable"
                                );
                              }
                            }
                          } else {
                            // Normal execution
                            let payload: any = {
                              engine: params.engine || "search",
                            };
                            if (params.engine === "news") {
                              if (params.topic) {
                                payload.topic_token = params.topic;
                                if (params.section)
                                  payload.section_token = params.section;
                              } else {
                                payload.query = params.query;
                                payload.num = params.limit || 5;
                              }
                            } else {
                              payload.query = params.query;
                              payload.num = params.limit || 5;
                            }

                            // console.log("Notebook: Search payload:", payload);
                            const searchResponse = await api.post(
                              "/api/search",
                              payload
                            );
                            // console.log(
                            //   "Notebook: Full search response:",
                            //   searchResponse
                            // );

                            // Check if preview mode is enabled
                            if (params.previewMode) {
                              // console.log(
                              //   "Notebook: Preview mode enabled, showing dialog"
                              // );
                              // Transform search results into the expected format
                              const previewRows: PreviewRow[] = [
                                {
                                  rowId: "0", // Single row for now
                                  rowIndex: 0,
                                  searchQuery: params.query || "",
                                  results: searchResponse.results || [],
                                },
                              ];
                              setPreviewData(previewRows);
                              setIsPreviewDialogOpen(true);
                              return; // Exit early, don't save results yet
                            }

                            // If not preview mode, save results immediately
                            if (block.outputVariable && searchResponse) {
                              const results =
                                searchResponse.results || searchResponse;
                              // console.log(
                              //   "Notebook: Extracted results:",
                              //   results
                              // );

                              if (
                                block.outputVariable.type === "table" &&
                                block.outputVariable.columnName
                              ) {
                                const tableId = block.outputVariable.id;
                                const columnName =
                                  block.outputVariable.columnName;
                                // console.log(
                                //   "Notebook: Saving to table column:",
                                //   tableId,
                                //   columnName
                                // );

                                if (Array.isArray(results)) {
                                  // console.log(
                                  //   "Notebook: Processing",
                                  //   results.length,
                                  //   "results"
                                  // );
                                  for (let i = 0; i < results.length; i++) {
                                    const result = results[i];
                                    // console.log(
                                    //   `Notebook: Processing result ${i + 1}:`,
                                    //   result
                                    // );

                                    // Handle nested news structure
                                    if (
                                      result.stories &&
                                      Array.isArray(result.stories)
                                    ) {
                                      // For news results with stories, save only the FIRST story's link
                                      const firstStory = result.stories[0];
                                      if (firstStory) {
                                        const valueToSave =
                                          firstStory.link ||
                                          firstStory.url ||
                                          firstStory.title ||
                                          String(firstStory);
                                        // console.log(
                                        //   `Notebook: Adding table row ${i + 1} (from first story):`,
                                        //   { [columnName]: valueToSave }
                                        // );
                                        await useVariableStore
                                          .getState()
                                          .addTableRow(tableId, {
                                            [columnName]: valueToSave,
                                          });
                                      } else {
                                        // console.log(
                                        //   `Notebook: No first story found in result ${i + 1}`
                                        // );
                                      }
                                    } else {
                                      // For regular results, use the direct link
                                      const valueToSave =
                                        result.link ||
                                        result.url ||
                                        result.title ||
                                        String(result);
                                      // console.log(
                                      //   `Notebook: Adding table row ${i + 1} (direct):`,
                                      //   { [columnName]: valueToSave }
                                      // );
                                      // console.log(
                                      //   `Notebook: Value being saved:`,
                                      //   valueToSave
                                      // );
                                      await useVariableStore
                                        .getState()
                                        .addTableRow(tableId, {
                                          [columnName]: valueToSave,
                                        });
                                    }
                                  }
                                }
                              } else {
                                // console.log(
                                //   "Notebook: Saving to regular variable:",
                                //   block.outputVariable.id,
                                //   results
                                // );
                                await useVariableStore
                                  .getState()
                                  .updateVariable(
                                    block.outputVariable.id,
                                    results
                                  );
                              }
                            }
                          }
                          break;

                        case "deepresearchagent":
                          if (params.topic) {
                            updateBlockData(block.blockNumber, {
                              topic: params.topic,
                              searchEngine: params.searchEngine || "google",
                            });
                          }
                          break;

                        case "codeblock":
                          if (params.code) {
                            updateBlockData(block.blockNumber, {
                              code: params.code,
                              language: params.language || "python",
                            });
                          }
                          break;

                        case "instagramagent":
                          if (params.url) {
                            updateBlockData(block.blockNumber, {
                              url: params.url,
                              postCount: params.postCount || 10,
                            });
                          }
                          break;

                        case "excelagent":
                        case "pipedriveagent":
                        case "clickupagent":
                        case "datavizagent":
                        case "googledriveagent":
                          if (params.prompt) {
                            updateBlockData(block.blockNumber, {
                              prompt: params.prompt,
                              ...(block.type === "datavizagent" &&
                                params.chartType && {
                                  chartType: params.chartType,
                                }),
                            });
                          }
                          break;

                        case "make":
                          if (params.webhookUrl) {
                            updateBlockData(block.blockNumber, {
                              webhookUrl: params.webhookUrl,
                              parameters: params.parameters || [],
                            });
                          }
                          break;

                        case "contact":
                          if (params.recipient) {
                            updateBlockData(block.blockNumber, {
                              recipient: params.recipient,
                              subject: params.subject || "",
                              body: params.body || "",
                              channel: params.channel || "email",
                            });
                          }
                          break;
                        case "apolloagent":
                          if (
                            params.fullName ||
                            params.company ||
                            params.prompt ||
                            params.outputVariable
                          ) {
                            updateBlockData(block.blockNumber, {
                              fullName: params.fullName || "",
                              company: params.company || "",
                              prompt: params.prompt || "",
                              outputVariable: params.outputVariable || null,
                            });
                          }
                          break;
                      }

                      // Wait a moment for the block to update
                      await new Promise((resolve) => setTimeout(resolve, 500)); // Changed from 100 to 500ms

                      // Get the block reference
                      const ref = blockRefs.current[block.blockNumber];
                      if (!ref || typeof ref.processBlock !== "function") {
                        throw new Error(
                          `Block "${blockNameOrNumber}" is not ready or cannot be executed.`
                        );
                      }

                      // Execute the block
                      // console.log("Notebook: Executing block...");

                      // SPECIAL HANDLING FOR APOLLO AGENT
                      if (
                        block.type === "apolloagent" &&
                        params.selectedVariableId
                      ) {
                        // console.log(
                        //   "Notebook: Apollo Agent with selectedVariableId:",
                        //   params.selectedVariableId
                        // );

                        // Update the Apollo Agent's selectedVariableId before execution
                        const apolloRef = ref as any;
                        if (apolloRef && apolloRef.setSelectedVariableId) {
                          apolloRef.setSelectedVariableId(
                            params.selectedVariableId
                          );
                        }
                      }

                      // SPECIAL HANDLING FOR WEBAGENT
                      if (block.type === "webagent" && params.outputVariable) {
                        console.log(
                          "Notebook: WebAgent with outputVariable:",
                          params.outputVariable
                        );

                        // Update the WebAgent's outputVariable before execution
                        const webAgentRef = ref as any;
                        if (webAgentRef && webAgentRef.setOutputVariable) {
                          webAgentRef.setOutputVariable(params.outputVariable);
                        }
                      }

                      const success = await ref.processBlock();

                      if (!success) {
                        throw new Error(`Block execution failed`);
                      }

                      // Get the output from the block
                      let output = null;
                      if ("getOutput" in ref) {
                        output = ref.getOutput();
                        // console.log("Notebook: Block output:", output);
                      }

                      // Handle output variable saving
                      let variableSaved = null;
                      const updatedBlock = useSourceStore
                        .getState()
                        .blocks.find(
                          (b) => b.blockNumber === block.blockNumber
                        );

                      if (updatedBlock?.outputVariable && output !== null) {
                        // console.log(
                        //   "Notebook: Saving output to variable:",
                        //   updatedBlock.outputVariable
                        // );

                        if (
                          updatedBlock.outputVariable.type === "table" &&
                          updatedBlock.outputVariable.columnName
                        ) {
                          // Save to table column
                          const tableId = updatedBlock.outputVariable.id;
                          const columnName =
                            updatedBlock.outputVariable.columnName;
                          let itemCount = 0;

                          if (typeof output === "string" && output.trim()) {
                            await useVariableStore
                              .getState()
                              .addTableRow(tableId, {
                                [columnName]: output.trim(),
                              });
                            itemCount = 1;
                          } else if (Array.isArray(output)) {
                            for (const value of output) {
                              if (value && String(value).trim()) {
                                await useVariableStore
                                  .getState()
                                  .addTableRow(tableId, {
                                    [columnName]: String(value).trim(),
                                  });
                                itemCount++;
                              }
                            }
                          }

                          variableSaved = {
                            variableName: updatedBlock.outputVariable.name,
                            variableType: "table",
                            itemCount,
                          };
                        } else {
                          // Save to regular variable
                          await useVariableStore
                            .getState()
                            .updateVariable(
                              updatedBlock.outputVariable.id,
                              output
                            );
                          variableSaved = {
                            variableName: updatedBlock.outputVariable.name,
                            variableType: "variable",
                            itemCount: 1,
                          };
                        }
                      }

                      // console.log(
                      //   "Notebook: Block execution completed successfully"
                      // );
                    }}
                  />
                </div>
              </div>
            </div>
          </CollapsibleBox>
          <div className="flex justify-center mb-4"></div>
        </main>
        <Footer
          onRun={runAllBlocks}
          isProcessing={isProcessing}
          variables={variables}
          onAddVariable={handleAddVariable}
        />
        <ApiKeySheet
          open={isApiKeySheetOpen}
          onOpenChange={setIsApiKeySheetOpen}
          apiCallCount={apiCallCount}
        />
        <ToolsSheet
          open={isToolsSheetOpen}
          onOpenChange={setIsToolsSheetOpen}
          onAddVariable={handleAddVariable}
        />
        <InputVariablesSheet
          open={isInputVariablesSheetOpen}
          onOpenChange={setIsInputVariablesSheetOpen}
          onAddVariable={handleAddVariable}
        />
        <div className="w-full max-w-xl mx-auto mt-4">
          {/* <SourcesList /> */}
        </div>
      </div>

      {/* Search Preview Dialog */}
      <SearchPreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        previewData={previewData}
        onConfirm={handlePreviewConfirm}
        agentId={agentId as string}
      />

      {/* Add the AddSourceDialog */}
      <AddSourceDialog
        open={isAddSourceDialogOpen}
        onOpenChange={setIsAddSourceDialogOpen}
        onAddSource={() => {}}
        openToTableVariable={true} // Add this prop
      />
    </Layout>
  );
}
