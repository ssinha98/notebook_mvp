export interface Variable {
  id: string;
  name: string;
  type: "input" | "intermediate";
  value?: any;
  description?: string;
  agentId?: string;
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

// Base Block interface that all blocks will extend
export interface BaseBlock {
  id: string;
  name: string;
  blockNumber: number;
  type: BlockType;
  agentId: string; // Make agentId required for all blocks
  systemPrompt: string;
  userPrompt: string;
  saveAsCsv: boolean;
  outputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate";
  } | null;
}

// Union type of all possible block types
export type BlockType =
  | "transform"
  | "agent"
  | "checkin"
  | "searchagent"
  | "contact";

/* OLD Block interface
export interface Block {
  id: string;
  name: string;
  type: "input" | "intermediate" | "transform" | "agent" | "checkin" | "searchagent";
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
  sourceInfo?: {
    nickname: string;
    downloadUrl: string;
  };
  outputVariableId?: string;
}
*/

// Specific block type interfaces
export interface AgentBlock extends BaseBlock {
  type: "agent";
  outputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate";
  } | null;
  sourceInfo?: SourceInfo;
}

/* OLD SearchAgentBlock interface
export interface SearchAgentBlock extends Block {
  type: "searchagent";
  query?: string;
  searchEngine?: "search" | "news" | "finance" | "markets";
  marketsTrend?: "indexes" | "most-active" | "gainers" | "losers" | "climate-leaders" | "cryptocurrencies" | "currencies";
  newsSearchType?: "query" | "topic" | "publication";
  newsTopic?: string;
  newsPublication?: string;
  newsSection?: string;
  financeWindow?: "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";
  marketsIndexMarket?: "americas" | "europe-middle-east-africa" | "asia-pacific";
}
*/

export interface SearchAgentBlock extends BaseBlock {
  type: "searchagent";
  query?: string;
  engine?: "search" | "news" | "finance" | "markets";
  limit?: number;
  topic?: string;
  section?: string;
  timeWindow?: string;
  trend?: string;
  region?: string;
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
  // Preserved old optional fields
  error?: string;
}

export interface TransformBlock extends BaseBlock {
  type: "transform";
  transformations: TransformationData;
  sourceName: string;
  // Preserved old optional fields
  error?: string;
  originalFilePath?: string;
  fileType?: "image" | "csv" | "pdf" | "website";
}

// Common types used across blocks
export interface SourceInfo {
  nickname: string;
  downloadUrl: string;
}

export interface CheckInBlock extends BaseBlock {
  type: "checkin";
  agentId: string;
}

// Update ContactBlock interface
export interface ContactBlock extends BaseBlock {
  type: "contact";
  channel: string;
  recipient: string;
  subject: string;
  body: string;
}

// Update CheckInBlock to include required agentId
export interface CheckInBlock extends BaseBlock {
  type: "checkin";
  agentId: string;
}

// Update Block union type to include ContactBlock
export type Block =
  | AgentBlock
  | SearchAgentBlock
  | TransformBlock
  | CheckInBlock
  | ContactBlock;

export interface Agent {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  outputVariableId?: string;
  blocks: Block[];
  sourceInfo?: {
    nickname: string;
    downloadUrl: string;
  };
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

export interface FileDocument {
  name: string;
  download_link: string;
  userId: string;
  nickname: string;
  type: string;
  createdAt: string;
  url: string;
}

export interface FileManagerResponse {
  success: boolean;
  data?: FileDocument;
  error?: unknown;
}
