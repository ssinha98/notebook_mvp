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
  ContactBlock,
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
      // console.log("Agents loaded:", agents);
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
      // console.log("=== SAVE AGENT DEBUG ===");
      // console.log("Total blocks received:", blocks.length);

      // Find and log contact blocks specifically
      // const contactBlocks = blocks.filter((block) => block.type === "contact");
      // console.log("Contact blocks found:", contactBlocks.length);
      // contactBlocks.forEach((block, index) => {
      //   console.log(`Contact Block ${index + 1}:`, {
      //     blockNumber: block.blockNumber,
      //     type: block.type,
      //     subject: (block as any).subject,
      //     recipient: (block as any).recipient,
      //     body: (block as any).body,
      //     channel: (block as any).channel,
      //     fullBlock: block,
      //   });
      // });
      // console.log("=== END INITIAL DEBUG ===");

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
        } else if (block.type === "codeblock") {
          return {
            ...block,
            id: block.id || crypto.randomUUID(),
            name: block.name || `Code ${block.blockNumber}`,
            language: block.language || "python",
            code: block.code || "",
            status: block.status || "tbd", // Preserve status field
            outputVariable: block.outputVariable || null,
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
              outputVariable:
                agentBlock.outputVariable?.id &&
                agentBlock.outputVariable.name &&
                agentBlock.outputVariable.type
                  ? agentBlock.outputVariable
                  : null,
              sourceInfo: agentBlock.sourceInfo || {
                nickname: "",
                downloadUrl: "",
              },
              id: agentBlock.id || `block-${agentBlock.blockNumber}`,
              name: agentBlock.name || `Block ${agentBlock.blockNumber}`,
              blockNumber: agentBlock.blockNumber,
              type: agentBlock.type,
              agentId: get().currentAgent?.id || "",
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
              agentId: get().currentAgent?.id || "",
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
              agentId: get().currentAgent?.id || "",
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
              agentId: get().currentAgent?.id || "",
            };
            return preparedBlock;
          }

          case "contact": {
            const contactBlock = block as ContactBlock;
            // console.log("===  ===");
            // console.log("Raw contact block:", contactBlock);
            // console.log("Subject value:", contactBlock.subject);
            // console.log("Recipient value:", contactBlock.recipient);
            // console.log("Body value:", contactBlock.body);
            // console.log("Channel CONTACT BLOCK DEBUGvalue:", contactBlock.channel);

            const preparedBlock = {
              ...contactBlock,
              id: contactBlock.id || `block-${contactBlock.blockNumber}`,
              name: contactBlock.name || `Block ${contactBlock.blockNumber}`,
              blockNumber: contactBlock.blockNumber,
              type: contactBlock.type,
              channel: contactBlock.channel || "email",
              recipient: contactBlock.recipient || "",
              subject: contactBlock.subject || "",
              body: contactBlock.body || "",
              agentId: get().currentAgent?.id || "",
              // Include required BaseBlock fields
              systemPrompt: contactBlock.systemPrompt || "",
              userPrompt: contactBlock.userPrompt || "",
              saveAsCsv: contactBlock.saveAsCsv || false,
            } as ContactBlock;

            // console.log("Prepared contact block:", preparedBlock);
            // console.log("=== END CONTACT DEBUG ===");

            logUndefinedFields(
              preparedBlock,
              `Prepared Contact Block #${block.blockNumber}`
            );
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
              outputVariable:
                webBlock.outputVariable?.id &&
                webBlock.outputVariable.name &&
                webBlock.outputVariable.type
                  ? webBlock.outputVariable
                  : null,
            };

            logUndefinedFields(
              preparedBlock,
              `Prepared Web Block #${block.blockNumber}`
            );
            return preparedBlock;
          }

          case "make": {
            const makeBlock = block as any;
            const preparedBlock = {
              ...makeBlock,
              id: makeBlock.id || `block-${makeBlock.blockNumber}`,
              name: makeBlock.name || `Block ${makeBlock.blockNumber}`,
              blockNumber: makeBlock.blockNumber,
              type: makeBlock.type,
              webhookUrl: makeBlock.webhookUrl || "",
              parameters: makeBlock.parameters || [],
              outputVariable: makeBlock.outputVariable || null,
              agentId: get().currentAgent?.id || "",
              // Ensure all required fields from BaseBlock are included
              systemPrompt: makeBlock.systemPrompt || "",
              userPrompt: makeBlock.userPrompt || "",
              saveAsCsv: makeBlock.saveAsCsv || false,
            };

            logUndefinedFields(
              preparedBlock,
              `Prepared Make Block #${block.blockNumber}`
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

      // console.log("Final agent data to save:", cleanAgent);

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
      // console.log("Starting to load agent:", agentId);
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const agentDoc = await getDoc(doc(db, `users/${userId}/agents`, agentId));
      if (agentDoc.exists()) {
        const agent = { id: agentDoc.id, ...agentDoc.data() } as Agent;
        // console.log("Successfully loaded agent:", agent);

        // Process blocks to ensure all fields are properly set
        const processedBlocks = agent.blocks.map((block) => {
          if (block.type === "codeblock") {
            return {
              ...block,
              status: block.status || "tbd", // Ensure status is preserved
              language: block.language || "python",
              code: block.code || "",
              outputVariable: block.outputVariable || null,
            };
          }
          return block;
        });

        const processedAgent = {
          ...agent,
          blocks: processedBlocks,
        };

        set({ currentAgent: processedAgent });

        // Update blocks in source store
        const { resetBlocks, addBlockToNotebook } = useSourceStore.getState();
        resetBlocks();
        processedAgent.blocks.forEach((block) => {
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

  checkMasterRole: async (): Promise<boolean> => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return false;

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.master === true;
      }
      return false;
    } catch (error) {
      console.error("Error checking master role:", error);
      return false;
    }
  },

  createAgentForUser: async (
    name: string,
    targetUserId: string,
    blocks?: Block[]
  ) => {
    try {
      const currentUserId = auth.currentUser?.uid;
      if (!currentUserId) throw new Error("No user logged in");

      // Check if current user has master role
      const isMaster = await get().checkMasterRole();
      if (!isMaster) throw new Error("Insufficient permissions");

      // Get current agent ID to filter variables
      const currentAgentId = get().currentAgent?.id;
      if (!currentAgentId) throw new Error("No current agent selected");

      // Use the exact same block cleaning logic as saveAgent
      const cleanBlocks = blocks
        ? blocks.map((block) => {
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
            } else if (block.type === "codeblock") {
              return {
                ...block,
                id: block.id || crypto.randomUUID(),
                name: block.name || `Code ${block.blockNumber}`,
                language: block.language || "python",
                code: block.code || "",
                status: block.status || "tbd",
                outputVariable: block.outputVariable || null,
              };
            }
            return block;
          })
        : [];

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

      // Use the exact same preparation logic as saveAgent
      const preparedBlocks = cleanBlocks.map((block) => {
        logUndefinedFields(block, `Block #${block.blockNumber}`);

        switch (block.type) {
          case "agent": {
            const agentBlock = block as AgentBlock;
            const preparedBlock = {
              ...agentBlock,
              systemPrompt: agentBlock.systemPrompt || "",
              userPrompt: agentBlock.userPrompt || "",
              saveAsCsv: Boolean(agentBlock.saveAsCsv),
              outputVariable:
                agentBlock.outputVariable?.id &&
                agentBlock.outputVariable.name &&
                agentBlock.outputVariable.type
                  ? agentBlock.outputVariable
                  : null,
              sourceInfo: agentBlock.sourceInfo || {
                nickname: "",
                downloadUrl: "",
              },
              id: agentBlock.id || `block-${agentBlock.blockNumber}`,
              name: agentBlock.name || `Block ${agentBlock.blockNumber}`,
              blockNumber: agentBlock.blockNumber,
              type: agentBlock.type,
              agentId: get().currentAgent?.id || "",
            } as AgentBlock;

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
              id: block.id || `block-${block.blockNumber}`,
              name: block.name || `Block ${block.blockNumber}`,
              blockNumber: block.blockNumber,
              type: block.type,
              agentId: get().currentAgent?.id || "",
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
              agentId: get().currentAgent?.id || "",
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
              agentId: get().currentAgent?.id || "",
            };
            return preparedBlock;
          }

          case "contact": {
            const contactBlock = block as ContactBlock;
            const preparedBlock = {
              ...contactBlock,
              id: contactBlock.id || `block-${contactBlock.blockNumber}`,
              name: contactBlock.name || `Block ${contactBlock.blockNumber}`,
              blockNumber: contactBlock.blockNumber,
              type: contactBlock.type,
              channel: contactBlock.channel || "email",
              recipient: contactBlock.recipient || "",
              subject: contactBlock.subject || "",
              body: contactBlock.body || "",
              agentId: get().currentAgent?.id || "",
              // Include required BaseBlock fields
              systemPrompt: contactBlock.systemPrompt || "",
              userPrompt: contactBlock.userPrompt || "",
              saveAsCsv: contactBlock.saveAsCsv || false,
            } as ContactBlock;

            logUndefinedFields(
              preparedBlock,
              `Prepared Contact Block #${block.blockNumber}`
            );
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
              agentId: "", // Will be set to new agent ID below
              systemPrompt: webBlock.systemPrompt || "",
              userPrompt: webBlock.userPrompt || "",
              saveAsCsv: webBlock.saveAsCsv || false,
              url: webBlock.url || "",
              selectedVariableId: webBlock.selectedVariableId || "",
              selectedVariableName: webBlock.selectedVariableName || "",
              results: webBlock.results || [],
              outputVariable:
                webBlock.outputVariable?.id &&
                webBlock.outputVariable.name &&
                webBlock.outputVariable.type
                  ? webBlock.outputVariable
                  : null,
            };

            logUndefinedFields(
              preparedBlock,
              `Prepared Web Block #${block.blockNumber}`
            );
            return preparedBlock;
          }

          case "make": {
            const makeBlock = block as any;
            const preparedBlock = {
              ...makeBlock,
              id: makeBlock.id || `block-${makeBlock.blockNumber}`,
              name: makeBlock.name || `Block ${makeBlock.blockNumber}`,
              blockNumber: makeBlock.blockNumber,
              type: makeBlock.type,
              webhookUrl: makeBlock.webhookUrl || "",
              parameters: makeBlock.parameters || [],
              outputVariable: makeBlock.outputVariable || null,
              agentId: "", // Will be set to new agent ID below
              systemPrompt: makeBlock.systemPrompt || "",
              userPrompt: makeBlock.userPrompt || "",
              saveAsCsv: makeBlock.saveAsCsv || false,
            };

            logUndefinedFields(
              preparedBlock,
              `Prepared Make Block #${block.blockNumber}`
            );
            return preparedBlock;
          }

          default: {
            // For block types not explicitly handled, preserve all properties
            return {
              ...block,
              agentId: "", // Will be set to new agent ID below
            };
          }
        }
      });

      // Generate new agent ID
      const newAgentId = doc(collection(db, `users/${targetUserId}/agents`)).id;

      // Update all block agentIds to point to the new agent
      const blocksWithCorrectAgentId = preparedBlocks.map((block) => ({
        ...block,
        agentId: newAgentId,
      }));

      // Get all variables for the current agent
      // console.log("Fetching variables for agent:", currentAgentId);
      const currentUserVariablesRef = collection(
        db,
        `users/${currentUserId}/variables`
      );
      const variablesQuery = query(
        currentUserVariablesRef,
        where("agentId", "==", currentAgentId)
      );
      const variablesSnapshot = await getDocs(variablesQuery);

      const variablesToTransfer = variablesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{
        id: string;
        name: string;
        type: "input" | "intermediate" | "table";
        value: string | any[];
        updatedAt: string;
        agentId: string;
        columns?: string[];
      }>;

      // console.log(
      //   `Found ${variablesToTransfer.length} variables to transfer:`,
      //   variablesToTransfer
      // );

      // Create new variables for the target user with SAME IDs
      const targetUserVariablesRef = collection(
        db,
        `users/${targetUserId}/variables`
      );
      const variableTransferPromises = variablesToTransfer.map(
        async (originalVariable) => {
          // Use the original variable ID instead of generating a new one
          const newVariableRef = doc(
            targetUserVariablesRef,
            originalVariable.id
          );
          const newVariable = {
            id: originalVariable.id, // Keep the same ID
            name: originalVariable.name,
            type: originalVariable.type,
            value: originalVariable.value,
            updatedAt: new Date().toISOString(),
            agentId: newAgentId, // Point to the new agent
            ...(originalVariable.columns && {
              columns: originalVariable.columns,
            }),
          };

          await setDoc(newVariableRef, newVariable);
          return newVariable;
        }
      );

      // Wait for all variables to be created
      const createdVariables = await Promise.all(variableTransferPromises);

      const newAgent: Agent = {
        id: newAgentId,
        name,
        userId: targetUserId,
        createdAt: new Date().toISOString(),
        blocks: blocksWithCorrectAgentId as Block[], // No need to update variable references!
      };

      // Final check for any undefined values
      logUndefinedFields(newAgent, "Final Agent Object for Other User");

      // console.log("Final agent data to save for other user:", newAgent);

      // Save to target user's agents subcollection
      await setDoc(
        doc(db, `users/${targetUserId}/agents`, newAgent.id),
        newAgent
      );

      // console.log(`Agent created for user ${targetUserId}:`, newAgent);
      // console.log(`Variables transferred: ${createdVariables.length}`);

      return newAgent;
    } catch (error) {
      console.error("Error creating agent for user:", error);
      throw error;
    }
  },

  copyAgent: async (agentId: string, newName: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      // Get the agent to copy
      const agentDoc = await getDoc(doc(db, `users/${userId}/agents`, agentId));
      if (!agentDoc.exists()) throw new Error("Agent not found");

      const agentToCopy = { id: agentDoc.id, ...agentDoc.data() } as Agent;

      // Generate new agent ID
      const newAgentId = doc(collection(db, `users/${userId}/agents`)).id;

      // Copy blocks and update agentId references
      const copiedBlocks = agentToCopy.blocks.map((block) => ({
        ...block,
        id: crypto.randomUUID(), // Generate new block IDs
        agentId: newAgentId,
      }));

      // Get all variables for the original agent
      const variablesRef = collection(db, `users/${userId}/variables`);
      const variablesQuery = query(
        variablesRef,
        where("agentId", "==", agentId)
      );
      const variablesSnapshot = await getDocs(variablesQuery);

      const variablesToCopy = variablesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Array<{
        id: string;
        name: string;
        type: "input" | "intermediate" | "table";
        value: string | any[];
        updatedAt: string;
        agentId: string;
        columns?: string[];
      }>;

      // Create new variables with new IDs and empty values
      const variableCopyPromises = variablesToCopy.map(
        async (originalVariable) => {
          const newVariableId = crypto.randomUUID();
          const newVariableRef = doc(variablesRef, newVariableId);
          const newVariable = {
            id: newVariableId,
            name: originalVariable.name,
            type: originalVariable.type,
            value: originalVariable.type === "table" ? [] : "", // Empty array for tables, empty string for others
            updatedAt: new Date().toISOString(),
            agentId: newAgentId,
            ...(originalVariable.columns && {
              columns: originalVariable.columns, // Keep the column structure for tables
            }),
          };

          await setDoc(newVariableRef, newVariable);
          return newVariable;
        }
      );

      // Wait for all variables to be created
      await Promise.all(variableCopyPromises);

      // Create the new agent - only include properties that are not undefined
      const newAgent: Agent = {
        id: newAgentId,
        name: newName,
        userId,
        createdAt: new Date().toISOString(),
        blocks: copiedBlocks as Block[],
        // Only copy properties that are not undefined
        ...(agentToCopy.agent_rating_thumbs_up !== undefined && {
          agent_rating_thumbs_up: agentToCopy.agent_rating_thumbs_up,
        }),
        ...(agentToCopy.agent_rating_thumbs_down !== undefined && {
          agent_rating_thumbs_down: agentToCopy.agent_rating_thumbs_down,
        }),
        ...(agentToCopy.start_method && {
          start_method: agentToCopy.start_method,
        }),
        ...(agentToCopy.deploymentType && {
          deploymentType: agentToCopy.deploymentType,
        }),
        ...(agentToCopy.start_date && {
          start_date: agentToCopy.start_date,
        }),
        ...(agentToCopy.start_time && {
          start_time: agentToCopy.start_time,
        }),
        ...(agentToCopy.sourceInfo && {
          sourceInfo: agentToCopy.sourceInfo,
        }),
      };

      // Save the new agent
      await setDoc(doc(db, `users/${userId}/agents`, newAgent.id), newAgent);

      // Update local state
      set((state) => ({
        agents: [...state.agents, newAgent],
      }));

      // console.log(`Agent copied successfully: ${newAgent.name}`);
      return newAgent;
    } catch (error) {
      console.error("Error copying agent:", error);
      throw error;
    }
  },
}));
