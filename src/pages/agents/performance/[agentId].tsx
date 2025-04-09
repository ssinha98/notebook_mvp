import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useAgentStore } from "@/lib/agentStore";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, ChevronRight, ArrowLeft } from "lucide-react";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

// Types for our cell content
interface AgentOutput {
  systemPrompt: string;
  userPrompt: string;
  output: string;
}

interface ContactOutput {
  to: string;
  subject: string;
  body: string;
}

interface InternetOutput {
  url: string;
  content: string;
}

interface CheckInOutput {
  status: string;
  notes: string;
}

type CellContent = AgentOutput | ContactOutput | InternetOutput | CheckInOutput;

export default function AgentPerformancePage() {
  const router = useRouter();
  const { agentId } = router.query;
  const { agents } = useAgentStore();
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editedOutput, setEditedOutput] = useState("");
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [selectedCell, setSelectedCell] = useState<{
    blockType: string;
    timestamp: string;
  } | null>(null);
  const [bulkRating, setBulkRating] = useState<"up" | "down" | null>(null);
  const [bulkComments, setBulkComments] = useState("");

  const agent = agents.find((a) => a.id === agentId);

  if (!agent) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold text-white">Agent not found</h1>
        </div>
      </Layout>
    );
  }

  // Block types
  const blockTypes = [
    "Agent #1",
    "Contact #11",
    "Internet #1",
    "Check in #1",
    "Agent #2",
  ];

  // Timestamps - 3 days with morning and afternoon
  const runTimestamps = [
    "2024-03-20 09:00",
    "2024-03-20 14:00",
    "2024-03-21 09:00",
    "2024-03-21 14:00",
    "2024-03-22 09:00",
    "2024-03-22 14:00",
    "2024-03-23 09:00",
    "2024-03-23 14:00",
    "2024-03-24 09:00",
    "2024-03-24 14:00",
  ];

  // Fixed column colors - alternating green and red
  const columnColors = runTimestamps.map((_, index) =>
    index % 2 === 0 ? "bg-green-900/30" : "bg-red-900/30"
  );

  // Sample data for each cell
  const cellData: Record<string, Record<string, CellContent>> = {
    "Agent #1": {
      "2024-03-20 09:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt:
          "Analyze this customer's purchase history and suggest relevant products.",
        output:
          "Based on the customer's history, I recommend our premium subscription package as it aligns with their usage patterns.",
      },
      "2024-03-20 14:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt:
          "Draft a follow-up email for a customer who showed interest in our enterprise plan.",
        output:
          "I've prepared a personalized follow-up highlighting the enterprise features that match their business needs.",
      },
      "2024-03-21 09:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt:
          "Analyze the customer's support ticket history and suggest improvements.",
        output:
          "Based on the support history, I recommend implementing a knowledge base to reduce common support queries.",
      },
      "2024-03-21 14:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt: "Create a sales pitch for our new feature.",
        output:
          "Our new feature will revolutionize your workflow by automating repetitive tasks and increasing efficiency.",
      },
      "2024-03-22 09:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt:
          "Analyze the customer's usage patterns and suggest optimizations.",
        output:
          "Based on usage patterns, I recommend adjusting the notification settings to reduce unnecessary alerts.",
      },
      "2024-03-22 14:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt: "Draft a renewal reminder email.",
        output:
          "Your subscription is expiring soon. Renew now to maintain uninterrupted access to premium features.",
      },
      "2024-03-23 09:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt: "Create a customer success story.",
        output:
          "Customer X increased their productivity by 40% after implementing our solution.",
      },
      "2024-03-23 14:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt: "Analyze customer feedback and suggest improvements.",
        output:
          "Based on feedback, we should prioritize improving the mobile app's offline capabilities.",
      },
      "2024-03-24 09:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt: "Draft a product update announcement.",
        output:
          "We're excited to announce new features that will enhance your experience and boost productivity.",
      },
      "2024-03-24 14:00": {
        systemPrompt:
          "You are a helpful sales assistant. Focus on understanding customer needs and providing relevant solutions.",
        userPrompt: "Create a customer onboarding guide.",
        output:
          "Welcome to our platform! This guide will help you get started and make the most of our features.",
      },
    },
    "Contact #11": {
      "2024-03-20 09:00": {
        to: "customer@usesolar.ai",
        subject: "Follow-up on your recent inquiry",
        body: "Dear valued customer, thank you for your interest in our services. We'd love to discuss how we can help you achieve your goals...",
      },
      "2024-03-20 14:00": {
        to: "support@usesolar.ai",
        subject: "Technical support request",
        body: "We're experiencing issues with the API integration. The authentication seems to be failing...",
      },
      "2024-03-21 09:00": {
        to: "team@usesolar.ai",
        subject: "Weekly team update",
        body: "Here's a summary of our progress this week and the upcoming tasks we need to focus on...",
      },
      "2024-03-21 14:00": {
        to: "client@usesolar.ai",
        subject: "Project milestone reached",
        body: "We're pleased to inform you that we've completed the first phase of the project ahead of schedule...",
      },
      "2024-03-22 09:00": {
        to: "partner@usesolar.ai",
        subject: "Collaboration opportunity",
        body: "We've reviewed your proposal and are excited about the potential partnership opportunities...",
      },
      "2024-03-22 14:00": {
        to: "vendor@usesolar.ai",
        subject: "Order confirmation",
        body: "Thank you for your recent order. We've processed it and will begin shipping immediately...",
      },
      "2024-03-23 09:00": {
        to: "recruitment@usesolar.ai",
        subject: "Job application follow-up",
        body: "Thank you for applying to our open position. We'd like to schedule an interview to discuss your qualifications...",
      },
      "2024-03-23 14:00": {
        to: "events@usesolar.ai",
        subject: "Conference registration",
        body: "We're excited to confirm your registration for the upcoming industry conference...",
      },
      "2024-03-24 09:00": {
        to: "feedback@usesolar.ai",
        subject: "Customer satisfaction survey",
        body: "We value your feedback and would appreciate a few minutes of your time to complete our survey...",
      },
      "2024-03-24 14:00": {
        to: "newsletter@usesolar.ai",
        subject: "Monthly newsletter",
        body: "Here's our latest newsletter with updates on new features, success stories, and upcoming events...",
      },
    },
    "Internet #1": {
      "2024-03-20 09:00": {
        url: "https://usesolar.ai/pricing",
        content:
          "Scraped pricing information from usesolar.ai. Found three pricing tiers: Basic ($10), Pro ($25), and Enterprise ($50)...",
      },
      "2024-03-20 14:00": {
        url: "https://competitor.usesolar.ai/features",
        content:
          "Analyzed competitor's feature set. They offer similar core features but lack our advanced automation capabilities...",
      },
      "2024-03-21 09:00": {
        url: "https://market-research.usesolar.ai/trends",
        content:
          "Scraped market research data showing increasing demand for AI-powered solutions in our sector...",
      },
      "2024-03-21 14:00": {
        url: "https://tech-news.usesolar.ai/latest",
        content:
          "Analyzed latest tech news for relevant industry updates and emerging technologies...",
      },
      "2024-03-22 09:00": {
        url: "https://customer-reviews.usesolar.ai/our-product",
        content:
          "Scraped customer reviews showing high satisfaction with our user interface but some concerns about performance...",
      },
      "2024-03-22 14:00": {
        url: "https://industry-forum.usesolar.ai/discussions",
        content:
          "Analyzed industry forum discussions to identify common pain points and feature requests...",
      },
      "2024-03-23 09:00": {
        url: "https://social-media.usesolar.ai/mentions",
        content:
          "Scraped social media mentions to track brand sentiment and customer feedback...",
      },
      "2024-03-23 14:00": {
        url: "https://job-boards.usesolar.ai/skills",
        content:
          "Analyzed job postings to identify in-demand skills and technologies in our industry...",
      },
      "2024-03-24 09:00": {
        url: "https://research-papers.usesolar.ai/ai",
        content:
          "Scraped latest research papers on AI applications in our field to identify emerging trends...",
      },
      "2024-03-24 14:00": {
        url: "https://product-comparison.usesolar.ai/features",
        content:
          "Analyzed feature comparison data to identify our competitive advantages and areas for improvement...",
      },
    },
    "Check in #1": {
      "2024-03-20 09:00": {
        status: "Completed",
        notes:
          "All tasks completed successfully. Customer feedback was positive and implementation went smoothly...",
      },
      "2024-03-20 14:00": {
        status: "In Progress",
        notes:
          "Waiting for customer response on the latest proposal. Follow-up scheduled for tomorrow...",
      },
      "2024-03-21 09:00": {
        status: "Completed",
        notes:
          "Project milestone achieved. Team meeting scheduled to discuss next phase...",
      },
      "2024-03-21 14:00": {
        status: "Delayed",
        notes:
          "Technical issues causing delays. Support team working on resolution...",
      },
      "2024-03-22 09:00": {
        status: "Completed",
        notes:
          "Client onboarding completed successfully. Training materials delivered...",
      },
      "2024-03-22 14:00": {
        status: "In Progress",
        notes:
          "Integration testing in progress. No major issues reported so far...",
      },
      "2024-03-23 09:00": {
        status: "Completed",
        notes:
          "Monthly report generated and sent to stakeholders. Positive feedback received...",
      },
      "2024-03-23 14:00": {
        status: "In Progress",
        notes:
          "Performance optimization in progress. Initial results show improvement...",
      },
      "2024-03-24 09:00": {
        status: "Completed",
        notes:
          "Security audit completed. All systems passed with flying colors...",
      },
      "2024-03-24 14:00": {
        status: "In Progress",
        notes:
          "New feature development on track. Beta testing scheduled for next week...",
      },
    },
    "Agent #2": {
      "2024-03-20 09:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Help a customer resolve their API integration issues.",
        output:
          "I've identified the issue with the API authentication and provided step-by-step resolution steps.",
      },
      "2024-03-20 14:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Create a knowledge base article about common API issues.",
        output:
          "I've drafted a comprehensive guide covering the most frequent API integration challenges.",
      },
      "2024-03-21 09:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Help a customer optimize their database queries.",
        output:
          "I've analyzed the queries and provided optimization recommendations to improve performance.",
      },
      "2024-03-21 14:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Create a troubleshooting guide for network issues.",
        output:
          "I've prepared a detailed guide covering common network problems and their solutions.",
      },
      "2024-03-22 09:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Help a customer set up their development environment.",
        output:
          "I've provided a step-by-step guide for setting up the development environment with all dependencies.",
      },
      "2024-03-22 14:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Create documentation for the new API endpoints.",
        output:
          "I've documented all new API endpoints with examples and best practices.",
      },
      "2024-03-23 09:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Help a customer debug their application.",
        output:
          "I've identified the root cause of the application crash and provided a fix.",
      },
      "2024-03-23 14:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Create a security best practices guide.",
        output:
          "I've compiled a comprehensive guide on security best practices for our platform.",
      },
      "2024-03-24 09:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Help a customer optimize their cloud resources.",
        output:
          "I've analyzed their cloud usage and provided recommendations to reduce costs.",
      },
      "2024-03-24 14:00": {
        systemPrompt:
          "You are a technical support specialist. Focus on troubleshooting and providing clear solutions.",
        userPrompt: "Create a performance monitoring guide.",
        output:
          "I've prepared a guide on setting up and using our performance monitoring tools.",
      },
    },
  };

  const handleCellClick = (blockType: string, timestamp: string) => {
    const cellId = `${blockType}-${timestamp}`;
    setSelectedCell({ blockType, timestamp });
    setIsSidebarOpen(true);

    // Format the cell content for display
    const content = cellData[blockType]?.[timestamp];
    if (content) {
      let formattedOutput = "";
      if ("systemPrompt" in content) {
        formattedOutput = `System Prompt: ${content.systemPrompt}\n\nUser Prompt: ${content.userPrompt}\n\nOutput: ${content.output}`;
      } else if ("to" in content) {
        formattedOutput = `To: ${content.to}\nSubject: ${content.subject}\n\nBody:\n${content.body}`;
      } else if ("url" in content) {
        formattedOutput = `URL: ${content.url}\n\nContent:\n${content.content}`;
      } else if ("status" in content) {
        formattedOutput = `Status: ${content.status}\n\nNotes:\n${content.notes}`;
      }
      setEditedOutput(formattedOutput);
    }
  };

  const handleCheckboxClick = (
    blockType: string,
    timestamp: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    const cellId = `${blockType}-${timestamp}`;
    setSelectedCells((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cellId)) {
        newSet.delete(cellId);
      } else {
        newSet.add(cellId);
      }
      return newSet;
    });
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 h-screen flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
              onClick={() => router.push("/agents")}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Agents
            </Button>
            <h1 className="text-2xl font-bold text-white">
              Edit Performance for - {agent.name}
            </h1>
          </div>
          <Badge
            variant="secondary"
            className="bg-blue-500/20 text-blue-400 border-blue-500/30"
          >
            Beta
          </Badge>
        </div>

        {/* Main Grid Area */}
        <div className="bg-gray-800 rounded-lg p-4 flex-1 overflow-hidden relative">
          <div className="overflow-x-auto h-full">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 text-gray-400 w-48">
                    Block Type
                  </th>
                  {runTimestamps.map((timestamp, index) => (
                    <th
                      key={timestamp}
                      className="text-center p-2 text-gray-400 w-64"
                    >
                      {timestamp}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {blockTypes.map((blockType) => (
                  <tr key={blockType}>
                    <td className="p-2 text-white w-48">{blockType}</td>
                    {runTimestamps.map((timestamp, index) => {
                      const cellId = `${blockType}-${timestamp}`;
                      const isSelected = selectedCells.has(cellId);
                      const content = cellData[blockType]?.[timestamp];

                      return (
                        <td
                          key={timestamp}
                          className={`
                            p-2 relative cursor-pointer w-64
                            ${columnColors[index]}
                            hover:bg-gray-700/50
                          `}
                          onClick={() => handleCellClick(blockType, timestamp)}
                        >
                          <input
                            type="checkbox"
                            className="absolute top-2 left-2"
                            checked={isSelected}
                            onClick={(e) =>
                              handleCheckboxClick(blockType, timestamp, e)
                            }
                          />
                          <ChevronRight className="absolute top-2 right-2 h-4 w-4 text-gray-400" />
                          {content && (
                            <div className="text-xs text-gray-300 mt-6">
                              {blockType.startsWith("Agent")
                                ? (content as AgentOutput).output
                                : blockType.startsWith("Contact")
                                  ? `To: ${(content as ContactOutput).to}\nSubject: ${(content as ContactOutput).subject}...`
                                  : blockType.startsWith("Internet")
                                    ? `URL: ${(content as InternetOutput).url}\n${(content as InternetOutput).content.substring(0, 50)}...`
                                    : `Status: ${(content as CheckInOutput).status}\n${(content as CheckInOutput).notes.substring(0, 50)}...`}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Floating Action Bar */}
        {selectedCells.size >= 2 && (
          <div className="fixed bottom-6 left-6 right-6 bg-gray-800/95 border border-gray-700 p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-in slide-in-from-bottom fade-in">
            <div className="container mx-auto flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={bulkRating === "up" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setBulkRating("up")}
                >
                  <ThumbsUp className="h-4 w-4" />
                  <span>Good</span>
                </Button>
                <Button
                  variant={bulkRating === "down" ? "default" : "outline"}
                  className="flex items-center gap-2"
                  onClick={() => setBulkRating("down")}
                >
                  <ThumbsDown className="h-4 w-4" />
                  <span>Needs Improvement</span>
                </Button>
              </div>
              <div className="flex-1">
                <Input
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Add comments for selected items..."
                  value={bulkComments}
                  onChange={(e) => setBulkComments(e.target.value)}
                />
              </div>
              <Button
                onClick={() => {
                  setSelectedCells(new Set());
                  setBulkRating(null);
                  setBulkComments("");
                  toast("Feedback submitted!", {
                    action: {
                      label: "Close",
                      onClick: () => toast.dismiss(),
                    },
                  });
                }}
              >
                Confirm
              </Button>
            </div>
          </div>
        )}

        {/* Sidebar */}
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
          <SheetContent className="w-[500px] bg-gray-800 border-gray-700 flex flex-col">
            <SheetHeader>
              <SheetTitle className="text-white">
                Edit Agent Performance
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 mt-6 space-y-6 overflow-y-auto">
              {/* Rating Section */}
              <div>
                <h3 className="text-white font-medium mb-2">Rate Output</h3>
                <div className="flex space-x-4">
                  <Button
                    variant={rating === "up" ? "default" : "outline"}
                    className="flex items-center space-x-2"
                    onClick={() => setRating("up")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    <span>Good</span>
                  </Button>
                  <Button
                    variant={rating === "down" ? "default" : "outline"}
                    className="flex items-center space-x-2"
                    onClick={() => setRating("down")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    <span>Needs Improvement</span>
                  </Button>
                </div>
              </div>

              {/* Original Output */}
              <div>
                <h3 className="text-white font-medium mb-2">Original Output</h3>
                <Textarea
                  className="bg-gray-700 border-gray-600 text-white"
                  value={editedOutput}
                  readOnly
                />
              </div>

              {/* Edited Output */}
              <div>
                <h3 className="text-white font-medium mb-2">Edited Output</h3>
                <Textarea
                  className="bg-gray-700 border-gray-600 text-white mb-2"
                  value={editedOutput}
                  onChange={(e) => setEditedOutput(e.target.value)}
                />
                <Button variant="outline" className="w-full">
                  Confirm Edit
                </Button>
              </div>

              {/* Comments Section */}
              <div>
                <h3 className="text-white font-medium mb-2">Comments</h3>
                <Textarea
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Add any comments or suggestions for improving this agent..."
                  rows={4}
                />
              </div>
            </div>

            {/* Action Buttons - Fixed to bottom */}
            <div className="mt-6 space-y-2 pt-4 border-t border-gray-700">
              <Button
                className="w-full"
                onClick={() => {
                  setIsSidebarOpen(false);
                  setRating(null);
                  setEditedOutput("");
                  toast("Feedback submitted!", {
                    action: {
                      label: "Close",
                      onClick: () => toast.dismiss(),
                    },
                  });
                }}
              >
                Confirm
              </Button>
              <Button variant="outline" className="w-full">
                Discard
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </Layout>
  );
}
