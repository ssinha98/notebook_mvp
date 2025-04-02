import AgentsList from "@/components/custom_components/AgentList";
import { useRouter } from "next/router";
import { useAgentStore } from "@/lib/agentStore";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Settings2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { SessionHandler } from "@/components/custom_components/SessionHandler";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

// Dummy data for tasks
const tasks = [
  {
    id: 1,
    name: "Review cold email drafts",
    agent: "Sales Agent",
    completed: false,
  },
  {
    id: 2,
    name: "Confirm website URLs from incoming lead form",
    agent: "Data Analysis Agent",
    completed: false,
  },
];

// Dummy data for agents
const agents = [
  {
    id: 1,
    name: "Sales Pipeline Manager",
    domain: "sales",
    creator: "John Doe",
    rating: { up: 85, down: 15 },
  },
  {
    id: 2,
    name: "Content Generator",
    domain: "marketing",
    creator: "Jane Smith",
    rating: { up: 92, down: 8 },
  },
  {
    id: 3,
    name: "Data Analyzer",
    domain: "data analysis",
    creator: "Mike Johnson",
    rating: { up: 78, down: 22 },
  },
  {
    id: 4,
    name: "Revenue Optimizer",
    domain: "revops",
    creator: "Sarah Wilson",
    rating: { up: 88, down: 12 },
  },
];

export default function AgentsPage() {
  const router = useRouter();
  const { loadAgent } = useAgentStore();

  const handleAgentSelect = async (agentId: string) => {
    router.push(`/?agentId=${agentId}`);
  };

  return (
    <Layout>
      <SessionHandler />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">
              Your Agent Control Panel
            </h1>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Tasks</h2>
          <ScrollArea className="h-[20vh]">
            <div className="space-y-4">
              {tasks.map((task) => (
                <Card key={task.id} className="bg-gray-700 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-start space-x-4">
                        <Checkbox checked={task.completed} className="mt-1" />
                        <div>
                          <p className="text-white font-medium">{task.name}</p>
                          <p className="text-gray-400 text-sm">
                            From: {task.agent}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-white hover:bg-gray-600"
                      >
                        Complete Task
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Agent Store Link */}
        <div
          className="w-full p-4 mb-6 bg-blue-600/80 hover:bg-blue-700/90 rounded-lg cursor-pointer transition-colors flex justify-between items-center"
          onClick={() => router.push("/agentStore")}
        >
          💡 Need inspiration? Check out our Agent Store for a set of pre-built
          agents.
          <ArrowRight />
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <Card
              key={agent.id}
              className="bg-gray-900 border-gray-700 hover:bg-gray-800/50 transition-colors"
            >
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div className="flex-1">
                  <CardTitle className="text-white font-bold">
                    {agent.name}
                  </CardTitle>
                  <Badge variant="secondary" className="mt-2">
                    {agent.domain}
                  </Badge>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-white"
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-gray-800 border-gray-700">
                    <AlertDialogHeader>
                      <div className="flex items-center justify-between">
                        <AlertDialogTitle className="text-white">
                          {agent.name}
                        </AlertDialogTitle>
                        <Switch defaultChecked />
                      </div>
                    </AlertDialogHeader>
                    <div className="flex h-[400px] mt-4">
                      <div className="w-48 border-r border-gray-700 pr-4">
                        <nav className="space-y-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-white hover:bg-gray-700"
                          >
                            Cost Management
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-white hover:bg-gray-700"
                          >
                            Tools + API Keys
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start text-white hover:bg-gray-700"
                          >
                            Roles + User Management
                          </Button>
                        </nav>
                      </div>
                      <div className="flex-1 pl-4">
                        <div className="space-y-6">
                          {/* Cost Management Section */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-white font-medium mb-2">
                                Cost Limit
                              </h3>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  placeholder="Enter amount"
                                  className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2 w-32"
                                />
                                <span className="text-gray-400">USD</span>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">
                                Pause agent if costs exceed this amount
                              </p>
                            </div>
                            <div>
                              <h3 className="text-white font-medium mb-2">
                                Cost Notification
                              </h3>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  placeholder="Enter amount"
                                  className="bg-gray-700 border-gray-600 text-white rounded-md px-3 py-2 w-32"
                                />
                                <span className="text-gray-400">USD</span>
                              </div>
                              <p className="text-gray-400 text-sm mt-1">
                                Alert me if costs exceed this amount
                              </p>
                            </div>
                          </div>

                          {/* Tools + API Keys Section */}
                          <div className="space-y-4">
                            <h3 className="text-white font-medium">
                              Your agent uses these tools
                            </h3>
                            <div className="space-y-4">
                              <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-white font-medium">
                                    Google Drive
                                  </h4>
                                  <Badge variant="secondary">Connected</Badge>
                                </div>
                                <p className="text-gray-400 text-sm mb-2">
                                  Access settings and API keys for Google Drive
                                  integration
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-white hover:bg-gray-600"
                                >
                                  Manage Access
                                </Button>
                              </div>
                              <div className="bg-gray-700 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                  <h4 className="text-white font-medium">
                                    Airtable
                                  </h4>
                                  <Badge variant="secondary">Connected</Badge>
                                </div>
                                <p className="text-gray-400 text-sm mb-2">
                                  Access settings and API keys for Airtable
                                  integration
                                </p>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-white hover:bg-gray-600"
                                >
                                  Manage Access
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                      <Button variant="outline">Close</Button>
                      <Button>Save Changes</Button>
                    </div>
                  </AlertDialogContent>
                </AlertDialog>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 text-sm mb-4">
                  Built by: {agent.creator}
                </p>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <ThumbsUp className="text-green-400" />
                    <span className="text-white">{agent.rating.up}%</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <ThumbsDown className="text-red-400" />
                    <span className="text-white">{agent.rating.down}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
