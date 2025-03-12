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
import { db } from "@/tools/firebase";
import { auth } from "@/tools/firebase";
import { Agent, AgentStore, Block } from "../types/types";
import { useSourceStore } from "./store";
import usePromptStore from "./store";
import { createRoot } from "react-dom/client";
import { SessionExpiredAlert } from "@/components/custom_components/SessionExpiredAlert";
import { onAuthStateChanged } from "firebase/auth";

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
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const { currentAgent } = get();
      if (!currentAgent) throw new Error("No agent selected");

      const preparedBlocks = blocks.map((block) => {
        const baseBlock = {
          id: block.id || crypto.randomUUID(),
          name: block.name || `Block ${block.blockNumber}`,
          type: block.type,
          blockNumber: block.blockNumber,
        };

        switch (block.type) {
          case "agent": {
            // Create the block object with defined type including sourceInfo
            const agentBlock: {
              id: string;
              name: string;
              type: Block["type"];
              blockNumber: number;
              systemPrompt: string;
              userPrompt: string;
              saveAsCsv: boolean;
              sourceInfo?: {
                nickname: string;
                downloadUrl: string;
              };
            } = {
              ...baseBlock,
              systemPrompt:
                usePromptStore
                  .getState()
                  .getPrompt(block.blockNumber, "system") || "",
              userPrompt:
                usePromptStore
                  .getState()
                  .getPrompt(block.blockNumber, "user") || "",
              saveAsCsv: Boolean(block.saveAsCsv),
            };

            if (block.sourceInfo?.nickname && block.sourceInfo?.downloadUrl) {
              agentBlock.sourceInfo = {
                nickname: block.sourceInfo.nickname,
                downloadUrl: block.sourceInfo.downloadUrl,
              };
            }

            return agentBlock;
          }

          case "searchagent":
            return {
              ...baseBlock,
              query: block.query || "",
              engine: block.engine || "search",
              limit: block.limit || 5,
              topic: block.topic || "",
              section: block.section || "",
              timeWindow: block.timeWindow || "",
              trend: block.trend || "",
              region: block.region || "",
            };

          case "checkin":
            return baseBlock;

          case "transform":
            return {
              ...baseBlock,
              transformations: block.transformations || { filterCriteria: [] },
              sourceName: block.sourceName || "",
            };

          // case "contact":
          //   return {
          //     ...baseBlock,
          //     channel: block.channel || "",
          //     recipient: block.recipient || "",
          //     subject: block.subject || "",
          //     body: block.body || "",
          //   };

          default:
            return baseBlock;
        }
      });

      const cleanAgent = {
        id: currentAgent.id || "",
        name: currentAgent.name || "Untitled Agent",
        userId: userId,
        createdAt: currentAgent.createdAt || new Date().toISOString(),
        blocks: preparedBlocks,
      };

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
}));
