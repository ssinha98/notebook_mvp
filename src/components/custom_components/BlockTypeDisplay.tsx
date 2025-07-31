import { useEffect, useState } from "react";

// Easy to edit configuration for each block type
const BLOCK_TYPE_CONFIGS = {
  agent: {
    displays: [
      { emoji: "🤖", text: "Thinking..." },
      { emoji: "💭", text: "Processing your request" },
      { emoji: "🔄", text: "Working on it" },
    ],
  },
  searchagent: {
    displays: [
      { emoji: "🔍", text: "Searching..." },
      { emoji: "📊", text: "Analyzing results" },
      { emoji: "📝", text: "Compiling findings" },
    ],
  },
  checkin: {
    displays: [
      { emoji: "✋", text: "Pausing for review" },
      { emoji: "📬", text: "Waiting for input" },
      { emoji: "⏸️", text: "Check-in point" },
    ],
  },
  contact: {
    displays: [
      { emoji: "📧", text: "Preparing message" },
      { emoji: "✉️", text: "Setting up communication" },
      { emoji: "📨", text: "Getting ready to send" },
    ],
  },
  webagent: {
    displays: [
      { emoji: "🌐", text: "Browsing the web" },
      { emoji: "🔗", text: "Following links" },
      { emoji: "📱", text: "Scanning content" },
    ],
  },
  codeblock: {
    displays: [
      { emoji: "👩‍💻", text: "Writing code" },
      { emoji: "⚡", text: "Executing" },
      { emoji: "🔧", text: "Processing" },
    ],
  },
  make: {
    displays: [
      { emoji: "🔄", text: "Setting up automation" },
      { emoji: "⚙️", text: "Configuring webhook" },
      { emoji: "🎯", text: "Preparing integration" },
    ],
  },
  excelagent: {
    displays: [
      { emoji: "📊", text: "Processing spreadsheet" },
      { emoji: "🔢", text: "Crunching numbers" },
      { emoji: "📈", text: "Analyzing data" },
    ],
  },
  instagramagent: {
    displays: [
      { emoji: "📸", text: "Scanning Instagram" },
      { emoji: "🖼️", text: "Processing posts" },
      { emoji: "📱", text: "Analyzing content" },
    ],
  },
  transform: {
    displays: [
      { emoji: "🔄", text: "Transforming data" },
      { emoji: "⚡", text: "Converting format" },
      { emoji: "📊", text: "Processing" },
    ],
  },
  deepresearchagent: {
    displays: [
      { emoji: "🔍", text: "Researching..." },
      { emoji: "📚", text: "Analyzing sources" },
      { emoji: "📝", text: "Summarizing results" },
    ],
  },
  pipedriveagent: {
    displays: [
      { emoji: "📊", text: "Processing CRM data" },
      { emoji: "🔍", text: "Analyzing leads" },
      { emoji: "📝", text: "Generating insights" },
      { emoji: "🔍", text: "Analyzing leads" },
    ],
  },
  datavizagent: {
    displays: [
      { emoji: "📊", text: "Generating visualization..." },
      { emoji: "🎨", text: "Creating chart" },
      { emoji: "📈", text: "Processing data" },
    ],
  },
  clickupagent: {
    displays: [
      {
        emoji: "📋",
        text: "ClickUp Agent",
      },
    ],
  },
  googledriveagent: {
    displays: [
      {
        emoji: "📁", // Drive folder emoji
        text: "Google Drive Agent",
      },
    ],
  },
  apolloagent: {
    displays: [
      { emoji: "🧑‍🚀", text: "Enriching contact..." },
      { emoji: "🚀", text: "Calling Apollo API" },
      { emoji: "🔎", text: "Searching for info" },
    ],
  },
  tabletransform: {
    displays: [
      { emoji: "🔄", text: "Transform Table" },
      { emoji: "⚙️", text: "Processing..." },
      { emoji: "✅", text: "Transformed" },
      { emoji: "❌", text: "Error" },
    ],
  },
};

interface BlockTypeDisplayProps {
  blockType: keyof typeof BLOCK_TYPE_CONFIGS;
  blockNumber: number;
}

export default function BlockTypeDisplay({
  blockType,
  blockNumber,
}: BlockTypeDisplayProps) {
  const [displayIndex, setDisplayIndex] = useState(0);
  const config = BLOCK_TYPE_CONFIGS[blockType];

  useEffect(() => {
    // Reset index when block type changes
    setDisplayIndex(0);

    // Start cycling through displays
    const interval = setInterval(() => {
      setDisplayIndex((current) =>
        current === config.displays.length - 1 ? 0 : current + 1
      );
    }, 2000); // Change every 2 seconds

    return () => clearInterval(interval);
  }, [blockType]);

  if (!config) return null;

  const currentDisplay = config.displays[displayIndex];

  return (
    <div className="flex flex-col items-center justify-center text-center w-full relative">
      <div className="text-6xl mb-4 animate-bounce">{currentDisplay.emoji}</div>
      <div className="text-xl text-gray-700">{currentDisplay.text}</div>
      <div className="absolute bottom-0 left-0 text-sm text-gray-400 italic">
        {blockType} block {blockNumber}
      </div>
    </div>
  );
}
