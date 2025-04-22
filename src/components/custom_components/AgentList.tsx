import { useEffect, useState } from "react";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PlusIcon, Play, Clock, ThumbsUp, ThumbsDown } from "lucide-react";
import { TbApi } from "react-icons/tb";
import { MdAlternateEmail } from "react-icons/md";
import { VscSettings } from "react-icons/vsc";
import { Edit } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

  const renderCreateButton = () => (
    <AlertDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
  );

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white">My Agents</h2>
        {renderCreateButton()}
      </div>

      {agents.length === 0 ? (
        <div
          className="border rounded-lg overflow-hidden"
          style={{ backgroundColor: "#131722" }}
        >
          <div className="py-8 text-center text-gray-400">
            <div className="mb-4"></div>
            No agents yet
          </div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent Start</TableHead>
              <TableHead>Agent name</TableHead>
              <TableHead>Edit</TableHead>
              <TableHead>Rating</TableHead>
              {/* <TableHead>Settings</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...agents]
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )
              .map((agent) => (
                <TableRow
                  key={agent.id}
                  className={
                    currentAgent?.id === agent.id ? "bg-blue-500/10" : ""
                  }
                  onClick={() => onAgentSelect(agent.id)}
                >
                  <TableCell>
                    <TooltipProvider>
                      {agent.start_method === "schedule" ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <Clock className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Scheduled Agent: Runs at specified times
                              automatically
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      ) : agent.start_method === "api" ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <TbApi className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>API Agent: Triggered via API endpoints</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : agent.start_method === "email" ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <MdAlternateEmail className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Email Agent: Triggered by email interactions</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger>
                            <Play className="h-4 w-4" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Manual Agent: Started manually by user</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>
                  </TableCell>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    {agent.agent_rating_thumbs_up ||
                    agent.agent_rating_thumbs_down ? (
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-green-500">
                          <ThumbsUp className="h-4 w-4" />
                          <span>{agent.agent_rating_thumbs_up || 0}%</span>
                        </div>
                        <div className="flex items-center gap-1 text-red-500">
                          <ThumbsDown className="h-4 w-4" />
                          <span>{agent.agent_rating_thumbs_down || 0}%</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">no ratings yet</span>
                    )}
                  </TableCell>
                  {/* <TableCell>
                    <Button variant="ghost" size="sm">
                      <VscSettings className="h-4 w-4" />
                    </Button>
                  </TableCell> */}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
