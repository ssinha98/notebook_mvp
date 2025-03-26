import React from "react";
import { create } from "zustand";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  where,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/tools/firebase";
import {
  Agent,
  AgentBlock,
  AgentStore,
  Block,
  SearchAgentBlock,
  TransformBlock,
  WebAgentBlock,
} from "../types/types";
import { useSourceStore } from "./store";
import usePromptStore from "./store";
// import { createRoot } from "react-dom/client";
// import { SessionExpiredAlert } from "@/components/custom_components/SessionExpiredAlert";
import { onAuthStateChanged } from "firebase/auth";
import { useVariableStore } from "./variableStore";

export const useAgentStore = create<AgentStore>()((set, get) => ({
  agents: [],
  currentAgent: null,

  loadAgents: async () => {
    try {
      // Wait for auth to initialize
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          unsubscribe();
          resolve(user);
        });
      });

      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const agentsRef = collection(db, `users/${userId}/agents`);
      const snapshot = await getDocs(agentsRef);
      const agents = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      set({ agents: agents as Agent[] });
      console.log("Agents loaded:", agents);
    } catch (error) {
      console.error("Error loading agents:", error);
      throw error; // Let the SessionHandler component handle the error
    }
  },

  createAgent: async (name: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const newAgent: Agent = {
        id: doc(collection(db, `users/${userId}/agents`)).id,
        name,
        userId,
        createdAt: new Date().toISOString(),
        blocks: [],
      };

      await setDoc(doc(db, `users/${userId}/agents`, newAgent.id), newAgent);
      set((state) => ({
        agents: [...state.agents, newAgent],
        currentAgent: newAgent,
      }));
    } catch (error) {
      console.error("Error creating agent:", error);
    }
  },

  saveAgent: async (blocks: Block[]) => {
    try {
      const cleanBlocks = blocks.map((block) => {
        if (block.type === "searchagent") {
          // Ensure every field has a default value
          return {
            id: block.id || crypto.randomUUID(),
            type: "searchagent",
            blockNumber: block.blockNumber,
            name: block.name || `Search ${block.blockNumber}`,
            query: block.query || "",
            engine: block.engine || "search",
            limit: block.limit || 5,
            topic: block.topic || "",
            section: block.section || "",
            timeWindow: block.timeWindow || "",
            trend: block.trend || "indexes",
            region: block.region || "",
            outputVariable: block.outputVariable || null,
            newsSearchType: block.newsSearchType || "query",
            newsTopic: block.newsTopic || "",
            newsSection: block.newsSection || "",
            financeWindow: block.financeWindow || "1D",
            marketsIndexMarket: block.marketsIndexMarket || "",
          };
        }
        return block;
      });

      const cleanData = {
        ...get().currentAgent,
        blocks: cleanBlocks,
        updatedAt: new Date().toISOString(),
      };

      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const { currentAgent } = get();
      if (!currentAgent) throw new Error("No agent selected");

      // Debug function to identify undefined values
      const logUndefinedFields = (obj: any, context: string) => {
        Object.entries(obj).forEach(([key, value]) => {
          if (value === undefined) {
            console.warn(
              `${context}: Found undefined value for field "${key}"`
            );
          }
        });
      };

      const preparedBlocks = cleanBlocks.map((block) => {
        // Log any undefined values in the original block
        logUndefinedFields(block, `Block #${block.blockNumber}`);

        switch (block.type) {
          case "agent": {
            const agentBlock = block as AgentBlock;
            const preparedBlock = {
              ...agentBlock,
              systemPrompt: agentBlock.systemPrompt || "",
              userPrompt: agentBlock.userPrompt || "",
              saveAsCsv: Boolean(agentBlock.saveAsCsv),
              outputVariable: null,
              sourceInfo: {
                nickname: "",
                downloadUrl: "",
              },
              id: agentBlock.id || `block-${agentBlock.blockNumber}`,
              name: agentBlock.name || `Block ${agentBlock.blockNumber}`,
              blockNumber: agentBlock.blockNumber,
              type: agentBlock.type,
            } as AgentBlock;

            // Log any remaining undefined values
            logUndefinedFields(
              preparedBlock,
              `Prepared Agent Block #${block.blockNumber}`
            );
            return preparedBlock;
          }

          case "searchagent": {
            const preparedBlock = {
              ...block,
              query: block.query || "",
              engine: block.engine || "search",
              limit: block.limit || 5,
              outputVariable:
                block.outputVariable?.id &&
                block.outputVariable.name &&
                block.outputVariable.type
                  ? block.outputVariable
                  : null,
              // Ensure required fields have default values
              id: block.id || `block-${block.blockNumber}`,
              name: block.name || `Block ${block.blockNumber}`,
              blockNumber: block.blockNumber,
              type: block.type,
            } as SearchAgentBlock;

            logUndefinedFields(
              preparedBlock,
              `Prepared Search Block #${block.blockNumber}`
            );
            return preparedBlock;
          }

          case "transform": {
            const transformBlock = block as TransformBlock;
            const preparedBlock = {
              ...transformBlock,
              transformations: transformBlock.transformations || {
                filterCriteria: [],
              },
              sourceName: transformBlock.sourceName || "",
              outputVariable:
                transformBlock.outputVariable?.id &&
                transformBlock.outputVariable.name &&
                transformBlock.outputVariable.type
                  ? transformBlock.outputVariable
                  : null,
              id: transformBlock.id || `block-${transformBlock.blockNumber}`,
              name:
                transformBlock.name || `Block ${transformBlock.blockNumber}`,
              blockNumber: transformBlock.blockNumber,
              type: transformBlock.type,
            } as TransformBlock;

            logUndefinedFields(
              preparedBlock,
              `Prepared Transform Block #${block.blockNumber}`
            );
            return preparedBlock;
          }

          case "checkin": {
            const preparedBlock = {
              ...block,
              id: block.id || `block-${block.blockNumber}`,
              name: block.name || `Block ${block.blockNumber}`,
              blockNumber: block.blockNumber,
              type: block.type,
            };
            return preparedBlock;
          }

          case "webagent": {
            const webBlock = block as unknown as WebAgentBlock;
            const preparedBlock = {
              ...webBlock,
              id: webBlock.id || `block-${webBlock.blockNumber}`,
              name: webBlock.name || `Block ${webBlock.blockNumber}`,
              blockNumber: webBlock.blockNumber,
              type: webBlock.type,
              activeTab: webBlock.activeTab || "url",
              searchVariable: webBlock.searchVariable || "",
              agentId: get().currentAgent?.id || "",
              systemPrompt: webBlock.systemPrompt || "",
              userPrompt: webBlock.userPrompt || "",
              saveAsCsv: webBlock.saveAsCsv || false,
              url: webBlock.url || "",
              selectedVariableId: webBlock.selectedVariableId || "",
              selectedVariableName: webBlock.selectedVariableName || "",
              results: webBlock.results || [],
            };

            logUndefinedFields(
              preparedBlock,
              `Prepared Web Block #${block.blockNumber}`
            );
            return preparedBlock;
          }

          default: {
            // Remove exhaustive check since we handle all known types
            return block;
          }
        }
      });

      const cleanAgent: Agent = {
        id: currentAgent.id,
        name: currentAgent.name || "Untitled Agent",
        userId,
        createdAt: currentAgent.createdAt || new Date().toISOString(),
        blocks: preparedBlocks as Block[], // Explicitly cast to Block[]
      };

      // Final check for any undefined values
      logUndefinedFields(cleanAgent, "Final Agent Object");

      console.log("Final agent data to save:", cleanAgent);

      await setDoc(
        doc(db, `users/${userId}/agents`, currentAgent.id),
        cleanAgent
      );

      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === currentAgent.id ? cleanAgent : agent
        ),
        currentAgent: cleanAgent,
      }));
    } catch (error) {
      console.error("Error saving agent:", error);
      throw error;
    }
  },

  loadAgent: async (agentId: string) => {
    try {
      console.log("Starting to load agent:", agentId);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const agentDoc = await getDoc(doc(db, `users/${userId}/agents`, agentId));
      if (agentDoc.exists()) {
        const agent = { id: agentDoc.id, ...agentDoc.data() } as Agent;
        console.log("Successfully loaded agent:", agent);
        set({ currentAgent: agent });

        // Update blocks in source store
        const { resetBlocks, addBlockToNotebook } = useSourceStore.getState();
        resetBlocks();
        agent.blocks.forEach((block) => {
          addBlockToNotebook(block);
        });

        // Load all variables for the user
        await useVariableStore.getState().loadVariables(agentId);
      } else {
        console.error("Agent document doesn't exist");
      }
    } catch (error) {
      console.error("Error loading agent:", error);
    }
  },

  deleteAgent: async (agentId: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      await deleteDoc(doc(db, `users/${userId}/agents`, agentId));
      set((state) => ({
        agents: state.agents.filter((agent) => agent.id !== agentId),
        currentAgent:
          state.currentAgent?.id === agentId ? null : state.currentAgent,
      }));
    } catch (error) {
      console.error("Error deleting agent:", error);
    }
  },

  updateAgentName: async (agentId: string, newName: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const agentRef = doc(db, `users/${userId}/agents`, agentId);
      await updateDoc(agentRef, { name: newName });

      // Update local state
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === agentId ? { ...agent, name: newName } : agent
        ),
        currentAgent:
          state.currentAgent?.id === agentId
            ? { ...state.currentAgent, name: newName }
            : state.currentAgent,
      }));
    } catch (error) {
      console.error("Error updating agent name:", error);
      throw error;
    }
  },

  updateAgent: async (agentId: string, data: Partial<Agent>) => {
    try {
      // Clean blocks based on their type
      const cleanBlocks = data.blocks?.map((block) => {
        if (block.type === "agent") {
          return {
            id: block.id,
            type: block.type,
            blockNumber: block.blockNumber,
            name: block.name || `Block ${block.blockNumber}`,
            systemPrompt: block.systemPrompt || "",
            userPrompt: block.userPrompt || "",
            outputVariable: block.outputVariable || null,
            saveAsCsv: block.saveAsCsv || false,
            sourceInfo: block.sourceInfo || null, // Convert undefined to null
          };
        } else if (block.type === "searchagent") {
          return {
            ...block,
            query: block.query || "",
            limit: block.limit || 5,
            topic: block.topic || "",
            section: block.section || "",
            timeWindow: block.timeWindow || "",
            trend: block.trend || "indexes",
            region: block.region || "",
            outputVariable: block.outputVariable || null,
          };
        }
        return block;
      });

      const cleanData = {
        ...data,
        blocks: cleanBlocks,
        updatedAt: new Date().toISOString(),
      };

      const userDoc = doc(db, "users", auth.currentUser?.uid || "");
      const agentDoc = doc(userDoc, "agents", agentId);
      await setDoc(agentDoc, cleanData, { merge: true });

      return { success: true };
    } catch (error) {
      console.error("Error saving agent:", error);
      return { success: false, error: String(error) };
    }
  },
}));
