import Layout from "@/components/Layout";
import { SessionHandler } from "@/components/custom_components/SessionHandler";
import AgentCard from "@/components/custom_components/AgentCard";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline"; // Make sure to install @heroicons/react
import { useState } from "react";
import ComingSoonCard from "@/components/custom_components/ComingSoonCard";
import { SHAREABLE_AGENTS } from "../sharedAgent";

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
    <Layout>
      <SessionHandler />
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
          <div className="bg-black/90 backdrop-blur-sm pb-4">
            <div className="overflow-x-auto">
              <div className="flex gap-3 pb-2 min-w-min">
                {TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`
                      px-4 py-2 rounded-full 
                      flex items-center gap-2
                      transition-colors whitespace-nowrap
                      ${tag === "All" ? "mr-2" : ""} // Add margin to separate "All" from other tags
                      ${
                        selectedTag === tag
                          ? "bg-blue-600/80 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
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
                    {tag}
                    {selectedTag === tag &&
                      tag !== "All" && ( // Don't show X for "All" tag
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
            </div>
          </div>

          {/* Dynamic Subtitle - also sticky */}
          <div className="bg-black/90 backdrop-blur-sm py-4 border-t border-gray-800/50">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agentId={agent.id}
                agentName={agent.name}
                description={agent.description}
                tags={agent.tags}
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
    </Layout>
  );
}
