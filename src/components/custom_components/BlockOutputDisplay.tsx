import { ShareableBlock } from "@/types/shareable_blocks";
import { useEffect, useState } from "react";

const BLOCK_OUTPUT_CONFIGS = {
  agent: {
    emoji: "🤖",
    label: "Agent Response",
  },
  searchagent: {
    emoji: "🔍",
    label: "Search Results",
  },
  checkin: {
    emoji: "✋",
    label: "Check-in Point",
  },
  contact: {
    emoji: "📧",
    label: "Message Status",
  },
  webagent: {
    emoji: "🌐",
    label: "Web Analysis",
  },
  code: {
    emoji: "👩‍💻",
    label: "Code Output",
  },
  make: {
    emoji: "⚙️",
    label: "Automation Result",
  },
  excel: {
    emoji: "📊",
    label: "Spreadsheet Data",
  },
  instagramagent: {
    emoji: "📸",
    label: "Instagram Analysis",
  },
};

interface BlockOutputDisplayProps {
  block: ShareableBlock;
  isOpen: boolean;
}

export default function BlockOutputDisplay({
  block,
  isOpen,
}: BlockOutputDisplayProps) {
  if (!isOpen) return null;

  const config = BLOCK_OUTPUT_CONFIGS[
    block.type as keyof typeof BLOCK_OUTPUT_CONFIGS
  ] || {
    emoji: "📄",
    label: "Output",
  };

  return (
    <div className="flex flex-col items-center justify-start w-full">
      <div className="text-6xl mb-6">{config.emoji}</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-8">
        {config.label}
      </h3>
      <div className="w-full whitespace-pre-wrap text-gray-600 bg-gray-50 rounded-lg p-6">
        {block.output || "No output available"}
      </div>
      <div className="text-sm text-gray-400 italic mt-4">
        Block {block.blockNumber} • {block.type}
      </div>
    </div>
  );
}
