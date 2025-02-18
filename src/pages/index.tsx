"use client";

import { CSSProperties, useState, useRef, useEffect } from "react";
import Header from "../components/custom_components/header";
import Footer from "../components/custom_components/footer";
import CollapsibleBox from "../components/custom_components/CollapsibleBox";
import React from "react";
import ApiKeySheet from "../components/custom_components/ApiKeySheet";
import ToolsSheet from "../components/custom_components/ToolsSheet";
import { Variable } from "@/types/types";
import usePromptStore from "../lib/store";
import { api } from "@/tools/api";
import { AgentBlockRef } from "../components/custom_components/AgentBlock";
import posthog from "posthog-js";
// import { SourcesList } from "@/pages/components/SourcesList"; // commented out
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

export default function Home() {
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
  const blocks = useSourceStore((state) => state.blocks);
  const updateBlock = useSourceStore((state) => state.updateBlock);

  const handleSavePrompts = (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string
  ) => {
    addPrompt(blockNumber, "system", systemPrompt);
    addPrompt(blockNumber, "user", userPrompt);

    // Update the block in the store instead of local state
    updateBlock(blockNumber, {
      systemPrompt,
      userPrompt,
    });
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

  const runAllBlocks = async () => {
    setIsProcessing(true);
    try {
      // Get all block numbers and sort them
      const blockNumbers = Object.keys(blockRefs.current)
        .map(Number)
        .sort((a, b) => a - b);

      // Run blocks sequentially
      for (const blockNumber of blockNumbers) {
        const blockRef = blockRefs.current[blockNumber];
        if (blockRef) {
          const success = await blockRef.processBlock();
          if (!success) {
            console.error(`Failed to process block ${blockNumber}`);
            break;
          }
          // Update count after each successful block processing
          const response = await api.get("/api/check-api-key");
          setApiCallCount(response.count);
        }
      }
    } catch (error) {
      console.error("Error running blocks:", error);
    } finally {
      setIsProcessing(false);
    }
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
        useSourceStore.getState().addBlockToNotebook({
          ...block,
          systemPrompt: block.systemPrompt || "",
          userPrompt: block.userPrompt || "",
        });
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

  return (
    <div style={pageStyle}>
      <Header
        onApiKeyClick={() => setIsApiKeySheetOpen(true)}
        onToolsClick={() => setIsToolsSheetOpen(true)}
        onLogout={() => router.push("/login/signout")}
      />
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
          onAddVariable={handleAddVariable}
          onOpenTools={() => setIsToolsSheetOpen(true)}
          onSavePrompts={handleSavePrompts}
          blockRefs={blockRefs}
        />
        <CollapsibleBox
          title="Output"
          isExpandedByDefault={false}
          style={{ minHeight: "200px" }}
          onSavePrompts={handleSavePrompts}
        >
          <div className="p-4">
            <h4 className="text-sm font-medium mb-4 text-gray-300">
              Variables Overview
            </h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Variable Name</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {variables.map((variable) => (
                  <TableRow key={variable.id}>
                    <td className="px-4 py-2 text-gray-300">{variable.name}</td>
                    <td className="px-4 py-2 text-gray-300">
                      {variable.value || "no value saved yet"}
                    </td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CollapsibleBox>

        <div className="flex justify-end mt-4"></div>
      </main>
      <Footer
        onRun={runAllBlocks}
        // onClearPrompts={handleClearPrompts}
        isProcessing={isProcessing}
      />
      <ApiKeySheet
        open={isApiKeySheetOpen}
        onOpenChange={setIsApiKeySheetOpen}
        apiCallCount={apiCallCount}
      />
      <ToolsSheet
        open={isToolsSheetOpen}
        onOpenChange={setIsToolsSheetOpen}
        variables={variables}
        onAddVariable={handleAddVariable}
      />
      <div className="w-full max-w-xl mx-auto mt-4">
        {/* <SourcesList /> */}
      </div>
    </div>
  );
}
