// store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PromptStore,
  PromptType,
  Source,
  Block,
} from "../types/types";

// Define the SourceStore interface here since it's specific to this file
interface SourceStore {
  sources: Record<string, Source>;
  blocks: Block[];
  nextBlockNumber: number;
  addSource: (name: string, source: Source) => void;
  removeSource: (name: string) => void;
  addBlockToNotebook: (block: Block) => void;
  updateBlock: (blockNumber: number, updates: Partial<Block>) => void;
  removeBlock: (blockNumber: number) => void;
  deleteBlock: (blockNumber: number) => void;
}

const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      // State
      prompts: [],

      // Add new prompt
      addPrompt: (id: number, type: PromptType, value: string) => {
        set((state) => ({
          prompts: [
            ...state.prompts.filter((p) => !(p.id === id && p.type === type)),
            { id, type, value },
          ],
        }));
      },

      // Get specific prompt
      getPrompt: (id: number, type: PromptType) => {
        const prompt = get().prompts.find(
          (p) => p.id === id && p.type === type
        );
        return prompt?.value;
      },

      // Get all prompts
      getAllPrompts: () => {
        return get().prompts;
      },

      // Update existing prompt
      updatePrompt: (id: number, type: PromptType, value: string) => {
        set((state) => ({
          prompts: state.prompts.map((prompt) =>
            prompt.id === id && prompt.type === type
              ? { ...prompt, value }
              : prompt
          ),
        }));
      },

      // Delete prompt
      deletePrompt: (id: number, type: PromptType) => {
        set((state) => ({
          prompts: state.prompts.filter(
            (prompt) => !(prompt.id === id && prompt.type === type)
          ),
        }));
      },

      // Clear all prompts
      clearPrompts: () => {
        set({ prompts: [] });
      },
    }),
    {
      name: "prompt-storage",
      version: 1,
    }
  )
);

// Original source store implementation (commented out)
/*
export const useSourceStore = create<SourceStore>((set) => ({
  sources: {},
  addSource: (source) =>
    set((state) => ({
      sources: { ...state.sources, [source.name]: source },
    })),
  removeSource: (name) =>
    set((state) => {
      const { [name]: _, ...rest } = state.sources;
      return { sources: rest };
    }),
}));
*/

// New implementation with persist middleware and initial state
export const useSourceStore = create<SourceStore>()(
  persist(
    (set) => ({
      sources: {}, // Initialize with empty object
      blocks: [],
      nextBlockNumber: 1,
      addSource: (name: string, source: Source) =>
        set((state) => ({
          sources: { ...state.sources, [name]: source },
        })),
      removeSource: (name: string) =>
        set((state) => {
          const { [name]: _, ...rest } = state.sources;
          return { sources: rest };
        }),
      addBlockToNotebook: (block: Block) =>
        set((state) => ({
          blocks: [...state.blocks, block],
          nextBlockNumber: state.nextBlockNumber + 1,
        })),
      updateBlock: (blockNumber: number, updates: Partial<Block>) =>
        set((state) => ({
          blocks: state.blocks.map((block) =>
            block.blockNumber === blockNumber ? { ...block, ...updates } : block
          ),
        })),
      removeBlock: (blockNumber: number) =>
        set((state) => ({
          blocks: state.blocks.filter((block) => block.blockNumber !== blockNumber),
        })),
      deleteBlock: (blockNumber: number) => 
        set((state) => ({
          blocks: state.blocks.filter(block => block.blockNumber !== blockNumber)
        })),
    }),
    {
      name: "source-storage",
      version: 1,
    }
  )
);

export default usePromptStore;
