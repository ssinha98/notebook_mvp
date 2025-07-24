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
        const templateId = crypto.randomUUID();
        const templateRef = doc(
          db,
          "users",
          targetUserId,
          "templates",
          templateId
        );

        const template: AgentTemplate = {
          id: templateId,
          ...templateData,
        };

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
