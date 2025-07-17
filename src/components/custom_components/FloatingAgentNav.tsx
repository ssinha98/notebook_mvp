import React, { useState, useRef } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useSourceStore } from "@/lib/store";
import { Block } from "@/types/types";
import { ScrollArea } from "@/components/ui/scroll-area";

// BlockCard component (inline)
interface BlockCardProps {
  block: Block;
  onClick: () => void;
}

const BlockCard: React.FC<BlockCardProps> = ({ block, onClick }) => {
  // Simple emoji mapping - we can expand this as needed
  const getBlockEmoji = (type: Block["type"]) => {
    switch (type) {
      case "agent":
        return "🤖";
      case "searchagent":
        return "🔍";
      case "checkin":
        return "✋";
      case "contact":
        return "📧";
      case "webagent":
        return "🌐";
      case "codeblock":
        return "💻";
      case "make":
        return "🔗";
      case "excelagent":
        return "📊";
      case "instagramagent":
        return "📷";
      case "deepresearchagent":
        return "🔬";
      case "pipedriveagent":
        return "📈";
      case "datavizagent":
        return "📈";
      case "clickupagent":
        return "📋";
      case "googledriveagent":
        return "☁️";
      case "apolloagent":
        return "👤";
      default:
        return "📦";
    }
  };

  return (
    <div
      className="p-2 mb-2 bg-gray-800 rounded border border-gray-600 cursor-pointer hover:bg-gray-700 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">{getBlockEmoji(block.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="text-white font-medium truncate">{block.name}</div>
          <div className="text-gray-400 text-sm capitalize">
            {block.type.replace("agent", " agent")}
          </div>
        </div>
      </div>
    </div>
  );
};

interface FloatingAgentNavProps {
  agentId: string;
  blockRefs: React.MutableRefObject<{
    [blockId: string]: HTMLDivElement | null;
  }>;
  isExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}

const FloatingAgentNav: React.FC<FloatingAgentNavProps> = ({
  agentId,
  blockRefs,
  isExpanded: externalIsExpanded,
  onExpandedChange,
}) => {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false);
  const blocks = useSourceStore((state) => state.blocks);

  // Use external state if provided, otherwise use internal state
  const isExpanded =
    externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;
  const setIsExpanded = (expanded: boolean) => {
    if (onExpandedChange) {
      onExpandedChange(expanded);
    } else {
      setInternalIsExpanded(expanded);
    }
  };

  const handleBlockClick = (blockId: string) => {
    // console.log("🔍 Clicked block ID:", blockId);

    const element = blockRefs.current[blockId];
    if (element) {
      // console.log("🔍 Found element via ref, scrolling...");
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      // console.log("❌ Element not found in refs for block:", blockId);
      // console.log("Available refs:", Object.keys(blockRefs.current));
    }
  };

  const handleSectionClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="fixed bottom-[140px] left-4 z-50">
      <div className="bg-gray-900 border border-gray-600 rounded-lg shadow-lg">
        {/* Header */}
        <div
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800 transition-colors rounded-t-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span className="text-white font-medium">Navigation</span>
          {isExpanded ? (
            <ChevronUp className="text-gray-400 h-4 w-4" />
          ) : (
            <ChevronDown className="text-gray-400 h-4 w-4" />
          )}
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-3 border-t border-gray-600">
            {/* Workflow and Tools Section */}
            <div className="mb-4">
              <div
                className="text-white font-bold underline mb-2 cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSectionClick("workflow-and-tools")}
              >
                Workflow and Tools
              </div>
              <ScrollArea className="h-48 w-64 rounded-md">
                <div className="ml-4 space-y-1 pr-4">
                  {blocks.map((block) => {
                    // console.log(
                    //   "🧭 FloatingAgentNav blocks:",
                    //   blocks.map((b) => ({ id: b.id, name: b.name }))
                    // );
                    // console.log("Nav block id:", block.id);
                    return (
                      <BlockCard
                        key={block.id}
                        block={block}
                        onClick={() => handleBlockClick(block.id)}
                      />
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Output Editor Section */}
            <div>
              <div
                className="text-white font-bold underline cursor-pointer hover:text-gray-300 transition-colors"
                onClick={() => handleSectionClick("output-editor")}
              >
                Output Editor
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingAgentNav;
