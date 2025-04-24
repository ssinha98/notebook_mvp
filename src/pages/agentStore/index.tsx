import PublicLayout from "@/components/PublicLayout";
import AgentCard from "@/components/custom_components/AgentCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useState } from "react";
import ComingSoonCard from "@/components/custom_components/ComingSoonCard";
import { SHAREABLE_AGENTS } from "../sharedAgent";
import {
  FiSettings, // Admin
  FiFileText, // Content
  FiBarChart2, // Data Analysis
  FiDollarSign, // Finance
  FiTrendingUp, // Marketing
  FiClipboard, // Project Management
  FiShoppingCart, // Sales
  FiUsers, // HR
  FiShare2, // Social Media
  FiCode, // API
  FiImage, // Image Search
  FiGrid, // All
} from "react-icons/fi";
import { AiOutlineStock } from "react-icons/ai";
import { TbWriting } from "react-icons/tb";
import { RiAdvertisementLine } from "react-icons/ri";

// Updated tags list with "All" at the beginning
const TAGS = [
  "All",
  "Admin",
  "Content",
  "Data Analysis",
  "Finance",
  "Marketing",
  "Project Management",
  "Sales",
  "HR",
  "Social Media",
  "API",
  "Image Search",
  "Document Handling",
];

// Add this after your TAGS and AGENTS constants
const TAG_SUBTITLES: { [key: string]: string } = {
  All: "",
  Admin: "Streamline your administrative tasks with intelligent automation",
  Content: "Create engaging content with AI-powered assistance",
  "Data Analysis": "Transform raw data into actionable insights",
  Finance: "Optimize financial operations and analysis",
  Marketing: "Enhance your marketing strategies with AI",
  "Project Management": "Keep your projects on track with smart automation",
  Sales: "Boost your sales performance with AI assistance",
  HR: "Automate hiring, onboarding, and employee engagement tasks",
  "Social Media": "Manage and grow your online presence with ease",
  Analytics: "Track, measure, and visualize performance at every level",
  Email: "Automate inbox management, replies, and outreach",
  API: "Connect and interact with APIs programmatically",
  "Image Search": "Find, analyze, and sort images using AI",
  // "Document Handling": "Summarize, analyze, and extract info from documents",
};

// Add icon mapping
const TAG_ICONS: { [key: string]: React.ReactNode } = {
  All: <FiGrid className="h-4 w-4" />,
  Admin: <FiSettings className="h-4 w-4" />,
  Content: <TbWriting className="h-4 w-4" />,
  "Data Analysis": <FiBarChart2 className="h-4 w-4" />,
  Finance: <AiOutlineStock className="h-4 w-4" />,
  Marketing: <RiAdvertisementLine className="h-4 w-4" />,
  "Project Management": <FiClipboard className="h-4 w-4" />,
  Sales: <FiShoppingCart className="h-4 w-4" />,
  HR: <FiUsers className="h-4 w-4" />,
  "Social Media": <FiShare2 className="h-4 w-4" />,
  API: <FiCode className="h-4 w-4" />,
  "Image Search": <FiImage className="h-4 w-4" />,
  "Document Handling": <FiFileText className="h-4 w-4" />,
};

// Use the same color mapping from AgentCard
const TAG_COLORS: { [key: string]: string } = {
  All: "bg-gray-600",
  Admin: "bg-red-600/80",
  Content: "bg-blue-600/80",
  "Data Analysis": "bg-green-600/80",
  Finance: "bg-purple-600/80",
  Marketing: "bg-pink-600/80",
  "Project Management": "bg-yellow-400/80",
  Sales: "bg-indigo-600/80",
  HR: "bg-orange-600/80",
  "Social Media": "bg-cyan-600/80",
  API: "bg-rose-600/80",
  "Image Search": "bg-teal-600/80",
  "Document Handling": "bg-amber-600/80",
};

export default function AgentStorePage() {
  // Initialize with "All" selected
  const [selectedTag, setSelectedTag] = useState<string>("All");

  const handleTagClick = (tag: string) => {
    console.log("Selected tag:", tag);
    setSelectedTag(tag);
  };

  const handleClearTag = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation();
    setSelectedTag("All"); // Reset to "All" instead of null
    console.log("Cleared tag:", tag);
  };

  // Update filter logic to show all agents when "All" is selected
  const filteredAgents =
    selectedTag === "All"
      ? SHAREABLE_AGENTS
      : SHAREABLE_AGENTS.filter((agent) =>
          agent.tags.some(
            (tag) => tag.toLowerCase() === selectedTag.toLowerCase()
          )
        );

  return (
    <PublicLayout>
      <div className="container mx-auto p-6 h-screen flex flex-col">
        {/* Title and Subtitle - not sticky */}
        <div className="text-center mb-8 flex-shrink-0">
          <h1 className="text-3xl font-bold text-white mb-2">Agent Store</h1>
          <p className="text-gray-400 text-lg">
            Pre-configured agents for your inspiration
          </p>
        </div>

        {/* Sticky container for filters and subtitle */}
        <div className="sticky top-0 z-10 flex-shrink-0">
          {/* Tags ScrollBar */}
          <div className="bg-transparent backdrop-blur-sm pb-4">
            <ScrollArea className="w-full whitespace-nowrap rounded-md">
              <div className="flex w-max space-x-3 p-4">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`
                      shrink-0
                      px-4 py-2 rounded-full 
                      flex items-center gap-2
                      transition-colors whitespace-nowrap
                      ${tag === "All" ? "mr-2" : ""}
                      ${
                        selectedTag === tag
                          ? `${TAG_COLORS[tag] || "bg-gray-600"} text-white`
                          : "bg-blue-600/80 text-white opacity-80 hover:opacity-100"
                      }
                    `}
                  >
                    {selectedTag === tag && (
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {TAG_ICONS[tag]}
                    {tag}
                    {selectedTag === tag && tag !== "All" && (
                      <svg
                        className="h-4 w-4 hover:text-gray-300 cursor-pointer"
                        fill="none"
                        strokeWidth="2"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        onClick={(e) => handleClearTag(e, tag)}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>

          {/* Dynamic Subtitle - also sticky */}
          <div className="bg-transparent backdrop-blur-sm py-4 border-t border-gray-800/50">
            <div className="flex justify-between items-center">
              <p className="text-gray-300 text-sm">
                {TAG_SUBTITLES[selectedTag]}
              </p>
              <p className="text-gray-400 text-sm">
                {filteredAgents.length} agent
                {filteredAgents.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Agents Grid - scrollable */}
        <ScrollArea className="flex-grow -mx-6 px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 pt-4">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agentId={agent.id}
                agentName={agent.name}
                description={agent.description}
                tags={agent.tags}
                startMethod={agent.start_method}
                blocks={agent.blocks}
              />
            ))}

            {/* Coming Soon Card - always appears last */}
            {filteredAgents.length > 0 && <ComingSoonCard />}
          </div>

          {/* No results message */}
          {filteredAgents.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No agents found with the selected tag.
            </div>
          )}
        </ScrollArea>
      </div>
    </PublicLayout>
  );
}
