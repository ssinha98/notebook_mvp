import { create } from "zustand";

interface ToolsSheetStore {
  isToolsSheetOpen: boolean;
  setIsToolsSheetOpen: (isOpen: boolean) => void;
}

export const useToolsSheet = create<ToolsSheetStore>((set) => ({
  isToolsSheetOpen: false,
  setIsToolsSheetOpen: (isOpen) => set({ isToolsSheetOpen: isOpen }),
}));
