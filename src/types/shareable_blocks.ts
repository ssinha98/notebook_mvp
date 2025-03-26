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

export type ShareableBlock =
  | ShareableAgentBlock
  | ShareableWebBlock
  | ShareableContactBlock
  | ShareableCheckinBlock;

export interface ShareableAgent {
  id: string;
  name: string;
  description: string;
  agentDescription: string;
  tags: string[];
  blocks: ShareableBlock[];
}

export interface ShareableWebBlockProps {
  blockNumber: number;
  url: string;
  nickname: string;
  outputVariable?: {
    name: string;
  };
}
