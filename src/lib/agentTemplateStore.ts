import { create } from "zustand";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/tools/firebase";
import { Block, Variable } from "@/types/types";

interface AgentTemplate {
  id: string;
  name: string;
  blocks: Block[];
  variables: Variable[];
  createdAt: string;
  createdBy: string;
  description?: string;
}

interface AgentTemplateStore {
  templates: AgentTemplate[];

  // Create a new template
  createAgentTemplate: (
    targetUserId: string,
    templateData: Omit<AgentTemplate, "id">
  ) => Promise<string>;

  // Get all templates for a user
  getTemplates: (userId: string) => Promise<AgentTemplate[]>;

  // Get a specific template
  getTemplate: (
    userId: string,
    templateId: string
  ) => Promise<AgentTemplate | null>;

  // Create a new agent from a template
  createAgentFromTemplate: (
    userId: string,
    templateId: string,
    newAgentName?: string
  ) => Promise<{ agentId: string; variables: Variable[] }>;
}

export const useAgentTemplateStore = create<AgentTemplateStore>()(
  (set, get) => ({
    templates: [],

    createAgentTemplate: async (targetUserId: string, templateData) => {
      try {
        console.log("=== TEMPLATE CREATION DEBUG ===");
        console.log("Original templateData:", templateData);
        console.log("templateData.blocks:", templateData.blocks);
        console.log("templateData.variables:", templateData.variables);

        const templateId = crypto.randomUUID();
        const templateRef = doc(
          db,
          "users",
          targetUserId,
          "templates",
          templateId
        );

        // Debug function to identify undefined values
        const logUndefinedFields = (obj: any, context: string) => {
          console.log(`=== ${context} ===`);
          Object.entries(obj).forEach(([key, value]) => {
            if (value === undefined) {
              console.warn(
                `❌ UNDEFINED: ${context} field "${key}" is undefined`
              );
            } else {
              console.log(`✅ ${key}:`, value);
            }
          });
        };

        // Log the original template data
        logUndefinedFields(templateData, "Original Template Data");

        // Clean the template data
        const cleanTemplateData = {
          name: templateData.name || "Untitled Template",
          blocks:
            templateData.blocks?.map((block, index) => {
              console.log(
                `\n--- Processing Block ${index + 1} (${block.type}) ---`
              );
              console.log("Original block:", block);

              // Log any undefined values in the original block
              logUndefinedFields(block, `Original Block #${block.blockNumber}`);

              // Simple cleaning - just replace undefined with defaults
              const cleanedBlock = {
                ...block,
                id: block.id || crypto.randomUUID(),
                name: block.name || `Block ${block.blockNumber}`,
                agentId: block.agentId || "",
                systemPrompt: block.systemPrompt || "",
                userPrompt: block.userPrompt || "",
                saveAsCsv: block.saveAsCsv || false,
                outputVariable: block.outputVariable || null,
                containsPrimaryInput:
                  (block as any).containsPrimaryInput || false,
                skip: (block as any).skip || false,
                // Handle specific block types that might have undefined fields
                ...(block.type === "apolloagent" && {
                  fullName: (block as any).fullName || "",
                  firstName: (block as any).firstName || "",
                  lastName: (block as any).lastName || "",
                  company: (block as any).company || "",
                  prompt: (block as any).prompt || "",
                  outputVariable: (block as any).outputVariable || null,
                }),
                ...(block.type === "searchagent" && {
                  query: (block as any).query || "",
                  engine: (block as any).engine || "search",
                  limit: (block as any).limit || 5,
                  topic: (block as any).topic || "",
                  section: (block as any).section || "",
                  timeWindow: (block as any).timeWindow || "",
                  trend: (block as any).trend || "indexes",
                  region: (block as any).region || "",
                  newsSearchType: (block as any).newsSearchType || "query",
                  newsTopic: (block as any).newsTopic || "",
                  newsSection: (block as any).newsSection || "",
                  financeWindow: (block as any).financeWindow || "1D",
                  marketsIndexMarket: (block as any).marketsIndexMarket || "",
                }),
                ...(block.type === "codeblock" && {
                  language: (block as any).language || "python",
                  code: (block as any).code || "",
                  status: (block as any).status || "tbd",
                }),
                ...(block.type === "contact" && {
                  channel: (block as any).channel || "email",
                  recipient: (block as any).recipient || "",
                  subject: (block as any).subject || "",
                  body: (block as any).body || "",
                }),
                ...(block.type === "webagent" && {
                  activeTab: (block as any).activeTab || "url",
                  searchVariable: (block as any).searchVariable || "",
                  url: (block as any).url || "",
                  selectedVariableId: (block as any).selectedVariableId || "",
                  selectedVariableName:
                    (block as any).selectedVariableName || "",
                  results: (block as any).results || [],
                }),
                ...(block.type === "make" && {
                  webhookUrl: (block as any).webhookUrl || "",
                  parameters: (block as any).parameters || [],
                }),
                ...(block.type === "excelagent" && {
                  fileUrl: (block as any).fileUrl || "",
                  sheetName: (block as any).sheetName || "",
                  range: (block as any).range || "",
                  operations: (block as any).operations || [],
                  prompt: (block as any).prompt || "",
                }),
                ...(block.type === "instagramagent" && {
                  url: (block as any).url || "",
                  postCount: (block as any).postCount || 0,
                }),
                ...(block.type === "deepresearchagent" && {
                  topic: (block as any).topic || "",
                  searchEngine: (block as any).searchEngine || "perplexity",
                }),
                ...(block.type === "pipedriveagent" && {
                  prompt: (block as any).prompt || "",
                }),
                ...(block.type === "datavizagent" && {
                  prompt: (block as any).prompt || "",
                  chartType: (block as any).chartType || "bar",
                }),
                ...(block.type === "clickupagent" && {
                  prompt: (block as any).prompt || "",
                }),
                ...(block.type === "googledriveagent" && {
                  prompt: (block as any).prompt || "",
                }),
                ...(block.type === "transform" && {
                  transformations: (block as any).transformations || {
                    filterCriteria: [],
                  },
                  sourceName: (block as any).sourceName || "",
                }),
                ...(block.type === "tabletransform" && {
                  tableId: (block as any).tableId || "",
                  operation: (block as any).operation || "deduplicate",
                  config: (block as any).config || {},
                }),
              };

              console.log("Cleaned block:", cleanedBlock);
              logUndefinedFields(
                cleanedBlock,
                `Cleaned Block #${block.blockNumber}`
              );

              return cleanedBlock;
            }) || [],
          variables:
            templateData.variables?.map((variable, index) => {
              console.log(`\n--- Processing Variable ${index + 1} ---`);
              console.log("Original variable:", variable);

              const cleanedVariable = {
                ...variable,
                id: variable.id || crypto.randomUUID(),
                name: variable.name || "Untitled Variable",
                type: variable.type || "intermediate",
                value: variable.type === "table" ? [] : "",
                updatedAt: new Date().toISOString(),
                agentId: variable.agentId || "",
                ...(variable.columns && { columns: variable.columns }),
              };

              console.log("Cleaned variable:", cleanedVariable);
              logUndefinedFields(cleanedVariable, `Variable ${index + 1}`);

              return cleanedVariable;
            }) || [],
          createdAt: templateData.createdAt || new Date().toISOString(),
          createdBy: templateData.createdBy || "",
          description: templateData.description || "",
        };

        console.log("\n=== FINAL CLEANED TEMPLATE DATA ===");
        console.log("cleanTemplateData:", cleanTemplateData);

        // Final check for any undefined values
        logUndefinedFields(cleanTemplateData, "Final Template Data");

        const template: AgentTemplate = {
          id: templateId,
          ...cleanTemplateData,
        };

        console.log("\n=== FINAL TEMPLATE OBJECT ===");
        console.log("template:", template);
        logUndefinedFields(template, "Final Template Object");

        console.log("=== END TEMPLATE CREATION DEBUG ===");

        await setDoc(templateRef, template);
        return templateId;
      } catch (error) {
        console.error("Error creating template:", error);
        throw error;
      }
    },

    getTemplates: async (userId: string) => {
      try {
        const templatesRef = collection(db, "users", userId, "templates");
        const templatesSnap = await getDocs(templatesRef);

        const templates = templatesSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AgentTemplate[];

        set({ templates });
        return templates;
      } catch (error) {
        console.error("Error getting templates:", error);
        throw error;
      }
    },

    getTemplate: async (userId: string, templateId: string) => {
      try {
        const templateRef = doc(db, "users", userId, "templates", templateId);
        const templateSnap = await getDoc(templateRef);

        if (!templateSnap.exists()) {
          return null;
        }

        return {
          id: templateSnap.id,
          ...templateSnap.data(),
        } as AgentTemplate;
      } catch (error) {
        console.error("Error getting template:", error);
        throw error;
      }
    },

    createAgentFromTemplate: async (
      userId: string,
      templateId: string,
      newAgentName?: string
    ) => {
      try {
        const template = await get().getTemplate(userId, templateId);
        if (!template) {
          throw new Error("Template not found");
        }

        // Generate the agent ID first and use it consistently
        const newAgentId = crypto.randomUUID();
        const agentRef = doc(db, "users", userId, "agents", newAgentId);
        const variablesRef = collection(db, "users", userId, "variables");

        // Create new agent with blocks from template
        const newAgent = {
          id: newAgentId, // Use the pre-generated ID
          name: newAgentName || `${template.name} (from template)`,
          userId,
          createdAt: new Date().toISOString(),
          blocks: template.blocks.map((block) => ({
            ...block,
            id: crypto.randomUUID(),
            agentId: newAgentId, // Use the same agent ID
          })),
        };

        await setDoc(agentRef, newAgent);

        // Create variables with the same agent ID
        const newVariables: Variable[] = [];
        for (const templateVar of template.variables) {
          const newVariable = {
            ...templateVar,
            id: templateVar.id, // Keep same ID to maintain block references
            agentId: newAgentId, // Use the same agent ID
            value: templateVar.type === "table" ? [] : "",
          };

          await setDoc(doc(variablesRef, newVariable.id), newVariable);
          newVariables.push(newVariable);
        }

        return { agentId: newAgentId, variables: newVariables };
      } catch (error) {
        console.error("Error creating agent from template:", error);
        throw error;
      }
    },
  })
);
