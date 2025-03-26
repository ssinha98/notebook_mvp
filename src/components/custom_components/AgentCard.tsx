import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";

interface AgentCardProps {
  agentId: string;
  agentName: string;
  description: string;
  tags: string[];
}

export default function AgentCard({
  agentId,
  agentName,
  description,
  tags,
}: AgentCardProps) {
  const router = useRouter();

  const handleViewAgent = () => {
    router.push(`/sharedAgent?agentId=${agentId}`);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-[280px] flex flex-col">
      {/* Card Content */}
      <div className="flex-grow">
        <h3 className="text-lg font-semibold text-white mb-2">{agentName}</h3>
        <p className="text-gray-400 text-sm mb-4">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* View Agent Button */}
      <div className="flex justify-end mt-4">
        <Button
          variant="default"
          onClick={handleViewAgent}
          className="bg-blue-600/80 hover:bg-blue-700/90"
        >
          View Agent
        </Button>
      </div>
    </div>
  );
}
