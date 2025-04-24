export interface BaseShareableBlock {
  id: string;
  blockNumber: number;
  type: string;
  output?: string;
  outputVariable?: {
    name: string;
    value?: string;
  };
}

export interface ShareableAgentBlock extends BaseShareableBlock {
  type: "agent";
  systemPrompt?: string;
  userPrompt: string;
  attachedFile?: {
    name: string;
    type: string;
    url?: string;
    content?: string;
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
  query: string;
  engine: string;
  limit: number;
  topic?: string;
  section?: string;
  timeWindow?: string;
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
  type: "code";
  code: string;
}

export interface ShareableMakeBlock extends BaseShareableBlock {
  type: "make";
  // Add any necessary properties for the make block
}

export interface ShareableExcelBlock extends BaseShareableBlock {
  type: "excel";
  // Add any necessary properties for the excel block
}

export interface ShareableDocDiffBlock extends BaseShareableBlock {
  type: "docdiff";
  originalDoc: string;
  modifiedDoc: string;
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
  // Add any necessary properties for the powerpoint block
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
  | SimulatedEmailBlockType;

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
