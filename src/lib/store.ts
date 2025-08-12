// store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  PromptStore,
  PromptType,
  Source,
  Block,
  CodeBlock,
} from "../types/types";
import { fileManager } from "../tools/fileManager";
import { arrayMove } from "@dnd-kit/sortable";
import { useAgentStore } from "./agentStore";

interface FileNickname {
  originalName: string;
  downloadLink: string;
  file_type: string;
}

// Define the SourceStore interface here since it's specific to this file
interface SourceStore {
  sources: Record<string, Source>;
  // Remove data management
  // ❌ blocks: Block[];
  // ❌ nextBlockNumber: number;

  // Keep source management
  addSource: (name: string, source: Source) => void;
  removeSource: (name: string) => void;

  // Remove block data management
  // ❌ addBlockToNotebook: (block: Block) => void;
  // ❌ updateBlock: (blockNumber: number, updates: Partial<Block>) => void;
  // ❌ removeBlock: (blockNumber: number) => void;
  // ❌ deleteBlock: (blockNumber: number) => void;
  // ❌ resetBlocks: () => void;
  // ❌ updateBlockData: (blockNumber: number, updates: Partial<Block>) => void;

  // Keep UI state management
  currentBlockIndex: number | null;
  isPaused: boolean;
  setCurrentBlockIndex: (index: number | null) => void;
  setIsPaused: (paused: boolean) => void;

  // Keep reordering functionality
  reorderBlocks: (startIndex: number, endIndex: number) => void;
  copyBlockAfter: (blockNumber: number) => void;
  updateBlockName: (blockNumber: number, newName: string) => void;

  // Remove data functions
  // ❌ getBlockList: () => Array<{...}>;
  // ❌ setBlocksFromFirebase: (blocks: Block[]) => void;
  // ❌ syncWithAgentStore: () => void;

  // Keep file management
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

// New implementation with persist middleware and initial state
export const useSourceStore = create<SourceStore>()(
  persist(
    (set, get) => ({
      sources: {},
      // Remove data state
      // ❌ blocks: [],
      // ❌ nextBlockNumber: 1,

      // Keep UI state
      currentBlockIndex: null,
      isPaused: false,
      fileNicknames: {},

      // Keep source management
      addSource: (name: string, source: Source) =>
        set((state) => ({
          sources: { ...state.sources, [name]: source },
        })),
      removeSource: (name: string) =>
        set((state) => {
          const { [name]: _, ...rest } = state.sources;
          return { sources: rest };
        }),

      // Remove block data management functions
      // ❌ resetBlocks: () => set(() => ({ blocks: [], nextBlockNumber: 1 })),
      // ❌ addBlockToNotebook: (block: Block) => { ... },
      // ❌ updateBlock: (blockNumber: number, updates: Partial<Block>) => { ... },
      // ❌ removeBlock: (blockNumber: number) => { ... },
      // ❌ deleteBlock: (blockNumber: number) => { ... },
      // ❌ updateBlockData: (blockNumber: number, updates: Partial<Block>) => { ... },

      // Keep UI state management
      setCurrentBlockIndex: (index: number | null) =>
        set({ currentBlockIndex: index }),
      setIsPaused: (paused: boolean) => set({ isPaused: paused }),

      // Keep reordering functionality (but update to work with AgentStore)
      reorderBlocks: (startIndex: number, endIndex: number) => {
        const currentAgent = useAgentStore.getState().currentAgent;
        if (!currentAgent?.blocks) return;

        const blocks = arrayMove(
          [...currentAgent.blocks],
          startIndex,
          endIndex
        );
        // Update blockNumbers to reflect new order
        blocks.forEach((block, index) => {
          block.blockNumber = index + 1;
        });

        // Update AgentStore with reordered blocks
        useAgentStore.getState().updateCurrentAgent({
          ...currentAgent,
          blocks: blocks,
        });
      },

      updateBlockName: (blockNumber: number, newName: string) => {
        const currentAgent = useAgentStore.getState().currentAgent;
        if (!currentAgent?.blocks) return;

        const updatedBlocks = currentAgent.blocks.map((block) =>
          block.blockNumber === blockNumber
            ? { ...block, name: newName }
            : block
        );

        useAgentStore.getState().updateCurrentAgent({
          ...currentAgent,
          blocks: updatedBlocks,
        });
      },

      copyBlockAfter: (blockNumber: number) => {
        const currentAgent = useAgentStore.getState().currentAgent;
        if (!currentAgent?.blocks) return;

        const sourceBlock = currentAgent.blocks.find(
          (b) => b.blockNumber === blockNumber
        );
        if (!sourceBlock) return;

        const copiedBlock: Block = {
          ...sourceBlock,
          id: crypto.randomUUID(),
          name: `${sourceBlock.name} (Copy)`,
        };

        const blocks = [...currentAgent.blocks];
        const sourceIndex = blocks.findIndex(
          (b) => b.blockNumber === blockNumber
        );
        const newBlockNumber =
          Math.max(...blocks.map((b) => b.blockNumber)) + 1;

        const finalBlock = {
          ...copiedBlock,
          blockNumber: newBlockNumber,
        };

        blocks.splice(sourceIndex + 1, 0, finalBlock);

        useAgentStore.getState().updateCurrentAgent({
          ...currentAgent,
          blocks: blocks,
        });
      },

      // Keep file management
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

// Remove the getBlockList export since we removed the function
// ❌ export const getBlockList = () => useSourceStore.getState().getBlockList();

export default usePromptStore;
