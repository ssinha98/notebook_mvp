export interface BaseShareableBlock {
  id: string;
  blockNumber: number;
  type:
    | "agent"
    | "webagent"
    | "contact"
    | "checkin"
    | "searchagent"
    | "instagramagent"
    | "codeblock"
    | "make"
    | "excelagent"
    | "docdiff"
    | "docannotator"
    | "simulatedapi"
    | "simulatedemail"
    | "powerpoint"
    | "dataviz"
    | "webscraper"
    | "conversingagent";
  output?: string;
  outputVariable?: {
    name: string;
    value?: string;
  };
  checkin?: boolean;
}

export interface ShareableAgentBlock extends BaseShareableBlock {
  type: "agent";
  systemPrompt?: string;
  userPrompt: string;
  attachedFile?: {
    name: string;
    type: string;
    url: string;
    content: string;
  };
}

export interface ShareableWebBlock extends BaseShareableBlock {
  type: "webagent";
  url: string;
  nickname: string;
}

export interface ShareableContactBlock extends BaseShareableBlock {
  type: "contact";
  to: string;
  subject: string;
  body: string;
}

export interface ShareableCheckinBlock extends BaseShareableBlock {
  type: "checkin";
}

export interface ShareableSearchBlock extends BaseShareableBlock {
  type: "searchagent";
  engine: "search" | "news" | "finance" | "markets" | "image";
  query: string;
  limit: number;
  topic?: string;
  section?: string;
  timeWindow?: string;
  trend?: string;
  prompt?: string;
  region?: string;
  imageResults?: {
    url: string;
    title: string;
    analysisResult?: string;
  }[];
}

export interface ShareableInstagramBlock extends BaseShareableBlock {
  type: "instagramagent";
  url: string;
  postCount: number;
  mockPosts?: {
    imageUrl: string;
    caption: string;
    likes: number;
    comments: number;
    timestamp: string;
  }[];
}

export interface ShareableCodeBlock extends BaseShareableBlock {
  type: "codeblock";
  language: string;
  code: string;
}

export interface ShareableMakeBlock extends BaseShareableBlock {
  type: "make";
  webhookUrl: string;
  parameters: { key: string; value: string }[];
}

export interface ShareableExcelBlock extends BaseShareableBlock {
  type: "excelagent";
  userPrompt: string;
}

export interface ShareableDocDiffBlock extends BaseShareableBlock {
  type: "docdiff";
  input_prompt: string;
  // found_documents: string[];
  document_diffs: Array<{
    document_name: string;
    original: string;
    modified: string;
  }>;
}

export interface ShareableDocAnnotatorBlock extends BaseShareableBlock {
  type: "docannotator";
  sourceName: string;
  sourceLink: string;
  prompt: string;
  annotatedDocLink: string;
  extractedChunks: string[];
  isCompleted: boolean;
  thinkingEmoji?: string;
}

export interface SimulatedApiBlockType extends BaseShareableBlock {
  type: "simulatedapi";
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface SimulatedEmailBlockType extends BaseShareableBlock {
  type: "simulatedemail";
  from: string;
  subject: string;
  body: string;
  attachments?: {
    name: string;
    type: string;
    content: string;
  }[];
}

export interface ShareablePowerpointBlock extends BaseShareableBlock {
  type: "powerpoint";
  prompt: string;
  slides: number;
}

export interface ShareableDataVizBlock extends BaseShareableBlock {
  type: "dataviz";
  chosenChart: string;
  source: string;
  context?: string;
  pointers?: string;
  isProcessing?: boolean;
  isCompleted?: boolean;
  thinkingEmoji?: string;
}

export interface WebScraperBlockObject {
  url: string;
  dom: string;
  suggestedNextAgentAction: string;
}

export interface ShareableWebScraperBlock extends BaseShareableBlock {
  type: "webscraper";
  startingUrl: string;
  prompt: string;
  usableInputs: { key: string; value: string }[];
  webBlocks: WebScraperBlockObject[];
}

export interface ShareableWebScraperBlockProps {
  blockNumber: number;
  startingUrl: string;
  prompt: string;
  usableInputs: { key: string; value: string }[];
  webBlocks: WebScraperBlockObject[];
  outputVariable?: {
    name: string;
    value?: string;
  };
  isRunning?: boolean;
}

export type ShareableBlock =
  | ShareableAgentBlock
  | ShareableContactBlock
  | ShareableWebBlock
  | ShareableCheckinBlock
  | ShareableCodeBlock
  | ShareableMakeBlock
  | ShareableExcelBlock
  | ShareableInstagramBlock
  | ShareableSearchBlock
  | ShareablePowerpointBlock
  | ShareableDocDiffBlock
  | ShareableDocAnnotatorBlock
  | SimulatedApiBlockType
  | SimulatedEmailBlockType
  | ShareableDataVizBlock
  | ShareableWebScraperBlock
  | ShareableConversingAgentBlock;

export interface ShareableAgent {
  id: string;
  name: string;
  description: string;
  agentDescription: string;
  tags: string[];
  blocks: ShareableBlock[];
  start_method?: string;
  tools?: string[];
}

export interface ShareableWebBlockProps {
  blockNumber: number;
  url: string;
  nickname: string;
  outputVariable?: {
    name: string;
  };
}

export interface SimulatedApiBlockProps {
  blockNumber: number;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
}

export interface SimulatedEmailBlockProps {
  blockNumber: number;
  from: string;
  subject: string;
  body: string;
  attachments?: {
    name: string;
    type: string;
    content: string;
  }[];
}

interface ShareableAgentBlockProps {
  blockNumber: number;
  userPrompt: string;
  attachedFile?: {
    name: string;
    type: string;
    url: string;
  };
  outputVariable?: {
    name: string;
    value?: string;
  };
  isCompleted?: boolean;
  output?: string;
  isProcessing?: boolean;
  thinkingEmoji?: string;
  checkin?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
}

export interface ShareableConversingAgentBlock extends BaseShareableBlock {
  type: "conversingagent";
  systemPrompt?: string;
  channel: "email" | "slack" | "teams";
  sources: string[];
  objective: string;
  messages: {
    type: "incoming" | "outgoing";
    content: string;
  }[];
}
