import { useEffect, useState } from "react";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { Agent } from "@/types/types";
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

interface AgentsListProps {
  onAgentSelect: (agentId: string) => void;
  renderAgentCard?: (agent: Agent) => React.ReactNode;
}

export default function AgentsList({
  onAgentSelect,
  renderAgentCard,
}: AgentsListProps) {
  const { agents, loadAgents, createAgent, deleteAgent, currentAgent } =
    useAgentStore();
  const { resetBlocks } = useSourceStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreateAgent = async () => {
    if (newAgentName.trim()) {
      resetBlocks();
      await createAgent(newAgentName);
      setNewAgentName("");
      setIsCreateDialogOpen(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">My Agents</h2>
        <AlertDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
        >
          <AlertDialogTrigger asChild>
            <Button
              variant="default"
              color="blue"
              className="px-4 py-2 rounded transition-colors"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Agent</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a name for your new agent.
              </AlertDialogDescription>
              <Input
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                placeholder="Agent name"
                className="mt-4"
              />
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNewAgentName("")}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateAgent}>
                Create
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="space-y-2">
        {[...agents]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          .map((agent) =>
            renderAgentCard ? (
              <div key={agent.id} onClick={() => onAgentSelect(agent.id)}>
                {renderAgentCard(agent)}
              </div>
            ) : (
              <div
                key={agent.id}
                className={`
                border p-4 rounded flex justify-between items-center 
                cursor-pointer transition-all duration-200
                ${
                  currentAgent?.id === agent.id
                    ? "border-blue-500 bg-blue-500/10 text-white"
                    : "border-gray-700 hover:border-blue-400 hover:bg-blue-500/5 text-gray-200"
                }
              `}
                onClick={() => onAgentSelect(agent.id)}
              >
                <div>
                  <h3 className="font-medium text-inherit">{agent.name}</h3>
                  <p className="text-sm text-gray-400">
                    Created: {new Date(agent.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-400">
                    {agent.blocks.length} blocks
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm("Are you sure you want to delete this agent?")
                    ) {
                      deleteAgent(agent.id);
                    }
                  }}
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            )
          )}
      </div>
    </div>
  );
}
