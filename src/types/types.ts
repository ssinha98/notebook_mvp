export interface Variable {
  id: string;
  name: string;
  type: "input" | "intermediate" | "table";
  value?: string | TableRow[]; // Updated to support table rows
  description?: string;
  agentId?: string;
  columnName?: string;
  mainOutput?: boolean; // Add this line
  rows?: TableRow[];
  // Table-specific fields
  columns?: string[]; // List of column names for table variables
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
  agentId: string;
  systemPrompt: string;
  userPrompt: string;
  saveAsCsv: boolean;
  modelResponse?: string;
  containsPrimaryInput?: boolean; // New field to mark blocks that need input before running
  skip?: boolean; // Skip block if skip flag is true
  outputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string; // Used when outputting to a table column
  } | null;
}

// Union type of all possible block types
export type BlockType =
  | "transform"
  | "agent"
  | "checkin"
  | "searchagent"
  | "contact"
  | "webagent"
  | "codeblock"
  | "make"
  | "excelagent"
  | "instagramagent"
  | "deepresearchagent"
  | "pipedriveagent"
  | "datavizagent"
  | "clickupagent"
  | "googledriveagent"
  | "apolloagent"
  | "tabletransform"
  | "gong"
  | "jira"
  | "salesforce"
  | "variableinput"; // Add this line

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
  sourceInfo?: SourceInfo;
}

// Add new interface for DeepResearchAgent
export interface DeepResearchAgentBlock extends BaseBlock {
  type: "deepresearchagent";
  topic: string;
  searchEngine?:
    | "perplexity"
    | "firecrawl"
    | "openai"
    | "perplexity sonar-deep-research";
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
  engine?: "search" | "news" | "finance" | "markets" | "image";
  limit?: number;
  topic?: string;
  section?: string;
  timeWindow?: string;
  trend?: string;
  region?: string;
  combineImage?: boolean;
  previewMode?: boolean; // Add this line
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

// Add MakeBlock interface
export interface MakeBlock extends BaseBlock {
  type: "make";
  webhookUrl: string;
  parameters: Array<{
    key: string;
    value: string;
  }>;
}

// Add new interface for PipedriveAgent
export interface PipedriveAgentBlock extends BaseBlock {
  type: "pipedriveagent";
  prompt: string;
}

// Add new interface for DataVizAgent
export interface DataVizAgentBlock extends BaseBlock {
  type: "datavizagent";
  prompt: string;
  chartType: string;
}

// Add the new interface
export interface ClickUpAgentBlock extends BaseBlock {
  type: "clickupagent";
  prompt?: string;
}

export interface PreviewRow {
  rowId: string;
  rowIndex: number;
  searchQuery: string;
  results: any[];
}

// Update Block union type
export type Block =
  | AgentBlock
  | SearchAgentBlock
  | TransformBlock
  | CheckInBlock
  | ContactBlock
  | WebAgentBlock
  | CodeBlock
  | MakeBlock
  | ExcelAgentBlock
  | InstagramAgentBlock
  | DeepResearchAgentBlock
  | PipedriveAgentBlock
  | DataVizAgentBlock
  | ClickUpAgentBlock
  | GoogleDriveAgentBlock
  | ApolloAgentBlock
  | TableTransformBlock
  | GongBlock
  | JiraBlock
  | SalesforceBlock;

export interface Agent {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
  outputVariableId?: string;
  blocks: Block[];
  agent_rating_thumbs_up?: number;
  agent_rating_thumbs_down?: number;
  start_method?: string;
  deploymentType?: "api" | "scheduled" | "manual" | "email";
  start_date?: string;
  start_time?: string;
  sourceInfo?: {
    nickname: string;
    downloadUrl: string;
  };
  folderId?: string;
  folderName?: string;
  viewOnlyUsers?: string[]; // Array of email addresses with view-only access
  view_only?: string[]; // Add this line
  admin?: boolean; // Whether the current user is an admin for this agent
  agent_type?: string; // Add this new field for chat_data agents
}

export interface Folder {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface AgentStore {
  agents: Agent[];
  currentAgent: Agent | null;
  folders: Folder[];
  loadAgents: () => Promise<void>;
  createAgent: (name: string, folderId?: string) => Promise<void>;
  createAgentForUser: (
    name: string,
    targetUserId: string,
    blocks?: Block[]
  ) => Promise<Agent>;
  copyAgent: (agentId: string, newName: string) => Promise<Agent>;
  checkMasterRole: () => Promise<boolean>;
  saveAgent: (blocks: Block[]) => Promise<void>;
  loadAgent: (agentId: string) => Promise<void>;
  deleteAgent: (agentId: string) => Promise<void>;
  updateAgentName: (agentId: string, newName: string) => Promise<void>;
  loadFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  updateFolderName: (folderId: string, newName: string) => Promise<void>;
  moveAgentToFolder: (agentId: string, folderId: string) => Promise<void>;
  currentBlockIndex: number | null;
  isPaused: boolean;
  setCurrentBlockIndex: (index: number | null) => void;
  setIsPaused: (paused: boolean) => void;

  // Add these missing methods:
  updateCurrentAgent: (agent: Agent) => void;
  updateBlockData: (blockNumber: number, updates: Partial<Block>) => void;
  reorderBlocks: (startIndex: number, endIndex: number) => void;
  updateBlockName: (blockNumber: number, newName: string) => void;
  copyBlockAfter: (blockNumber: number) => void;
  deleteBlock: (blockNumber: number) => void;
  addBlockToAgent: (
    blockData: Partial<Block> & { type: Block["type"] }
  ) => void;

  // New view-only user management methods:
  addViewOnlyUser: (agentId: string, email: string) => Promise<void>;
  removeViewOnlyUser: (agentId: string, email: string) => Promise<void>;
  updateViewOnlyUsers: (agentId: string, emails: string[]) => Promise<void>;
  isUserViewOnly: (agentId: string, userEmail: string) => boolean;
  isCurrentUserAdmin: () => Promise<boolean>;
  isCurrentUserTeamAdmin: () => Promise<boolean>; // Add this line
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

export interface WebAgentBlock extends BaseBlock {
  type: "webagent";
  url?: string;
  nickname?: string;
  sanitizedUrl?: string;
  downloadLink?: string;
  activeTab: "url" | "variables";
  searchVariable: string;
  searchVariableId?: string;
  selectedVariableId?: string;
  selectedVariableName?: string;
  results?: Array<{ url: string; content: string }>;
  prompt?: string;
}

// Add CodeBlock interface
export interface CodeBlock extends BaseBlock {
  type: "codeblock";
  language: string;
  code: string;
  status: "approved" | "tbd";
  selectedVariableId?: string;
  variables: Variable[];
}

export interface ExcelAgentBlock extends BaseBlock {
  type: "excelagent";
  fileUrl?: string;
  sheetName?: string;
  range?: string;
  operations?: Array<{
    type: string;
    parameters: Record<string, any>;
  }>;
  prompt?: string;
}

export interface InstagramAgentBlock extends BaseBlock {
  type: "instagramagent";
  url: string;
  postCount: number;
}

export interface AgentTask {
  id: string;
  title: string;
  agentId: string;
  date: string;
  completed: boolean;
}

export interface GoogleDriveAgentBlock extends BaseBlock {
  type: "googledriveagent";
  prompt?: string;
}

export interface ApolloAgentBlock extends BaseBlock {
  type: "apolloagent";
  fullName: string;
  firstName?: string; // Add this
  lastName?: string; // Add this
  company: string;
  prompt?: string;
  outputVariable?: {
    id: string;
    name: string;
    type: "input" | "intermediate" | "table";
    columnName?: string;
  } | null;
}

// Base variable interface
export interface BaseVariable {
  id: string;
  name: string;
  type: "input" | "intermediate";
  value?: any;
  description?: string;
  agentId?: string;
}

// New table variable interface
export interface TableVariable {
  id: string;
  name: string;
  type: "table";
  agentId: string;
  updatedAt: string;
  rows: TableRow[];
  columnName?: string;
}

export interface TableRow {
  id: string;
  [columnName: string]: any;
}

// Firebase-related types
export interface FirebaseTableVariable {
  id: string;
  name: string;
  type: "table";
  agentId: string;
  updatedAt: string;
  rows: TableRow[];
}

export interface FirebaseVariables {
  [variableId: string]: BaseVariable | FirebaseTableVariable;
}

// Table reference types
export interface TableColumnReference {
  tableId: string;
  tableName: string;
  columnName: string;
}

export interface ParsedVariableReference {
  type: "simple" | "table";
  variableName: string;
  columnName?: string;
  fullReference: string;
}

export interface TableTransformBlock extends BaseBlock {
  type: "tabletransform";
  tableId: string;
  operation: "deduplicate" | "filter" | "summarize";
  config?: {
    filterCriteria?: Array<{
      column: string;
      operator: string;
      value: string;
    }>;
    deduplicateColumns?: string[];
    summarizeConfig?: {
      groupByColumns?: string[];
      aggregations?: Array<{
        column: string;
        operation: string;
      }>;
    };
  };
}

// Add new block interfaces after TableTransformBlock
export interface GongBlock extends BaseBlock {
  type: "gong";
  prompt: string;
  endpoint: string;
  callIds?: string; // Add this line
}

export interface JiraBlock extends BaseBlock {
  type: "jira";
  prompt?: string;
  searchQuery?: string;
  endpoint?: string;
}

export interface SalesforceBlock extends BaseBlock {
  type: "salesforce";
  prompt?: string;
  companyName?: string;
  endpoint?: string;
}
