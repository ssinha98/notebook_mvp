// store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { PromptStore, PromptType, SourceStore } from "../types/types";

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

export default usePromptStore;
