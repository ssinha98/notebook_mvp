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
  const [hasChanges, setHasChanges] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const { currentAgent, createAgent, saveAgent, updateAgentName } =
    useAgentStore();
  const { blocks } = useSourceStore();

  // Add this useEffect to log when an agent is loaded
  useEffect(() => {
    if (currentAgent) {
      console.log("Agent loaded:", {
        name: currentAgent.name,
        id: currentAgent.id,
        blocks: currentAgent.blocks.length,
        rawData: currentAgent, // Log the entire object
      });
    } else {
      console.log("No current agent");
    }
  }, [currentAgent]);

  // Check for changes whenever blocks change
  useEffect(() => {
    if (currentAgent) {
      // Compare current blocks with saved agent blocks
      const hasUnsavedChanges = !isEqual(blocks, currentAgent.blocks);
      setHasChanges(hasUnsavedChanges);

      // Update name when agent changes
      setNewName(currentAgent.name);
    }
  }, [blocks, currentAgent]);

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
        setIsOpen(false);
      } catch (error) {
        console.error("Error updating agent name:", error);
        alert("Failed to update agent name");
      }
    }
  };

  const handleSaveAgent = async () => {
    if (!currentAgent) return;

    try {
      setIsSaving(true);
      // Get blocks directly from the source store
      const blocksToSave = useSourceStore.getState().blocks;

      await saveAgent(blocksToSave);
      toast.success("Agent saved successfully");
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
          <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
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
      </div>
      <div className="flex items-center gap-4">
        {isEditMode && (
          <Button
            onClick={handleSaveAgent}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
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
        )}
        <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
          <span
            className={`text-sm ${!isEditMode ? "text-white" : "text-gray-400"}`}
          >
            View
          </span>
          <Switch
            checked={isEditMode}
            onCheckedChange={onEditModeChange}
            className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600 h-6 w-11 [&>span]:h-5 [&>span]:w-5 [&>span]:bg-white"
          />
          <span
            className={`text-sm ${isEditMode ? "text-white" : "text-gray-400"}`}
          >
            Edit
          </span>
        </div>
      </div>
    </div>
  );
}
