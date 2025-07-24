import { useEffect, useState } from "react";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  Play,
  Clock,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ChevronDown,
} from "lucide-react";
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
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAgentTemplateStore } from "@/lib/agentTemplateStore";
import { auth } from "@/tools/firebase";

interface AgentsListProps {
  onAgentSelect: (agentId: string) => void;
  renderAgentCard?: (agent: Agent) => React.ReactNode;
}

export default function AgentsList({
  onAgentSelect,
  renderAgentCard,
}: AgentsListProps) {
  const router = useRouter();
  const {
    agents,
    loadAgents,
    createAgent,
    deleteAgent,
    copyAgent,
    currentAgent,
  } = useAgentStore();
  const { resetBlocks } = useSourceStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAgentName, setNewAgentName] = useState("");
  const [agentToDelete, setAgentToDelete] = useState<string | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyAgentId, setCopyAgentId] = useState<string | null>(null);
  const [copyAgentName, setCopyAgentName] = useState("");
  const [showCopyExistingDialog, setShowCopyExistingDialog] = useState(false);
  const [selectedAgentToCopy, setSelectedAgentToCopy] = useState<string>("");
  const [showCopyTemplateDialog, setShowCopyTemplateDialog] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [copyTemplateName, setCopyTemplateName] = useState("");

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

  const handleCopyAgent = async () => {
    if (copyAgentId && copyAgentName.trim()) {
      try {
        await copyAgent(copyAgentId, copyAgentName);
        setCopyAgentName("");
        setCopyAgentId(null);
        setShowCopyDialog(false);
      } catch (error) {
        console.error("Error copying agent:", error);
      }
    }
  };

  const handleCopyExistingAgent = async () => {
    if (selectedAgentToCopy) {
      try {
        const selectedAgent = agents.find(
          (agent) => agent.id === selectedAgentToCopy
        );
        if (selectedAgent) {
          const copyName = `${selectedAgent.name} - Copy`;
          await copyAgent(selectedAgentToCopy, copyName);
          setSelectedAgentToCopy("");
          setShowCopyExistingDialog(false);
          setIsCreateDialogOpen(false);
        }
      } catch (error) {
        console.error("Error copying existing agent:", error);
      }
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
      <AlertDialogContent className="bg-black max-w-4xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Create New Agent</AlertDialogTitle>
          <AlertDialogDescription>
            Choose how you'd like to create your agent
          </AlertDialogDescription>
          <div className="grid grid-cols-3 gap-6 mt-6">
            <div
              onClick={() => {
                setIsCreateDialogOpen(false);
                setShowNameDialog(true);
              }}
              className="border rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center text-center"
            >
              <PlusIcon className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Start from scratch</h3>
              <p className="text-sm text-gray-400">
                Build your own custom agent from the ground up
              </p>
            </div>
            <div
              onClick={() => {
                setIsCreateDialogOpen(false);
                setShowCopyExistingDialog(true);
              }}
              className="border rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center text-center"
            >
              <Copy className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Copy Existing Agent</h3>
              <p className="text-sm text-gray-400">
                Copy one of your existing agents as a starting point
              </p>
            </div>
            <div
              onClick={async () => {
                setIsCreateDialogOpen(false);
                setShowCopyTemplateDialog(true);
                // Load templates for the current user
                const userId = auth.currentUser?.uid;
                const templates = await useAgentTemplateStore
                  .getState()
                  .getTemplates(userId || "");
                setTemplates(templates);
              }}
              className="border rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center text-center"
            >
              <Copy className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Copy from Template</h3>
              <p className="text-sm text-gray-400">
                Create a new agent from a saved template
              </p>
            </div>
            <div
              onClick={() => router.push("/agentStore")}
              className="border rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer flex flex-col items-center text-center"
            >
              <ShoppingBag className="w-8 h-8 mb-3" />
              <h3 className="font-semibold mb-2">Browse the Agent Store</h3>
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

  const renderCopyDialog = () => (
    <AlertDialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
      <AlertDialogContent className="bg-black">
        <AlertDialogHeader>
          <AlertDialogTitle>Copy Agent</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a name for the copied agent.
          </AlertDialogDescription>
          <Input
            value={copyAgentName}
            onChange={(e) => setCopyAgentName(e.target.value)}
            placeholder="Copied agent name"
            className="mt-4"
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setShowCopyDialog(false);
              setCopyAgentName("");
              setCopyAgentId(null);
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleCopyAgent}>Copy</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderCopyExistingDialog = () => (
    <AlertDialog
      open={showCopyExistingDialog}
      onOpenChange={setShowCopyExistingDialog}
    >
      <AlertDialogContent className="bg-black">
        <AlertDialogHeader>
          <AlertDialogTitle>Copy Existing Agent</AlertDialogTitle>
          <AlertDialogDescription>
            Select an agent to copy. The new agent will be named "
            {selectedAgentToCopy
              ? agents.find((a) => a.id === selectedAgentToCopy)?.name +
                " - Copy"
              : "Agent - Copy"}
            ".
          </AlertDialogDescription>
          <div className="mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedAgentToCopy
                      ? agents.find((a) => a.id === selectedAgentToCopy)?.name
                      : "Select agent to copy"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <ScrollArea className="h-48 w-full">
                  <div className="space-y-1 pr-4">
                    {agents.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-400">
                        No agents available to copy
                      </div>
                    ) : (
                      agents.map((agent) => (
                        <button
                          key={agent.id}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-700 rounded"
                          onClick={() => {
                            setSelectedAgentToCopy(agent.id);
                            // Immediately copy the agent and close dialog
                            const copyName = `${agent.name} - Copy`;
                            copyAgent(agent.id, copyName);
                            setSelectedAgentToCopy("");
                            setShowCopyExistingDialog(false);
                            setIsCreateDialogOpen(false);
                          }}
                        >
                          {agent.name}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setShowCopyExistingDialog(false);
              setSelectedAgentToCopy("");
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCopyExistingAgent}
            disabled={!selectedAgentToCopy}
          >
            Copy Agent
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderCopyTemplateDialog = () => (
    <AlertDialog
      open={showCopyTemplateDialog}
      onOpenChange={setShowCopyTemplateDialog}
    >
      <AlertDialogContent className="bg-black">
        <AlertDialogHeader>
          <AlertDialogTitle>Copy from Template</AlertDialogTitle>
          <AlertDialogDescription>
            Select a template to copy. The new agent will be named "
            {copyTemplateName || "Agent from Template"}".
          </AlertDialogDescription>
          <div className="mt-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span>
                    {selectedTemplateId
                      ? templates.find((t) => t.id === selectedTemplateId)?.name
                      : "Select template to copy"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="start">
                <ScrollArea className="h-48 w-full">
                  <div className="space-y-1 pr-4">
                    {templates.length === 0 ? (
                      <div className="px-2 py-1.5 text-sm text-gray-400">
                        No templates available
                      </div>
                    ) : (
                      templates.map((template) => (
                        <button
                          key={template.id}
                          className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-700 rounded"
                          onClick={() => {
                            setSelectedTemplateId(template.id);
                            setCopyTemplateName(`${template.name} (Copy)`);
                          }}
                        >
                          {template.name}
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <Input
              value={copyTemplateName}
              onChange={(e) => setCopyTemplateName(e.target.value)}
              placeholder="New agent name"
              className="mt-4"
            />
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={() => {
              setShowCopyTemplateDialog(false);
              setSelectedTemplateId("");
              setCopyTemplateName("");
              loadAgents();
            }}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              if (selectedTemplateId && copyTemplateName.trim()) {
                const userId = auth.currentUser?.uid;
                await useAgentTemplateStore
                  .getState()
                  .createAgentFromTemplate(
                    userId || "",
                    selectedTemplateId,
                    copyTemplateName
                  );
                setShowCopyTemplateDialog(false);
                setSelectedTemplateId("");
                setCopyTemplateName("");
                loadAgents();
              }
            }}
            disabled={!selectedTemplateId || !copyTemplateName.trim()}
          >
            Copy Template
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
      {renderCopyDialog()}
      {renderCopyExistingDialog()}
      {renderCopyTemplateDialog()}

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
                          className="w-full justify-start px-3 py-2 text-blue-500 hover:text-blue-400 hover:bg-black"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCopyAgentId(agent.id);
                            setCopyAgentName(`${agent.name} (Copy)`);
                            setShowCopyDialog(true);
                          }}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Agent
                        </Button>
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
