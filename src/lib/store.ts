// store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PromptStore, PromptType, Source, Block } from "../types/types";
import { fileManager } from "../tools/fileManager";

interface FileNickname {
  originalName: string;
  downloadLink: string;
  file_type: string;
}

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
  resetBlocks: () => void;
  updateBlockData: (blockNumber: number, updates: Partial<Block>) => void;
  currentBlockIndex: number | null;
  isPaused: boolean;
  setCurrentBlockIndex: (index: number | null) => void;
  setIsPaused: (paused: boolean) => void;
  getBlockList: () => Array<{
    index: number;
    blockNumber: number;
    type: Block["type"];
    systemPrompt?: string;
    userPrompt?: string;
    saveAsCsv?: boolean;
    sourceName?: string;
  }>;
  fileNicknames: { [key: string]: FileNickname };
  addFileNickname: (
    nickname: string,
    originalName: string,
    downloadLink: string
  ) => void;
  removeFileNickname: (nickname: string) => void;
  syncWithFirestore: (userId: string) => Promise<void>;
  clearVariables: () => void;
  clearSources: () => void;
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
    (set, get) => ({
      sources: {},
      blocks: [],
      nextBlockNumber: 1,
      currentBlockIndex: null,
      isPaused: false,
      fileNicknames: {},
      addSource: (name: string, source: Source) =>
        set((state) => ({
          sources: { ...state.sources, [name]: source },
        })),
      removeSource: (name: string) =>
        set((state) => {
          const { [name]: _, ...rest } = state.sources;
          return { sources: rest };
        }),
      resetBlocks: () =>
        set(() => ({
          blocks: [],
          nextBlockNumber: 1,
        })),
      addBlockToNotebook: (block: Block) => {
        set((state) => {
          const blocks = [...state.blocks];
          
          // If it's a web agent, ensure it has all required fields
          if (block.type === "webagent") {
            block = {
              ...block,
              url: block.url || "",
              searchVariable: block.searchVariable || "",
              selectedVariableId: block.selectedVariableId || "",
              outputVariable: block.outputVariable || null,
              results: block.results || [],
            };
          }

          blocks.push(block);
          return { blocks, nextBlockNumber: state.nextBlockNumber + 1 };
        });
      },
      updateBlock: (blockNumber: number, updates: Partial<Block>) =>
        set((state) => ({
          blocks: state.blocks.map((block): Block => {
            if (block.blockNumber === blockNumber) {
              return { ...block, ...updates } as Block;
            }
            return block;
          }),
        })),
      removeBlock: (blockNumber: number) =>
        set((state) => ({
          blocks: state.blocks.filter(
            (block) => block.blockNumber !== blockNumber
          ),
        })),
      deleteBlock: (blockNumber: number) =>
        set((state) => ({
          blocks: state.blocks.filter(
            (block) => block.blockNumber !== blockNumber
          ),
        })),
      updateBlockData: (blockNumber: number, updates: Partial<Block>) =>
        set((state) => ({
          blocks: state.blocks.map((block): Block => {
            if (block.blockNumber === blockNumber) {
              return { ...block, ...updates } as Block;
            }
            return block;
          }),
        })),
      setCurrentBlockIndex: (index: number | null) =>
        set({ currentBlockIndex: index }),
      setIsPaused: (paused: boolean) => set({ isPaused: paused }),
      getBlockList: () => {
        const blocks = get().blocks;
        const sortedBlocks = [...blocks].sort(
          (a, b) => a.blockNumber - b.blockNumber
        );

        return sortedBlocks.map((block, index) => ({
          index,
          blockNumber: block.blockNumber,
          type: block.type,
          ...(block.type === "agent" && {
            systemPrompt: block.systemPrompt,
            userPrompt: block.userPrompt,
            saveAsCsv: block.saveAsCsv,
            sourceName: block.sourceInfo?.nickname,
          }),
        }));
      },
      addFileNickname: (
        nickname: string,
        originalName: string,
        downloadLink: string
      ) =>
        set((state) => ({
          fileNicknames: {
            ...state.fileNicknames,
            [nickname]: { originalName, downloadLink, file_type: "" },
          },
        })),
      removeFileNickname: (nickname: string) =>
        set((state) => {
          const { [nickname]: _, ...rest } = state.fileNicknames;
          return { fileNicknames: rest };
        }),
      syncWithFirestore: async (userId: string) => {
        const files = await fileManager.getUserFiles(userId);
        const nicknames = files.reduce(
          (acc, file) => ({
            ...acc,
            [file.nickname]: {
              originalName: file.full_name,
              downloadLink: file.download_link,
              file_type: file.file_type,
            },
          }),
          {}
        );
        set({ fileNicknames: nicknames });
      },
      clearVariables: () => {
        set((state) => ({
          ...state,
          variables: {},
        }));
      },
      clearSources: () => {
        set((state) => ({
          ...state,
          sources: {},
        }));
      },
    }),
    {
      name: "source-storage",
      version: 1,
    }
  )
);

export const getBlockList = () => useSourceStore.getState().getBlockList();

export default usePromptStore;
