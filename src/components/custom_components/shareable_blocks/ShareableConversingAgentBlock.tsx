import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Message {
  type: "incoming" | "outgoing";
  content: string;
}

interface ShareableConversingAgentBlockProps {
  blockNumber: number;
  systemPrompt?: string;
  channel: "email" | "slack" | "teams";
  sources: string[];
  objective: string;
  messages: Message[];
  outputVariable?: {
    name: string;
    value?: string;
  };
  isProcessing?: boolean;
}

const ShareableConversingAgentBlock: React.FC<
  ShareableConversingAgentBlockProps
> = ({
  blockNumber,
  channel = "email",
  sources = [],
  objective = "",
  messages = [],
  outputVariable,
  isProcessing,
}) => {
  return (
    <Card className="p-6 bg-gray-900 border-gray-800">
      <div className="space-y-6">
        {/* Header with Channel Select */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChatBubbleLeftRightIcon className="h-6 w-6 text-blue-500" />
            <span className="text-sm text-gray-400">Block {blockNumber}</span>
          </div>
          <Select defaultValue={channel}>
            <SelectTrigger className="w-32 text-white">
              <SelectValue placeholder="Channel" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem
                value="email"
                className="text-white hover:bg-gray-700"
              >
                Email
              </SelectItem>
              <SelectItem
                value="slack"
                className="text-white hover:bg-gray-700"
              >
                Slack
              </SelectItem>
              <SelectItem
                value="teams"
                className="text-white hover:bg-gray-700"
              >
                Teams
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sources Section */}
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-400">Sources</div>
          <div className="p-3 bg-gray-800 rounded-lg flex flex-wrap gap-2">
            {sources.map((source, index) => (
              <Badge key={index} variant="secondary">
                {source}
              </Badge>
            ))}
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Objective Column */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-400">Objective</div>
            <div className="p-3 bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-200">{objective}</p>
            </div>
          </div>

          {/* Thread Column */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-400">Thread</div>
            <div className="h-[300px] overflow-y-auto pr-2 space-y-3">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-2 ${
                    message.type === "incoming" ? "" : "justify-end"
                  }`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.type === "incoming"
                        ? "bg-gray-800 text-white"
                        : "bg-blue-600/20 text-blue-200"
                    } p-3 rounded-lg`}
                  >
                    {message.type === "incoming" ? (
                      <ArrowDownLeft className="h-4 w-4 mt-1 text-green-400" />
                    ) : (
                      <ArrowUpRight className="h-4 w-4 mt-1 text-blue-400" />
                    )}
                    <p className="text-sm">{message.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Output Variable */}
        {outputVariable && (
          <div className="pt-4 border-t border-gray-800">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <span>Output saved as:</span>
              <code className="px-2 py-1 bg-gray-800 rounded text-blue-400">
                {outputVariable.name}
              </code>
              {!isProcessing && outputVariable.value && (
                <span className="text-gray-500">= {outputVariable.value}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ShareableConversingAgentBlock;
