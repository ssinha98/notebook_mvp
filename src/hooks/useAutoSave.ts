import { useState, useEffect, useCallback, useRef } from "react";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import { isEqual } from "lodash";
import { toast } from "sonner";

interface AutoSaveOptions {
  isEditMode?: boolean;
  onCreateNewAgent?: (name: string) => Promise<void>;
}

export const useAutoSave = (options: AutoSaveOptions = {}) => {
  const { currentAgent, saveAgent } = useAgentStore();
  const { blocks } = useSourceStore();

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const autoSaveInterval = useRef<NodeJS.Timeout | null>(null);

  // Track changes by comparing current blocks with saved agent blocks
  useEffect(() => {
    if (currentAgent) {
      const hasUnsavedChanges = !isEqual(blocks, currentAgent.blocks);
      setHasChanges(hasUnsavedChanges);
    }
  }, [blocks, currentAgent]);

  // Auto-save function (60-second timer)
  const performAutoSave = useCallback(async () => {
    if (!currentAgent || !hasChanges || isSaving) return;

    try {
      setIsSaving(true);
      const blocksToSave = useSourceStore.getState().blocks;
      await saveAgent(blocksToSave);
      toast.success("Auto-saved", { duration: 2000 });
    } catch (error) {
      console.error("Auto-save failed:", error);
      toast.error("Auto-save failed");
    } finally {
      setIsSaving(false);
    }
  }, [currentAgent, hasChanges, isSaving, saveAgent]);

  // Manual save function (for Save button and Cmd+S)
  const performManualSave = useCallback(async () => {
    if (currentAgent) {
      // Save existing agent
      if (isSaving) return;

      try {
        setIsSaving(true);
        const blocksToSave = useSourceStore.getState().blocks;
        await saveAgent(blocksToSave);
        toast.success("Agent saved successfully");
      } catch (error) {
        console.error("Save failed:", error);
        toast.error("Failed to save agent");
      } finally {
        setIsSaving(false);
      }
    } else {
      // No current agent - create new agent
      if (options.onCreateNewAgent) {
        const name = prompt("Enter a name for your new agent:");
        if (name?.trim()) {
          await options.onCreateNewAgent(name.trim());
        }
      }
    }
  }, [currentAgent, isSaving, saveAgent, options]);

  // Set up 60-second auto-save timer
  useEffect(() => {
    if (currentAgent && options.isEditMode && hasChanges) {
      autoSaveInterval.current = setInterval(performAutoSave, 60000); // 60 seconds
    }

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [currentAgent, options.isEditMode, hasChanges, performAutoSave]);

  // Set up Cmd+S keyboard shortcut
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "s") {
        event.preventDefault();
        performManualSave();
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [performManualSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, []);

  return {
    isSaving,
    hasChanges,
    performManualSave,
    performAutoSave,
  };
};
