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

export default function Notebook() {
  const [isApiKeySheetOpen, setIsApiKeySheetOpen] = useState(false);
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  // const [blockNumberInput, setBlockNumberInput] = useState<string>("");
  // const [promptTypeSelect, setPromptTypeSelect] = useState<"system" | "user">(
  //   "system"
  // );

  const [apiCallCount, setApiCallCount] = useState<number>(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const blockRefs = useRef<{ [key: number]: AgentBlockRef }>({});

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
      type: "input" | "intermediate";
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
  };

  // const displayBlockPrompts = () => {
  //   const blockNumber = parseInt(blockNumberInput);
  //   if (isNaN(blockNumber)) {
  //     return;
  //   }

  //   const promptValue = getPrompt(blockNumber, promptTypeSelect);

  //   if (!promptValue) {
  //     return;
  //   }
  // };

  // const displayAllPrompts = () => {
  //   const allPrompts = getAllPrompts();
  //   const promptsByBlock = allPrompts.reduce(
  //     (acc: Record<number, any>, prompt) => {
  //       if (!acc[prompt.id]) {
  //         acc[prompt.id] = {};
  //       }
  //       acc[prompt.id][prompt.type] = prompt.value;
  //       return acc;
  //     },
  //     {}
  //   );

  //   const promptsText = Object.entries(promptsByBlock)
  //     .map(
  //       ([blockId, prompts]: [string, any]) =>
  //         `Block ${blockId}:\nSystem: ${prompts.system || "None"}\nUser: ${prompts.user || "None"}\n`
  //     )
  //     .join("\n");

  //   return promptsText;
  // };

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

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case "agent":
        return (
          <AgentBlock
            ref={(ref) => {
              if (ref) blockRefs.current[block.blockNumber] = ref;
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            // initialOutputVariable={block.outputVariable}
            // variables={variables}
            onAddVariable={handleAddVariable}
            onOpenTools={() => setIsToolsSheetOpen(true)}
            onSavePrompts={handleSavePrompts}
            isProcessing={isProcessing}
            onProcessingChange={setIsProcessing}
            initialSystemPrompt={block.systemPrompt}
            initialUserPrompt={block.userPrompt}
            initialSaveAsCsv={block.saveAsCsv}
            initialSource={block.sourceInfo}
            initialOutputVariable={block.outputVariable || null}
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
            onTransformationsUpdate={(updates) =>
              updateBlockData(block.blockNumber, updates)
            }
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
              // console.log("SearchAgent update received:", updates);
              updateBlockData(blockNumber, updates);
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
          />
        );
      case "contact":
        return (
          <ContactBlock
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
          />
        );
      case "webagent":
        return (
          <WebAgent
            ref={(ref) => {
              if (ref) blockRefs.current[block.blockNumber] = ref;
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onAddVariable={handleAddVariable}
            onOpenTools={() => setIsToolsSheetOpen(true)}
          />
        );
      default:
        const _exhaustiveCheck: never = block;
        throw new Error(`Unhandled block type: ${(block as any).type}`);
    }
  };

  // Add this near your other useEffects
  useEffect(() => {
    console.log("Current blockRefs contents:", blockRefs.current);
  }, [blockRefs.current]);

  // And modify runAllBlocks to wait for refs
  const runAllBlocks = () => {
    console.log("Starting new run");
    runBlocks(0); // Use our new implementation
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
        console.log("Loading agent with ID:", agentId);
        try {
          await loadAgent(agentId);
          console.log("Agent loaded successfully");
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
    console.log("Current agent state:", currentAgent);
  }, [currentAgent]);

  // Add this state for the new agent name
  const [newAgentName, setNewAgentName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Update the save function
  const handleSaveAsAgent = async () => {
    if (!newAgentName.trim()) {
      alert("Please enter an agent name");
      return;
    }

    setIsSaving(true);
    try {
      const { createAgent } = useAgentStore.getState();
      await createAgent(newAgentName);
      alert("Agent saved successfully!");
      setNewAgentName(""); // Reset the input
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
    console.log("Add Check-In button clicked!");
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

  const runBlocks = async (startIndex: number = 0) => {
    const blockList = getBlockList();
    console.log("Starting run from index:", startIndex);
    if (startIndex === 0) {
      useSourceStore.getState().clearVariables();
    }
    setIsProcessing(true);

    try {
      for (let i = startIndex; i < blockList.length; i++) {
        const block = blockList[i];
        setCurrentBlockIndex(i);
        console.log(`Processing block ${block.blockNumber} (${block.type})`);

        try {
          switch (block.type) {
            case "checkin":
              console.log(`Pausing at CheckInBlock ${block.blockNumber}`);

              // Send email notification before pausing
              try {
                const currentUser = auth.currentUser;
                console.log("Current user data:", {
                  email: currentUser?.email,
                  uid: currentUser?.uid,
                  displayName: currentUser?.displayName,
                });

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
              const contactRef = blockRefs.current[block.blockNumber];
              const success = await contactRef?.processBlock();
              if (!success) {
                console.error("Contact block failed, stopping execution");
                return;
              }
              break;
            case "agent":
              const agentRef = blockRefs.current[block.blockNumber];
              await agentRef?.processBlock();
              break;
            case "searchagent":
              const searchRef = blockRefs.current[block.blockNumber];
              await searchRef?.processBlock();
              break;
            case "webagent":
              const webRef = blockRefs.current[block.blockNumber];
              await webRef?.processBlock();
              break;
          }
        } catch (error) {
          console.error(`Error processing block ${block.blockNumber}:`, error);
          return; // Stop execution on error
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

  return (
    <Layout>
      <div style={pageStyle}>
        {/* <Header
          onApiKeyClick={() => setIsApiKeySheetOpen(true)}
        onToolsClick={() => setIsToolsSheetOpen(true)}
        onLogout={() => router.push("/login/signout")}
      /> */}
        {!isLoading && agentId ? (
          <AgentHeader />
        ) : (
          <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
            <div className="flex items-center gap-4">
              <Input
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Add an agent name"
                className="w-64 bg-gray-800 border-gray-700 text-white"
              />
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
                  Save New Agent
                </>
              )}
            </Button>
          </div>
        )}
        <main style={mainStyle}>
          <CollapsibleBox
            title="Agent Flow"
            variables={variables}
            agentId={agentId as string}
            onAddVariable={handleAddVariable}
            onOpenTools={() => setIsToolsSheetOpen(true)}
            onSavePrompts={handleSavePrompts}
            blockRefs={blockRefs}
          >
            {/* Then render other blocks */}
            {blocks.map((block) => renderBlock(block))}
          </CollapsibleBox>
          {/* <WebAgent
            blockNumber={1}
            onDeleteBlock={() => {}}
            onAddVariable={handleAddVariable}
            onOpenTools={() => setIsToolsSheetOpen(true)}
          /> */}
          {/* <SearchAgent
          blockNumber={1}
          onDeleteBlock={() => {}}
          onUpdateBlock={() => {}}
          variables={variables}
          onAddVariable={handleAddVariable}
        /> */}
          <div className="flex justify-end mt-4"></div>
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
          // variables={variables}
          onAddVariable={handleAddVariable}
        />
        <div className="w-full max-w-xl mx-auto mt-4">
          {/* <SourcesList /> */}
        </div>
      </div>
    </Layout>
  );
}
