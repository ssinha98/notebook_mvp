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

      // Clean and prepare blocks with prompts
      const blocksWithPrompts = blocks.map((block) => ({
        ...block,
        systemPrompt:
          usePromptStore.getState().getPrompt(block.blockNumber, "system") ||
          "",
        userPrompt:
          usePromptStore.getState().getPrompt(block.blockNumber, "user") || "",
        saveAsCsv: block.saveAsCsv || false,
      }));

      const updatedAgent = {
        id: currentAgent.id,
        name: currentAgent.name,
        userId,
        createdAt: currentAgent.createdAt,
        blocks: blocksWithPrompts,
      };

      await setDoc(
        doc(db, `users/${userId}/agents`, currentAgent.id),
        updatedAgent
      );
      set((state) => ({
        agents: state.agents.map((agent) =>
          agent.id === currentAgent.id ? updatedAgent : agent
        ),
        currentAgent: updatedAgent,
      }));
    } catch (error) {
      console.error("Error saving agent:", error);
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
