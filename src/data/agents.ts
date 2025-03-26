import { Block } from "@/types/types"; // We'll use the existing Block type from the notebook

// Define the full agent type
export interface Agent {
  id: string;
  name: string;
  description: string;
  tags: string[];
  blocks: Block[]; // This will hold the agent's block configuration
  // We can add more fields later like:
  // version: string;
  // author: string;
  // created: Date;
  // lastModified: Date;
  // etc.
}

// Convert our existing AGENTS data to the new format
export const AGENTS: Agent[] = [
  {
    id: "1",
    name: "Lead Qualifier",
    tags: ["Sales"],
    description:
      "Qualify leads efficiently with automated analysis and scoring",
    blocks: [
      // We'll add the block configurations later
      // Example structure:
      // {
      //   type: "agent",
      //   blockNumber: 1,
      //   systemPrompt: "You are a lead qualification expert...",
      //   userPrompt: "Analyze the following lead data...",
      //   ...other block properties
      // }
    ],
  },
  {
    id: "2",
    name: "Personalized Cold Email Generator",
    tags: ["Sales", "Marketing"],
    description: "Generate personalized cold emails that convert",
    blocks: [],
  },
  // ... convert all other agents
];

// Helper function to get agent by ID
export function getAgentById(id: string): Agent | undefined {
  return AGENTS.find((agent) => agent.id === id);
}
