import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { SaveOutlined, EditOutlined } from "@ant-design/icons";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import { isEqual } from "lodash";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Block } from "@/types/types";
import { toast } from "sonner";
import { useAutoSave } from "@/hooks/useAutoSave";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentTemplateStore } from "@/lib/agentTemplateStore";

interface AgentHeaderProps {
  isEditMode: boolean;
  onEditModeChange: (value: boolean) => void;
}

interface Agent {
  id: string;
  name: string;
  blocks: any[]; // You can replace 'any' with your block type
  createdAt: string;
}

export default function AgentHeader({
  isEditMode,
  onEditModeChange,
}: AgentHeaderProps) {
  const [isSaving, setIsSaving] = useState(false);
  // REMOVED: const [hasChanges, setHasChanges] = useState(false);
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isMasterUser, setIsMasterUser] = useState(false);
  const [saveTarget, setSaveTarget] = useState<"current" | "other">("current");
  const [targetUserId, setTargetUserId] = useState("");
  // Add new state for template checkbox
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);

  const {
    currentAgent,
    saveAgent,
    updateAgentName,
    checkMasterRole,
    createAgentForUser,
  } = useAgentStore();
  const { blocks } = useSourceStore();
  const { createAgentTemplate } = useAgentTemplateStore();

  // Use auto-save hook - this provides hasChanges
  const {
    isSaving: autoSaveIsSaving,
    hasChanges, // This replaces the local hasChanges state
    performManualSave,
  } = useAutoSave({
    isEditMode,
  });

  // Update isSaving to use auto-save state
  const actualIsSaving = isSaving || autoSaveIsSaving;

  // Check master role on component mount
  useEffect(() => {
    const checkMaster = async () => {
      const isMaster = await checkMasterRole();
      setIsMasterUser(isMaster);
    };
    checkMaster();
  }, [checkMasterRole]);

  // Add this useEffect to log when an agent is loaded
  useEffect(() => {
    if (currentAgent) {
      // console.log("Agent loaded:", {
      //   name: currentAgent.name,
      //   id: currentAgent.id,
      //   blocks: currentAgent.blocks.length,
      //   rawData: currentAgent, // Log the entire object
      // });
    } else {
      // console.log("No current agent");
    }
  }, [currentAgent]);

  // REMOVED: The useEffect that was managing hasChanges locally
  // The hook now handles this logic

  // Reset newName when currentAgent changes
  useEffect(() => {
    if (currentAgent) {
      setNewName(currentAgent.name);
    }
  }, [currentAgent]);

  const handleNameUpdate = async () => {
    if (currentAgent && newName.trim() !== "") {
      try {
        await updateAgentName(currentAgent.id, newName.trim());
        setIsNameDialogOpen(false);
      } catch (error) {
        console.error("Error updating agent name:", error);
        alert("Failed to update agent name");
      }
    }
  };

  const handleSaveAgent = async () => {
    if (!currentAgent) return;

    // If user is master, show the save options dialog
    if (isMasterUser) {
      setIsSaveDialogOpen(true);
      return;
    }

    // Use auto-save hook for regular saves
    await performManualSave();
  };

  const performSave = async (target: "current" | "other") => {
    try {
      setIsSaving(true);
      const blocksToSave = useSourceStore.getState().blocks;

      // Get all variables associated with current agent
      const currentVariables = Object.values(
        useVariableStore.getState().variables
      ).filter((v) => v.agentId === currentAgent?.id);

      if (target === "other" && targetUserId.trim()) {
        if (saveAsTemplate) {
          // Clean blocks the same way as saveAgent does
          const cleanBlocks = blocksToSave.map((block) => {
            if (block.type === "searchagent") {
              return {
                id: block.id || crypto.randomUUID(),
                type: "searchagent" as const, // Fix the type
                blockNumber: block.blockNumber,
                name: block.name || `Search ${block.blockNumber}`,
                query: block.query || "",
                engine: block.engine || "search",
                limit: block.limit || 5,
                topic: block.topic || "",
                section: block.section || "",
                timeWindow: block.timeWindow || "",
                trend: block.trend || "indexes",
                region: block.region || "",
                outputVariable: block.outputVariable || null,
                newsSearchType: block.newsSearchType || "query",
                newsTopic: block.newsTopic || "",
                newsSection: block.newsSection || "",
                financeWindow: block.financeWindow || "1D",
                marketsIndexMarket: block.marketsIndexMarket || "", // Fix: use undefined instead of ""
                agentId: currentAgent?.id || "",
                systemPrompt: (block as any).systemPrompt || "",
                userPrompt: (block as any).userPrompt || "",
                saveAsCsv: (block as any).saveAsCsv || false,
              } as const; // Add as const to preserve literal types
            } else if (block.type === "codeblock") {
              return {
                ...block,
                id: block.id || crypto.randomUUID(),
                name: block.name || `Code ${block.blockNumber}`,
                language: block.language || "python",
                code: block.code || "",
                status: block.status || "tbd",
                outputVariable: block.outputVariable || null,
              };
            }
            return block;
          });

          // Clean variables to remove undefined values
          const cleanVariables = currentVariables.map((variable) => ({
            ...variable,
            value: variable.value || (variable.type === "table" ? [] : ""),
          }));

          // Save as template
          const templateData = {
            name: currentAgent!.name,
            blocks: cleanBlocks,
            variables: cleanVariables,
            createdAt: new Date().toISOString(),
            createdBy: currentAgent!.userId,
          };

          // Replace undefined values with empty strings
          const cleanTemplateData = {
            name: templateData.name,
            blocks: templateData.blocks,
            variables: templateData.variables,
            createdAt: templateData.createdAt,
            createdBy: templateData.createdBy,
          };

          await createAgentTemplate(targetUserId, cleanTemplateData as any);
          toast.success(
            `Template saved with ${cleanBlocks.length} blocks and ${cleanVariables.length} variables`
          );
        } else {
          // Regular save to another user (existing functionality)
          const newAgent = await createAgentForUser(
            currentAgent!.name,
            targetUserId,
            blocksToSave
          );
          toast.success(
            `Agent saved with ${blocksToSave.length} blocks and ${currentVariables.length} variables for user: ${targetUserId}`
          );
        }
      } else {
        // Save to current user (existing functionality)
        await saveAgent(blocksToSave);
        toast.success("Agent saved successfully");
      }

      // Reset dialog state
      setIsSaveDialogOpen(false);
      setSaveTarget("current");
      setTargetUserId("");
      setSaveAsTemplate(false);
    } catch (error) {
      console.error("Error saving agent:", error);
      toast.error("Failed to save agent");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-900">
      <div className="flex items-center gap-4">
        {currentAgent && (
          <AlertDialog
            open={isNameDialogOpen}
            onOpenChange={setIsNameDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <div className="flex items-center gap-2 px-3 py-1.5 border border-gray-600 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
                <h1 className="text-xl font-semibold text-white">
                  {currentAgent?.name || "Untitled Agent"}
                </h1>
                <EditOutlined className="text-gray-400 hover:text-gray-300" />
              </div>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Agent Name</AlertDialogTitle>
                <AlertDialogDescription>
                  Enter a new name for your agent.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="my-4">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter new name"
                  className="w-full"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleNameUpdate}>
                  Update Name
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Auto-save indicator */}
        {hasChanges && isEditMode && (
          <span className="text-sm text-yellow-400 flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        {isEditMode && (
          <>
            <Button
              onClick={handleSaveAgent}
              disabled={actualIsSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {actualIsSaving ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Saving...
                </>
              ) : (
                <>
                  <SaveOutlined className="mr-2" />
                  Save Changes
                </>
              )}
            </Button>

            {/* Master Role Save Dialog */}
            <AlertDialog
              open={isSaveDialogOpen}
              onOpenChange={setIsSaveDialogOpen}
            >
              <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Save Agent</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose where to save this agent configuration.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="current"
                        name="saveTarget"
                        value="current"
                        checked={saveTarget === "current"}
                        onChange={(e) =>
                          setSaveTarget(e.target.value as "current" | "other")
                        }
                        className="w-4 h-4"
                      />
                      <label htmlFor="current" className="text-sm font-medium">
                        Save to my account
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="other"
                        name="saveTarget"
                        value="other"
                        checked={saveTarget === "other"}
                        onChange={(e) =>
                          setSaveTarget(e.target.value as "current" | "other")
                        }
                        className="w-4 h-4"
                      />
                      <label htmlFor="other" className="text-sm font-medium">
                        Save to another user's account
                      </label>
                    </div>
                  </div>

                  {saveTarget === "other" && (
                    <div className="space-y-4">
                      <div>
                        <label
                          htmlFor="targetUserId"
                          className="text-sm font-medium block mb-1"
                        >
                          Target User ID
                        </label>
                        <Input
                          id="targetUserId"
                          value={targetUserId}
                          onChange={(e) => setTargetUserId(e.target.value)}
                          placeholder="Enter user ID"
                          className="w-full"
                        />
                      </div>

                      {/* Add new template checkbox */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="saveAsTemplate"
                          checked={saveAsTemplate}
                          onChange={(e) => setSaveAsTemplate(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <label
                          htmlFor="saveAsTemplate"
                          className="text-sm font-medium"
                        >
                          Save as template
                        </label>
                        <div className="text-xs text-gray-400 ml-2">
                          (Saves agent configuration and variables as a reusable
                          template)
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => performSave(saveTarget)}
                    disabled={saveTarget === "other" && !targetUserId.trim()}
                  >
                    {saveTarget === "current"
                      ? "Save to My Account"
                      : saveAsTemplate
                        ? "Save as Template"
                        : "Save to Other User"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
        {/* <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg"> */}
        {/* <span
            className={`text-sm ${!isEditMode ? "text-white" : "text-gray-400"}`}
          >
            View
          </span> */}
        {/* <Switch
            checked={isEditMode}
            onCheckedChange={onEditModeChange}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600 h-6 w-11 [&>span]:h-5 [&>span]:w-5 [&>span]:bg-white"
          /> */}
        {/* <span
            className={`text-sm ${isEditMode ? "text-white" : "text-gray-400"}`}
          >
            Edit
          </span> */}
        {/* </div> */}
      </div>
    </div>
  );
}
