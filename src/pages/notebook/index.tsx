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
import { api, API_URL } from "@/tools/api";
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
// import { getBlockList } from "@/lib/store";
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
// import { Info, ChevronDown, Lock } from "lucide-react";
import InputVariablesSheet from "@/components/custom_components/InputVariablesSheet";
import { ChevronDown, Info, Lock } from "lucide-react";
import DataVizAgent, {
  DataVizAgentRef,
} from "@/components/custom_components/DataVizAgent";
import ClickUpAgent from "@/components/custom_components/ClickUpAgent";
import GoogleDriveAgent from "@/components/custom_components/GoogleDriveAgent";
import GongAgent from "@/components/custom_components/GongAgent";
import JiraAgent from "@/components/custom_components/JiraAgent";
import SalesforceAgent from "@/components/custom_components/SalesforceAgent";
import { useAutoSave } from "@/hooks/useAutoSave";
import { toast } from "sonner";
import EditableDataGrid from "../../components/custom_components/EditableDataGrid";
import ChatSidebar from "../../components/custom_components/ChatSidebar";
import ApolloAgent from "@/components/custom_components/ApolloAgent";
import SearchPreviewDialog from "@/components/custom_components/SearchPreviewDialog";
import { PreviewRow } from "@/types/types";
import FloatingAgentNav from "@/components/custom_components/FloatingAgentNav";
import AddSourceDialog from "@/components/custom_components/AddSourceDialog";
import { PrimaryInputDialog } from "@/components/custom_components/PrimaryInputDialog";
import { useTaskStore } from "@/lib/taskStore";
import { VariableInputDialog } from "@/components/custom_components/VariableInputDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/tools/firebase";

// Block input requirements definition
const BLOCK_INPUT_REQUIREMENTS: Record<string, string[]> = {
  searchagent: ["query"], // Base requirement - always check for query
  agent: ["userPrompt"],
  webagent: ["url"],
  contact: ["to", "subject", "body"],
  codeblock: ["code"],
  excelagent: ["prompt"],
  pipedriveagent: ["prompt"],
  clickupagent: ["prompt"],
  googledriveagent: ["prompt"],
  apolloagent: ["prompt"],
  instagramagent: ["url"],
  deepresearchagent: ["topic"],
  datavizagent: ["prompt"],
  make: ["webhookUrl"],
  // Add other block types as needed
  checkin: [], // No input required
  transform: [], // No input required
};

// Helper function to get required fields for a specific block
const getRequiredFieldsForBlock = (block: Block): string[] => {
  const baseRequirements = BLOCK_INPUT_REQUIREMENTS[block.type] || [];

  // Special handling for searchagent with news topic search
  if (block.type === "searchagent") {
    const searchBlock = block as any; // Cast to access engine and newsSearchType

    // If it's a news search and using topic search type, check for topic instead of query
    if (
      searchBlock.engine === "news" &&
      searchBlock.newsSearchType === "topic"
    ) {
      return ["topic"]; // Check topic dropdown instead of query
    }

    // Otherwise, use the base query requirement
    return baseRequirements;
  }

  return baseRequirements;
};

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  // backgroundColor: "#141414",
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

interface PrimaryInputDialogProps {
  blocks: Block[];
  onComplete: (updatedBlocks: Block[]) => void;
  onCancel: () => void;
  onRun: () => void;
}

interface PrimaryInputDialogState {
  currentBlockIndex: number;
  updatedBlocks: Block[];
}

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

  const [isProcessing, setIsProcessing] = useState(false);
  const blockRefs = useRef<{ [key: number]: AgentBlockRef | DataVizAgentRef }>(
    {}
  );

  const router = useRouter();
  const { agentId } = router.query;
  const { loadAgent, currentAgent, updateBlockData, deleteBlock } =
    useAgentStore();
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

  // Add this to get blocks from currentAgent:
  const blocks = currentAgent?.blocks || [];

  // Update the handleSavePrompts function to include skip parameter
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
    } | null,
    containsPrimaryInput?: boolean,
    skip?: boolean // Add this parameter
  ) => {
    // Update the block in the store
    updateBlockData(blockNumber, {
      systemPrompt,
      userPrompt,
      saveAsCsv,
      sourceInfo,
      outputVariable,
      containsPrimaryInput,
      skip, // Add this field
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
  }, [focusedBlockIndex]); // Removed blocks.length from dependency array

  const renderBlock = (block: Block, index: number) => {
    // Create a version key that changes when agent data is updated
    const agentVersion = currentAgent?.id || Date.now();

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
              key={`agent-${block.blockNumber}-${agentVersion}`}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={handleCopyBlock}
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
              key={`transform-${block.blockNumber}-${agentVersion}`}
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
              key={`checkin-${block.blockNumber}-${agentVersion}`}
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
              key={`searchagent-${block.blockNumber}-${agentVersion}`}
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
              containsPrimaryInput={block.containsPrimaryInput}
              skip={block.skip}
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
              key={`contact-${block.blockNumber}-${agentVersion}`}
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
              key={`webagent-${block.blockNumber}-${agentVersion}`}
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
              key={`codeblock-${block.blockNumber}-${agentVersion}`}
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
              key={`make-${block.blockNumber}-${agentVersion}`}
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
              key={`excelagent-${block.blockNumber}-${agentVersion}`}
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
              key={`deepresearchagent-${block.blockNumber}-${agentVersion}`}
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
              key={`instagramagent-${block.blockNumber}-${agentVersion}`}
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
              key={`pipedriveagent-${block.blockNumber}-${agentVersion}`}
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
              key={`datavizagent-${block.blockNumber}-${agentVersion}`}
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
              key={`clickupagent-${block.blockNumber}-${agentVersion}`}
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
              key={`googledriveagent-${block.blockNumber}-${agentVersion}`}
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
              key={`apolloagent-${block.blockNumber}-${agentVersion}`}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialFullName={block.fullName}
              initialFirstName={(block as any).firstName || ""}
              initialLastName={(block as any).lastName || ""}
              initialCompany={block.company}
              initialPrompt={block.prompt}
              initialOutputVariable={block.outputVariable}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
            />
          );
        case "tabletransform": {
          return (
            <div key={`tabletransform-${block.blockNumber}-${agentVersion}`}>
              Table Transform Block
            </div>
          );
        }
        case "gong":
          return (
            <GongAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={`gong-${block.blockNumber}`}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              initialOutputVariable={block.outputVariable}
              // onCopyBlock={handleCopyBlock}
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
        case "jira":
          return (
            <JiraAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={`jira-${block.blockNumber}`}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              // onCopyBlock={handleCopyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialPrompt={block.prompt}
              isProcessing={
                isProcessing && currentBlockIndex === block.blockNumber
              }
              initialOutputVariable={block.outputVariable}
              // MISSING: initialOutputVariable={block.outputVariable}
            />
          );
        case "salesforce":
          return (
            <SalesforceAgent
              ref={(ref) => {
                if (ref) blockRefs.current[block.blockNumber] = ref;
              }}
              key={`salesforce-${block.blockNumber}`}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              // onCopyBlock={handleCopyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
                handleBlockEdit(index);
              }}
              initialPrompt={block.prompt}
              initialCompanyName={block.companyName} // Add this line
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

  // Add this helper function to get primary input blocks
  const getPrimaryInputBlocks = () => {
    return blocks.filter((block) => block.containsPrimaryInput);
  };

  // In notebook/index.tsx, add this state
  const [isPrimaryInputDialogOpen, setIsPrimaryInputDialogOpen] =
    useState(false);
  const [primaryInputBlocks, setPrimaryInputBlocks] = useState<Block[]>([]);
  const [dialogResolver, setDialogResolver] =
    useState<(value: Block[] | null) => void>();

  // Update showPrimaryInputDialog
  const showPrimaryInputDialog = async (
    blocks: Block[]
  ): Promise<Block[] | null> => {
    return new Promise((resolve) => {
      setPrimaryInputBlocks(blocks);
      setDialogResolver(() => resolve);
      setIsPrimaryInputDialogOpen(true);
    });
  };

  const handleCancel = () => {
    console.log("=== PrimaryInputDialog CANCELLED ===");
    console.log("User cancelled the primary input dialog");
    setIsPrimaryInputDialogOpen(false);
    dialogResolver?.(null);
  };

  // Modify runAllBlocks
  const runAllBlocks = async () => {
    console.log("=== STARTING NEW RUN ===");
    console.log("Total blocks in agent:", currentAgent?.blocks?.length || 0);

    // 1. Check for input variables first
    const inputVariables = Object.values(
      useVariableStore.getState().variables
    ).filter(
      (variable) =>
        variable.type === "input" && variable.agentId === currentAgent?.id
    );

    if (inputVariables.length > 0) {
      console.log("Input variables found, showing VariableInputDialog first");
      const variableInputConfirmed = await showVariableInputDialog();
      if (!variableInputConfirmed) {
        console.log("VariableInputDialog cancelled - stopping execution");
        return;
      }
    }

    // 2. Then check for blocks that need primary input
    const primaryInputBlocks = getPrimaryInputBlocks();
    console.log("Blocks requiring primary input:", primaryInputBlocks.length);

    if (primaryInputBlocks.length > 0) {
      console.log(
        "Showing PrimaryInputDialog for",
        primaryInputBlocks.length,
        "blocks"
      );
      const updatedBlocks = await showPrimaryInputDialog(primaryInputBlocks);
      if (!updatedBlocks) {
        console.log("PrimaryInputDialog cancelled - stopping execution");
        return;
      }
      // Update blocks with new inputs...
    }

    // 3. Run all blocks
    console.log("Starting block execution...");
    setIsRunning(true);
    runBlocks(0);
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
    async function loadAgentData() {
      if (agentId && typeof agentId === "string") {
        console.log("Starting to load agent:", agentId);
        try {
          await loadAgent(agentId);
          const currentAgent = useAgentStore.getState().currentAgent;

          if (currentAgent && currentAgent.blocks) {
            // Load variables once for the entire agent
            await useVariableStore.getState().loadVariables(agentId);
            console.log("Variables loaded for agent:", agentId);

            // Use the new function to set blocks from Firebase
            // useSourceStore
            //   .getState()
            //   .setBlocksFromFirebase(currentAgent.blocks);

            // Debug log
            console.log("=== AGENT AND STORE STATE ===");
            currentAgent?.blocks?.forEach((block, index) => {
              console.log(`Block ${index + 1} (${block.type}):`, {
                ...(block.type === "webagent" && {
                  url: block.url,
                  prompt: block.prompt,
                  containsPrimaryInput: block.containsPrimaryInput,
                }),
                ...(block.type === "searchagent" && {
                  query: block.query,
                  engine: block.engine,
                  limit: block.limit,
                }),
                fullBlock: block,
              });
            });
            console.log("=== END STATE DEBUG ===");
          }
        } catch (error) {
          console.error("Error loading agent:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }

    loadAgentData();
  }, [agentId, loadAgent]); // Add proper dependencies

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
    if (!currentAgent) return;

    // Calculate the next block number based on existing blocks
    const nextBlockNumber =
      currentAgent.blocks.length > 0
        ? Math.max(...currentAgent.blocks.map((b) => b.blockNumber)) + 1
        : 1;

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

    useAgentStore.getState().updateCurrentAgent({
      ...currentAgent,
      blocks: [...currentAgent.blocks, newBlock],
    });
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

  // Add this after the getRequiredFieldsForBlock function

  // Check if a block has the required input fields
  // const checkBlockHasInput = (block: Block): boolean => {
  //   const requiredFields = getRequiredFieldsForBlock(block);

  //   // If no required fields, block can run
  //   if (requiredFields.length === 0) {
  //     return true;
  //   }

  //   // Check each required field
  //   for (const field of requiredFields) {
  //     const value = (block as any)[field];

  //     // Check if the field has a meaningful value
  //     if (!value || (typeof value === "string" && value.trim() === "")) {
  //       console.log(
  //         `Block ${block.blockNumber} (${block.type}) skipped: missing required field "${field}"`
  //       );
  //       return false;
  //     }
  //   }

  //   return true;
  // };

  // Update the runBlocks function to include skip logic
  const runBlocks = async (startIndex: number = 0) => {
    setIsRunning(true);
    const blockList = currentAgent?.blocks || [];
    console.log("=== RUNNING BLOCKS ===");
    console.log("Starting run from index:", startIndex);
    console.log("Total blocks to process:", blockList.length);

    if (startIndex === 0) {
      useSourceStore.getState().clearVariables();
    }
    setIsProcessing(true);

    try {
      for (let i = startIndex; i < blockList.length; i++) {
        const block = blockList[i];
        setCurrentBlock(block as unknown as Block);
        setCurrentBlockIndex(i);
        console.log(
          `\n--- Processing block ${block.blockNumber} (${block.type}) ---`
        );
        console.log(`Block name: ${block.name || "unnamed"}`);
        console.log(`Block skip flag: ${block.skip}`);
        console.log(
          `Block containsPrimaryInput: ${block.containsPrimaryInput}`
        );

        // Check if block should be skipped due to missing input
        // if (!checkBlockHasInput(block)) {
        //   console.log(
        //     `Skipping block ${block.blockNumber} (${block.type}) - missing required input`
        //   );
        //   continue; // Skip to next block
        // }

        if (block.skip) {
          console.log(
            `❌ SKIPPING block ${block.blockNumber} (${block.type}) - skip flag is true`
          );
          console.log(`   Block details:`, {
            name: block.name,
            type: block.type,
            blockNumber: block.blockNumber,
            skip: block.skip,
          });
          continue; // Skip to next block
        }

        if (block.containsPrimaryInput) {
          console.log(
            `⏭️ SKIPPING block ${block.blockNumber} (${block.type}) - using primary input flow`
          );
          console.log(`   Block details:`, {
            name: block.name,
            type: block.type,
            blockNumber: block.blockNumber,
            containsPrimaryInput: block.containsPrimaryInput,
          });
          continue; // Skip to next block
        }

        console.log(`✅ EXECUTING block ${block.blockNumber} (${block.type})`);

        try {
          const blockRef = blockRefs.current[block.blockNumber];
          if (!blockRef) {
            console.error(
              `❌ Block ref not found for block ${block.blockNumber}`
            );
            continue;
          }

          // Process block based on type
          let success = false;
          let output = null;

          switch (block.type) {
            case "checkin":
              console.log(`⏸️ Pausing at CheckInBlock ${block.blockNumber}`);

              // Send email notification before pausing
              try {
                const currentUser = auth.currentUser;

                if (currentUser?.email) {
                  const response = await api.get(
                    `/api/send-checkin-email?email=${encodeURIComponent(currentUser.email)}`
                  );
                  if (response.success) {
                    console.log(
                      "Check-in email sent successfully to:",
                      response.sent_to
                    );
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
              console.log("Processing contact block", block.blockNumber);
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
              console.log("Processing search agent block", block.blockNumber);
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
              console.log("Processing code block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Code block failed, stopping execution");
                return;
              }
              break;
            case "excelagent":
              console.log("Processing Excel agent block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Excel agent block failed, stopping execution");
                return;
              }
              break;
            case "instagramagent":
              console.log(
                "Processing Instagram agent block",
                block.blockNumber
              );
              success = await blockRef.processBlock();
              if (!success) {
                console.error(
                  "Instagram agent block failed, stopping execution"
                );
                return;
              }
              break;
            case "deepresearchagent":
              console.log(
                "Processing deep research agent block",
                block.blockNumber
              );
              success = await blockRef.processBlock();
              if (!success) {
                console.error(
                  "Deep research agent block failed, stopping execution"
                );
                return;
              }
              break;
            case "pipedriveagent":
              console.log(
                "Processing Pipedrive agent block",
                block.blockNumber
              );
              success = await blockRef.processBlock();
              if (!success) {
                console.error(
                  "Pipedrive agent block failed, stopping execution"
                );
                return;
              }
              break;
            case "datavizagent":
              console.log("Processing DataViz agent block", block.blockNumber);
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
              console.log(
                "Processing Google Drive agent block",
                block.blockNumber
              );
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
            case "gong":
              console.log("Processing Gong block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Gong block failed, stopping execution");
                return;
              }
              break;
            case "jira":
              console.log("Processing Jira block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Jira block failed, stopping execution");
                return;
              }
              break;
            case "salesforce":
              console.log("Processing Salesforce block", block.blockNumber);
              success = await blockRef.processBlock();
              if (!success) {
                console.error("Salesforce block failed, stopping execution");
                return;
              }
              break;
          }

          console.log(
            `✅ Block ${block.blockNumber} (${block.type}) completed successfully`
          );

          // Handle output variable if present
          const blockData = currentAgent?.blocks?.find(
            (b) => b.blockNumber === block.blockNumber
          );
          if (
            blockData?.outputVariable &&
            blockData.outputVariable.type === "table" &&
            blockData.outputVariable.columnName
          ) {
            const tableId = blockData.outputVariable.id;
            const columnName = blockData.outputVariable.columnName;
            const tableVar = useVariableStore.getState().variables[tableId];

            if (tableVar?.type === "table") {
              // Try to get output from block ref first, fallback to stored modelResponse
              let output = null;
              try {
                if (blockRef && "getOutput" in blockRef) {
                  output = blockRef.getOutput();
                }
              } catch (error) {
                console.log(
                  `Block ref getOutput failed for block ${block.blockNumber}, using stored data`
                );
              }

              // If block ref failed or returned null/undefined, use stored modelResponse
              if (!output && blockData.modelResponse) {
                output = blockData.modelResponse;
                console.log(
                  `Using stored modelResponse for block ${block.blockNumber}:`,
                  output
                );
              }

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
          } else if (blockData?.outputVariable) {
            // Handle regular variable output
            // Try to get output from block ref first, fallback to stored modelResponse
            let output = null;
            try {
              if (blockRef && "getOutput" in blockRef) {
                output = blockRef.getOutput();
              }
            } catch (error) {
              console.log(
                `Block ref getOutput failed for block ${block.blockNumber}, using stored data`
              );
            }

            // If block ref failed or returned null/undefined, use stored modelResponse
            if (!output && blockData.modelResponse) {
              output = blockData.modelResponse;
              console.log(
                `Using stored modelResponse for block ${block.blockNumber}:`,
                output
              );
            }

            if (output) {
              await useVariableStore
                .getState()
                .updateVariable(blockData.outputVariable.id, output);
            }
          }
        } catch (error) {
          console.error(
            `❌ Error processing block ${block.blockNumber}:`,
            error
          );
          return;
        }
      }

      console.log("=== BLOCK EXECUTION COMPLETED ===");
    } finally {
      if (!isRunPaused) {
        setIsProcessing(false);
        setCurrentBlockIndex(null);

        // 🆕 ADD THIS: Create review task when run completes (regardless of success/failure)
        if (currentAgent?.id) {
          const { createReviewTask } = useTaskStore.getState();
          await createReviewTask(currentAgent.id);
        }

        // 🆕 ADD THIS: Send completion notification email
        try {
          const currentUser = auth.currentUser;
          if (currentUser?.email && currentAgent?.name) {
            const agentLink = `${window.location.origin}/notebook/${currentAgent.id}`;
            const response = await api.post("/api/send-completion-email", {
              email: currentUser.email,
              agentName: currentAgent.name,
              agentLink: agentLink,
            });

            if (response.success) {
              console.log(
                "Completion email sent successfully to:",
                response.sent_to
              );
            } else {
              console.error("Failed to send completion email:", response.error);
            }
          }
        } catch (error) {
          console.error("Error sending completion email:", error);
          // Don't throw - email failure shouldn't break the UI
        }

        // 🆕 ADD THIS: Navigate to output editor after completion
        try {
          if (currentAgent?.id) {
            console.log("Agent run completed, navigating to output editor...");
            router.push(`/output-editor/${currentAgent.id}`);
          }
        } catch (error) {
          console.error("Error navigating to output editor:", error);
          // Don't throw - navigation failure shouldn't break the UI
        }
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
    if (!currentAgent) return;

    const nextBlockNumber =
      currentAgent.blocks.length > 0
        ? Math.max(...currentAgent.blocks.map((b) => b.blockNumber)) + 1
        : 1;

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

    useAgentStore.getState().updateCurrentAgent({
      ...currentAgent,
      blocks: [...currentAgent.blocks, newBlock],
    });
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
      return; // Exit early, don't save results yet
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

  // Add this state near other useState declarations
  const [isVariableInputDialogOpen, setIsVariableInputDialogOpen] =
    useState(false);
  const [variableInputResolver, setVariableInputResolver] =
    useState<(value: boolean) => void>();

  // Replace the showVariableInputDialog function
  const showVariableInputDialog = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      setVariableInputResolver(() => resolve);
      setIsVariableInputDialogOpen(true);
    });
  };

  // Add this handler
  const handleVariableInputCancel = () => {
    setIsVariableInputDialogOpen(false);
    variableInputResolver?.(false);
  };

  const handleVariableInputComplete = () => {
    setIsVariableInputDialogOpen(false);
    variableInputResolver?.(true);
  };

  // Add view-only state
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Add useEffect to check if current user is view-only
  useEffect(() => {
    const checkViewOnlyStatus = () => {
      if (currentAgent && auth.currentUser?.email) {
        const userEmail = auth.currentUser.email;
        const viewOnlyUsers =
          currentAgent.viewOnlyUsers || currentAgent.view_only || [];
        const isUserViewOnly = viewOnlyUsers.includes(userEmail);

        // Add debug logging
        // console.log("=== VIEW ONLY DEBUG ===");
        // console.log("User email:", userEmail);
        // console.log("viewOnlyUsers:", currentAgent.viewOnlyUsers);
        // console.log("view_only:", currentAgent.view_only);
        // console.log("Final viewOnlyUsers array:", viewOnlyUsers);
        // console.log("Is user view only:", isUserViewOnly);
        // console.log("=== END DEBUG ===");

        setIsViewOnly(isUserViewOnly);
      }
    };

    checkViewOnlyStatus();
  }, [currentAgent]);

  // Add this near the top of the component, after the existing state declarations (around line 290)
  const isChatDataAgent = currentAgent?.agent_type === "chat_data";

  // Add useEffect to fetch URLs when chat_data agent loads
  useEffect(() => {
    if (isChatDataAgent && currentAgent?.id) {
      fetchUrlsFromSources();
    }
  }, [isChatDataAgent, currentAgent?.id]);

  // Add chat-specific state variables
  const [chatMessages, setChatMessages] = useState<
    Array<{
      id: string;
      role: "user" | "assistant";
      content: string;
      timestamp: Date;
    }>
  >([]);
  const [chatInput, setChatInput] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Add URL and content viewer state variables
  const [urls, setUrls] = useState<string[]>([]);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"urls" | "markdown">("urls");
  const [markdownContent, setMarkdownContent] = useState<
    Record<string, string>
  >({});
  const [isLoadingUrls, setIsLoadingUrls] = useState(false);
  const [isLoadingMarkdown, setIsLoadingMarkdown] = useState<
    Record<string, boolean>
  >({});

  // Add state for sources dialog
  const [isSourcesDialogOpen, setIsSourcesDialogOpen] = useState(false);
  const [sources, setSources] = useState<Array<{ id: string; url: string }>>(
    []
  );
  const [newSourceUrl, setNewSourceUrl] = useState("");
  const [isAddingSource, setIsAddingSource] = useState(false);
  const [showAddSourceInput, setShowAddSourceInput] = useState(false);

  // Add function to handle sending chat messages
  const handleSendMessage = async () => {
    if (!chatInput.trim() || isSendingMessage) return;

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: chatInput.trim(),
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const currentInput = chatInput.trim();
    setChatInput("");
    setIsSendingMessage(true);

    try {
      // Call the RAG query endpoint
      const response = await api.post("/query-rag", {
        user_id: auth.currentUser?.uid as string,
        agent_id: currentAgent?.id as string,
        question: currentInput,
        request_id: `query_rag_${Date.now()}`,
      });

      if (response.success && response.answer) {
        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: response.answer,
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      } else {
        // Fallback response if API fails
        const assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content:
            "I'm sorry, I couldn't process your question at the moment. Please try again.",
          timestamp: new Date(),
        };
        setChatMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message to RAG endpoint:", error);
      // Fallback response on error
      const assistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant" as const,
        content:
          "I'm sorry, I encountered an error while processing your question. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Add function to handle Enter key in chat input
  const handleChatKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // Add function to fetch URLs from Firebase sources subcollection
  const fetchUrlsFromSources = async () => {
    if (!currentAgent?.id || !auth.currentUser?.uid) return;

    setIsLoadingUrls(true);
    try {
      const userId = auth.currentUser.uid;
      const agentId = currentAgent.id;

      console.log("Fetching URLs from sources subcollection:", {
        userId,
        agentId,
      });

      // Query the sources subcollection
      const sourcesRef = collection(
        db,
        `users/${userId}/agents/${agentId}/sources`
      );
      const sourcesSnapshot = await getDocs(sourcesRef);

      const fetchedUrls: string[] = [];
      sourcesSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.url && typeof data.url === "string") {
          fetchedUrls.push(data.url);
        }
      });

      console.log("Fetched URLs from sources:", fetchedUrls);
      setUrls(fetchedUrls);

      // Reset current URL index if it's out of bounds
      if (fetchedUrls.length > 0 && currentUrlIndex >= fetchedUrls.length) {
        setCurrentUrlIndex(0);
      }
    } catch (error) {
      console.error("Error fetching URLs from sources:", error);
      toast.error("Failed to load URLs from sources");
    } finally {
      setIsLoadingUrls(false);
    }
  };

  // Add function to fetch markdown from your endpoint
  const fetchMarkdownForUrl = async (url: string) => {
    if (markdownContent[url] || isLoadingMarkdown[url]) {
      return; // Already loaded or loading
    }

    setIsLoadingMarkdown((prev) => ({ ...prev, [url]: true }));

    try {
      const response = await api.post("/get-markdown", {
        user_id: auth.currentUser?.uid as string,
        agent_id: currentAgent?.id as string,
        url: url,
        request_id: `markdown_req_${Date.now()}`,
      });

      if (response.success && response.markdown) {
        setMarkdownContent((prev) => ({
          ...prev,
          [url]: response.markdown,
        }));
      }
    } catch (error) {
      console.error("Error fetching markdown for URL:", url, error);
      // Set empty markdown so we don't try to fetch again
      setMarkdownContent((prev) => ({
        ...prev,
        [url]: "",
      }));
    } finally {
      setIsLoadingMarkdown((prev) => ({ ...prev, [url]: false }));
    }
  };

  // Update the URL navigation to fetch markdown when URL changes
  const goToNextUrl = () => {
    const newIndex = (currentUrlIndex + 1) % urls.length;
    setCurrentUrlIndex(newIndex);
    // Fetch markdown for the new URL
    if (urls[newIndex]) {
      fetchMarkdownForUrl(urls[newIndex]);
    }
  };

  const goToPreviousUrl = () => {
    const newIndex = (currentUrlIndex - 1 + urls.length) % urls.length;
    setCurrentUrlIndex(newIndex);
    // Fetch markdown for the new URL
    if (urls[newIndex]) {
      fetchMarkdownForUrl(urls[newIndex]);
    }
  };

  // Fetch markdown for current URL when URLs are loaded
  useEffect(() => {
    if (urls.length > 0 && urls[currentUrlIndex]) {
      fetchMarkdownForUrl(urls[currentUrlIndex]);
    }
  }, [urls, currentUrlIndex]);

  // Add function to fetch sources for the dialog
  const fetchSources = async () => {
    if (!currentAgent?.id || !auth.currentUser?.uid) return;

    try {
      const userId = auth.currentUser.uid;
      const agentId = currentAgent.id;

      const sourcesRef = collection(
        db,
        `users/${userId}/agents/${agentId}/sources`
      );
      const sourcesSnapshot = await getDocs(sourcesRef);

      const fetchedSources: Array<{ id: string; url: string }> = [];
      sourcesSnapshot.forEach((doc) => {
        const data = doc.data();
        // Use the original URL that was inputted, not the processed one
        const sourceUrl = data.original_url || data.url || data.source_url;
        if (sourceUrl && typeof sourceUrl === "string") {
          fetchedSources.push({
            id: doc.id,
            url: sourceUrl,
          });
        }
      });

      setSources(fetchedSources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      toast.error("Failed to load sources");
    }
  };

  // Add function to add new source
  const handleAddSource = async () => {
    if (!newSourceUrl.trim() || isAddingSource) return;

    setIsAddingSource(true);
    try {
      const response = await api.post("/scrape-and-store", {
        user_id: auth.currentUser?.uid as string,
        agent_id: currentAgent?.id as string,
        urls: [newSourceUrl.trim()],
        request_id: `request_${Date.now()}`,
      });

      if (response.success) {
        toast.success(
          `Source added successfully! ${response.sources_created} source(s) created, ${response.chunks_created} chunks created.`
        );
        setNewSourceUrl("");
        setShowAddSourceInput(false);
        // Refresh sources list and URLs
        await fetchSources();
        await fetchUrlsFromSources();
      } else {
        toast.error("Failed to add source");
      }
    } catch (error) {
      console.error("Error adding source:", error);
      toast.error("Failed to add source");
    } finally {
      setIsAddingSource(false);
    }
  };

  return (
    <Layout>
      <div style={pageStyle}>
        {/* View Only indicator in bottom right */}
        {isViewOnly && (
          <div className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="text-sm font-medium">View Only</span>
          </div>
        )}

        {!isLoading && agentId ? (
          <AgentHeader
            isEditMode={isEditMode}
            onEditModeChange={setIsEditMode}
            sourcesButton={
              isChatDataAgent ? (
                <Button
                  onClick={() => {
                    setIsSourcesDialogOpen(true);
                    fetchSources();
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Sources
                </Button>
              ) : undefined
            }
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
          {/* Add the floating navigation - only show for non-chat_data agents */}
          {agentId && !isChatDataAgent && (
            <FloatingAgentNav
              agentId={agentId as string}
              blockRefs={blockElementRefs}
              isExpanded={isFloatingNavExpanded}
              onExpandedChange={setIsFloatingNavExpanded}
            />
          )}

          {/* Conditional rendering based on agent_type */}
          {isChatDataAgent ? (
            // Chat Data Agent UI - split screen with chat and content viewer
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[90vh]">
              {/* Left side - Content Viewer */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Content Viewer
                </h2>

                {/* Markdown Viewer for URLs */}
                <div className="flex-1 flex flex-col">
                  {isLoadingUrls ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-2"></div>
                        <div>Loading URLs...</div>
                      </div>
                    </div>
                  ) : urls.length > 0 ? (
                    <>
                      {/* URL Navigation */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-gray-700 rounded-lg">
                        <button
                          onClick={goToPreviousUrl}
                          disabled={urls.length <= 1}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                          <span>←</span> Previous
                        </button>

                        <div className="text-center">
                          <div className="text-white font-medium text-sm">
                            URL {currentUrlIndex + 1} of {urls.length}
                          </div>
                          <div className="text-gray-400 text-xs truncate max-w-xs">
                            {urls[currentUrlIndex]}
                          </div>
                        </div>

                        <button
                          onClick={goToNextUrl}
                          disabled={urls.length <= 1}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition-colors"
                        >
                          Next <span>→</span>
                        </button>
                      </div>

                      {/* Markdown Content Display */}
                      <div className="flex-1 bg-white rounded-lg overflow-hidden border border-gray-600 max-h-[50vh]">
                        {(() => {
                          const currentUrl = urls[currentUrlIndex];
                          const currentMarkdown = markdownContent[currentUrl];
                          const isLoadingCurrentMarkdown =
                            isLoadingMarkdown[currentUrl];

                          // If we're loading markdown, show loading state
                          if (isLoadingCurrentMarkdown) {
                            return (
                              <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-300 mx-auto mb-2"></div>
                                  <div>Loading content...</div>
                                </div>
                              </div>
                            );
                          }

                          // If we have markdown content, show it
                          if (currentMarkdown) {
                            return (
                              <div className="h-full p-4 overflow-y-auto max-h-[45vh]">
                                <div
                                  className="prose prose-sm max-w-none"
                                  dangerouslySetInnerHTML={{
                                    __html: currentMarkdown.replace(
                                      /\n/g,
                                      "<br>"
                                    ),
                                  }}
                                />
                              </div>
                            );
                          }

                          // If no markdown available, show empty state
                          return (
                            <div className="flex items-center justify-center h-full text-gray-400">
                              <div className="text-center">
                                <div className="text-lg mb-2">📄</div>
                                <div>No content available</div>
                                <div className="text-sm mt-1">
                                  Content will appear here when loaded
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <div className="text-lg mb-2">🌐</div>
                        <div>No URLs found in sources</div>
                        <div className="text-sm mt-1">
                          Add sources with URLs to see them here
                        </div>
                        <button
                          onClick={fetchUrlsFromSources}
                          className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                        >
                          Refresh
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side - Chat Interface */}
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 flex flex-col">
                <h2 className="text-xl font-semibold text-white mb-4">
                  Chat Interface
                </h2>

                {/* Chat messages area */}
                <div className="bg-gray-900 rounded-lg p-4 flex-1 overflow-y-auto border border-gray-600 mb-4 max-h-[60vh] scroll-smooth">
                  {chatMessages.length === 0 ? (
                    <div className="text-gray-400 text-center py-8">
                      <div className="text-lg mb-2">👋 Hello!</div>
                      <div>Start a conversation with your AI agent.</div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              message.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-700 text-gray-100"
                            }`}
                          >
                            <div className="text-sm">{message.content}</div>
                            <div
                              className={`text-xs mt-1 ${
                                message.role === "user"
                                  ? "text-blue-100"
                                  : "text-gray-400"
                              }`}
                            >
                              {message.timestamp.toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                      {isSendingMessage && (
                        <div className="flex justify-start">
                          <div className="bg-gray-700 text-gray-100 px-4 py-2 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-300"></div>
                              <span className="text-sm">Thinking...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat input */}
                <div className="flex gap-2">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={handleChatKeyPress}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-800 border-gray-700 text-white"
                    disabled={isSendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isSendingMessage}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSendingMessage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      "Send"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            // Regular Agent UI - existing interface (keep all existing code)
            <>
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
                isViewOnly={isViewOnly}
              >
                <div id="workflow-and-tools">
                  {blocks.map((block, index) => renderBlock(block, index))}
                  {currentBlock && currentBlock.modelResponse && (
                    <RateAgentRun onRate={handleRateAgent} />
                  )}
                </div>
              </CollapsibleBox>
              <CollapsibleBox
                title="Output Editor"
                onOpenTools={handleOpenTools}
              >
                {/* ... keep all existing output editor UI ... */}
              </CollapsibleBox>
            </>
          )}

          <div className="flex justify-center mb-4"></div>
        </main>

        {/* Footer - only show for regular agents */}
        {!isChatDataAgent && (
          <Footer
            onRun={runAllBlocks}
            isProcessing={isProcessing}
            variables={variables}
            onAddVariable={handleAddVariable}
          />
        )}

        {/* Sources Dialog for chat_data agents */}
        <AlertDialog
          open={isSourcesDialogOpen}
          onOpenChange={setIsSourcesDialogOpen}
        >
          <AlertDialogContent className="max-w-4xl w-full bg-black border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Sources
              </AlertDialogTitle>
            </AlertDialogHeader>
            <div className="space-y-4">
              {/* List of existing sources */}
              <div className="max-h-60 overflow-y-auto">
                {sources.length > 0 ? (
                  <div className="space-y-2">
                    {sources.map((source) => (
                      <div
                        key={source.id}
                        className="p-3 bg-gray-800 rounded-lg border border-gray-600"
                      >
                        <div className="text-sm font-medium text-white break-all">
                          {source.url}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    No sources found. Add your first source below.
                  </div>
                )}
              </div>

              {/* Add source section */}
              <div className="border-t border-gray-700 pt-4">
                {!showAddSourceInput ? (
                  <Button
                    onClick={() => setShowAddSourceInput(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Add Source
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <Input
                      value={newSourceUrl}
                      onChange={(e) => setNewSourceUrl(e.target.value)}
                      placeholder="Enter website URL (e.g., https://example.com)"
                      className="w-full bg-gray-800 border-gray-600 text-white"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddSource}
                        disabled={!newSourceUrl.trim() || isAddingSource}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {isAddingSource ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Adding...
                          </>
                        ) : (
                          "Add Source"
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setShowAddSourceInput(false);
                          setNewSourceUrl("");
                        }}
                        variant="outline"
                        className="flex-1 border-gray-600 text-white hover:bg-gray-800"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>

        {/* ... keep all existing modals and dialogs ... */}
      </div>
    </Layout>
  );
}
