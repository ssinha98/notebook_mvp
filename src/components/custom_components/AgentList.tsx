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
// import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AgentsListProps {
  onAgentSelect: (agentId: string) => void;
  renderAgentCard?: (agent: Agent) => React.ReactNode;
}

export default function AgentsList({
  onAgentSelect,
  renderAgentCard,
}: AgentsListProps) {
  const router = useRouter();
  const { agents, loadAgents, createAgent, deleteAgent, currentAgent } =
    useAgentStore();
  const { resetBlocks } = useSourceStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);

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
      <AlertDialogContent className="bg-black">
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Agent</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how you'd like to create your agent
          </AlertDialogDescription>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div
              onClick={() => {
                setIsCreateDialogOpen(false);
                setShowNameDialog(true);
              }}
              className="border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center text-center"
            >
              <PlusIcon className="w-8 h-8 mb-2" />
              <h3 className="font-semibold mb-1">Start from scratch</h3>
              <p className="text-sm text-gray-400">
                Build your own custom agent from the ground up
              </p>
            </div>
            <div
              onClick={() => router.push("/agentStore")}
              className="border rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center text-center"
            >
              <ShoppingBag className="w-8 h-8 mb-2" />
              <h3 className="font-semibold mb-1">Browse the Agent Store</h3>
              <p className="text-sm text-gray-400">
                Choose from pre-built agents for your needs
              </p>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setIsCreateDialogOpen(false)}>
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderNameDialog = () => (
    <AlertDialog open={showNameDialog} onOpenChange={setShowNameDialog}>
      <AlertDialogContent className="bg-black">
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
          <AlertDialogCancel
            onClick={() => {
              setShowNameDialog(false);
              setNewAgentName("");
            }}
          >
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
      {renderNameDialog()}

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
                  // onClick={() => onAgentSelect(agent.id)}
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
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <VscSettings className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-40 p-0 bg-black">
                        <Button
                          variant="ghost"
                          className="w-full justify-start px-3 py-2 text-red-500 hover:text-red-400 hover:bg-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteAgent(agent.id);
                          }}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
