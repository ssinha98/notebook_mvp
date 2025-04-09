import { useEffect } from "react";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@radix-ui/react-icons";
import { Agent } from "@/types/types";

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

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  const handleCreateAgent = async () => {
    const name = prompt("Enter agent name:");
    if (name) {
      resetBlocks();
      await createAgent(name);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">My Agents</h2>
        <Button
          onClick={handleCreateAgent}
          variant="default"
          color="blue"
          className="px-4 py-2 rounded transition-colors"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      <div className="space-y-2">
        {agents.map((agent) =>
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
                  if (confirm("Are you sure you want to delete this agent?")) {
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
