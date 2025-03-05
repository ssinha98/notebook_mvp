export interface Variable {
  id: string;
  name: string;
  type: "input" | "intermediate";
  value?: any;
  description?: string;
}

// types.ts
export type PromptType = "system" | "user";

export interface Prompt {
  id: number;
  type: PromptType;
  value: string;
}

export interface PromptStore {
  prompts: Prompt[];
  addPrompt: (id: number, type: PromptType, value: string) => void;
  getPrompt: (id: number, type: PromptType) => string | undefined;
  getAllPrompts: () => Prompt[];
  updatePrompt: (id: number, type: PromptType, value: string) => void;
  deletePrompt: (id: number, type: PromptType) => void;
  clearPrompts: () => void;
}

export interface Source {
  type: string;
  processedData: string;
  rawData?: any[]; // For CSV data in JSON format
  originalName: string;
  filterCriteria?: FilterCriteria[];
  metadata?: {
    original_row_count: number;
    filtered_row_count: number;
    columns: string[];
    applied_filters: FilterCriteria[];
  };
}

export interface SourceStore {
  sources: Record<string, Source>;
  addSource: (name: string, source: Source) => void;
  removeSource: (name: string) => void;
  updateBlockData: (blockNumber: number, updates: Partial<Block>) => void;
}

export interface FilterCriteria {
  id: string;
  column: string;
  operator: string;
  value: string;
}

export interface TransformationData {
  filterCriteria: FilterCriteria[];
  columns?: string[];
  previewData?: any[];
  processedData?: any[];
}

export interface Block {
  id: string;
  name: string;
  type:
    | "input"
    | "intermediate"
    | "transform"
    | "agent"
    | "checkin"
    | "searchagent";
  blockNumber: number;
  error?: string;
  originalFilePath?: string;
  sourceName?: string;
  fileType?: "image" | "csv" | "pdf" | "website";
  transformations?: TransformationData;
  systemPrompt?: string;
  userPrompt?: string;
  saveAsCsv?: boolean;
  channel?: string;
  recipient?: string;
  subject?: string;
  body?: string;
  engine?: "search" | "news" | "finance" | "markets";
  query?: string;
  limit?: number;
  timeWindow?: string;
  trend?: string;
  region?: string;
  topic?: string;
  section?: string;
}

export interface SearchAgentBlock extends Block {
  type: "searchagent";
  query?: string;
  searchEngine?: "search" | "news" | "finance" | "markets";
  marketsTrend?:
    | "indexes"
    | "most-active"
    | "gainers"
    | "losers"
    | "climate-leaders"
    | "cryptocurrencies"
    | "currencies";
  newsSearchType?: "query" | "topic" | "publication";
  newsTopic?: string;
  newsPublication?: string;
  newsSection?: string;
  financeWindow?: "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";
  marketsIndexMarket?:
    | "americas"
    | "europe-middle-east-africa"
    | "asia-pacific";
}

export interface Agent {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  blocks: Block[];
}

export interface AgentStore {
  agents: Agent[];
  currentAgent: Agent | null;
  loadAgents: () => Promise<void>;
  createAgent: (name: string) => Promise<void>;
  saveAgent: (blocks: Block[]) => Promise<void>;
  loadAgent: (agentId: string) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  updateAgentName: (agentId: string, newName: string) => Promise<void>;
}
