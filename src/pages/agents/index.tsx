import { useRouter } from "next/router";
import { useAgentStore } from "@/lib/agentStore";
import { Button } from "@/components/ui/button";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
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
import { ThumbsUp, ThumbsDown, Settings2, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import AgentsList from "@/components/custom_components/AgentList";

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

export default function AgentsPage() {
  const router = useRouter();
  const { loadAgent } = useAgentStore();
  const [activeTab, setActiveTab] = useState("cost");

  const handleAgentSelect = async (agentId: string) => {
    router.push(`/?agentId=${agentId}`);
  };

  const handlePerformanceClick = (agentId: string) => {
    router.push(`/agents/performance/${agentId}`);
  };

  return (
    <Layout>
      <SessionHandler />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeftOutlined />
              Back to Notebook
            </Button> */}
            <h1 className="text-2xl font-bold text-white">Agents</h1>
          </div>
          <Badge
            variant="secondary"
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            Beta
          </Badge>
        </div>

        {/* Tasks Section - Temporarily Commented Out
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
        */}

        <div
          className="w-full p-4 mb-6 bg-blue-600/80 hover:bg-blue-700/90 rounded-lg cursor-pointer transition-colors flex justify-between items-center"
          onClick={() => router.push("/agentStore")}
        >
          💡 Need inspiration? Check out our Agent Store for a set of pre-built
          agents.
          <ArrowRightOutlined />
        </div>

        <AgentsList onAgentSelect={handleAgentSelect} />
      </div>
    </Layout>
  );
}
