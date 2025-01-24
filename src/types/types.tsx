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
  name: string;
  type: "image" | "csv" | "pdf" | "website";
  filepath: string;
  processedData: any;
  content: string;
}

export interface SourceStore {
  sources: { [key: string]: Source };
  addSource: (source: Source) => void;
  removeSource: (name: string) => void;
}
