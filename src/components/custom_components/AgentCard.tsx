import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { MdAlternateEmail, MdOutlineEmail } from "react-icons/md";
import { TbApi, TbMailUp } from "react-icons/tb";
import { Clock, PlayIcon, Wrench } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { LuBrainCircuit, LuFileDiff, LuSearchCode } from "react-icons/lu";
import { TbMailDown } from "react-icons/tb";
import {
  IoPlaySkipForwardCircle,
  IoSearchCircle,
  IoGlobeOutline,
  IoCodeSlash,
} from "react-icons/io5";
import Image from "next/image";
import { FaRegCirclePause } from "react-icons/fa6";
import { LiaHighlighterSolid } from "react-icons/lia";
import { PiChartScatterLight } from "react-icons/pi";
interface AgentCardProps {
  agentId: string;
  agentName: string;
  description: string;
  tags: string[];
  startMethod?: string;
  blocks: { type: string }[];
}

const TAG_COLORS: { [key: string]: string } = {
  All: "bg-blue-600/80",
  Admin: "bg-red-600/80",
  Content: "bg-blue-600/80",
  "Data Analysis": "bg-green-600/80",
  Finance: "bg-purple-600/80",
  Marketing: "bg-pink-600/80",
  "Project Management": "bg-yellow-400/80",
  Sales: "bg-indigo-600/80",
  HR: "bg-orange-600/80",
  "Social Media": "bg-cyan-600/80",
  Analytics: "bg-emerald-600/80",
  Email: "bg-violet-600/80",
  API: "bg-rose-600/80",
  "Image Search": "bg-teal-600/80",
  "Document Handling": "bg-amber-600/80",
};

// Random color options for undefined tags
const FALLBACK_COLORS = [
  "bg-lime-600/80",
  "bg-fuchsia-600/80",
  "bg-sky-600/80",
  "bg-emerald-600/80",
  "bg-slate-600/80",
];

// Add the icon mapping
const BLOCK_TYPE_ICONS: Record<string, React.ReactNode> = {
  agent: <LuBrainCircuit className="h-4 w-4 text-gray-300" />,
  contact: <TbMailUp className="h-4 w-4 text-gray-300" />,
  checkin: <FaRegCirclePause className="h-4 w-4 text-gray-300" />,
  search: <LuSearchCode className="h-4 w-4 text-gray-300" />,
  searchagent: <LuSearchCode className="h-4 w-4 text-gray-300" />,
  webagent: <IoGlobeOutline className="h-4 w-4 text-gray-300" />,
  codeblock: <IoCodeSlash className="h-4 w-4 text-gray-300" />,
  dataviz: <PiChartScatterLight className="h-4 w-4 text-gray-300" />,
  docdiff: <LuFileDiff className="h-4 w-4 text-gray-300" />,
  make: (
    <Image
      src="https://images.ctfassets.net/un655fb9wln6/3xu9WYYJyMScG7FKnuVd1V/c4072d425c64525ea94ae9b60093fbaa/Make-Icon-Circle-Purple.svg"
      alt="Make.com"
      width={16}
      height={16}
    />
  ),
  excelagent: (
    <Image
      src="https://cdn.worldvectorlogo.com/logos/microsoft-excel-2013.svg"
      alt="Excel"
      width={16}
      height={16}
    />
  ),
  // instagramagent: <div className="text-base text-gray-300">📸</div>,
  instagramagent: (
    <Image
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Instagram_icon.png/960px-Instagram_icon.png"
      alt="Excel"
      width={16}
      height={16}
    />
  ),
  simulatedemail: <TbMailDown className="h-4 w-4 text-gray-300" />,
  simulatedapi: <TbApi className="h-4 w-4 text-gray-300" />,
  powerpoint: (
    <Image
      src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.svg/826px-Microsoft_Office_PowerPoint_%282019%E2%80%93present%29.png"
      alt="Excel"
      width={16}
      height={16}
    />
  ),
  docannotator: <LiaHighlighterSolid className="h-4 w-4 text-gray-300" />,
};

// Add a mapping for tooltip content
const BLOCK_TYPE_TOOLTIPS: Record<string, string> = {
  agent: "AI Agent Block",
  contact: "Sends emails",
  checkin: "Checks in with a human",
  search: "Searches the web",
  searchagent: "Searches the web",
  webagent: "Scrapes the web",
  codeblock: "Runs code",
  make: "Integrates with Make.com",
  excelagent: "Create Excel Spreadsheets",
  instagramagent: "Pull and Analyse Instagram Data",
  simulatedemail: "Receives Emails",
  simulatedapi: "Receives API Calls",
  powerpoint: "Create PowerPoint Presentations",
  docannotator: "Annotate Documents",
  dataviz: "Create Data Visualisations",
};

export default function AgentCard({
  agentId,
  agentName,
  description,
  tags,
  startMethod,
  blocks,
}: AgentCardProps) {
  const router = useRouter();

  // Get unique block types
  const uniqueBlockTypes = Array.from(
    new Set(blocks.map((block) => block.type))
  );

  const getTagColor = (tag: string) => {
    if (tag in TAG_COLORS) {
      return TAG_COLORS[tag];
    }
    // Get a consistent random color for unknown tags
    const hashCode = tag.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return FALLBACK_COLORS[Math.abs(hashCode) % FALLBACK_COLORS.length];
  };

  const getStartMethodIcon = () => {
    const validStartMethod = startMethod as
      | "api"
      | "schedule"
      | "email"
      | "manual"
      | undefined;

    switch (validStartMethod) {
      case "email":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <MdAlternateEmail className="h-5 w-5 text-white" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This agent is triggered via email</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "api":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <TbApi className="h-5 w-5 text-white" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This agent is triggered via API call</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case "schedule":
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Clock className="h-5 w-5 text-white" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This agent runs on a schedule</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      default:
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <PlayIcon className="h-5 w-5 text-white" />
              </TooltipTrigger>
              <TooltipContent>
                <p>This agent is triggered manually</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
    }
  };

  const handleViewAgent = () => {
    router.push(`/sharedAgent?agentId=${agentId}`);
  };

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-800 h-[320px] flex flex-col">
      {/* Card Content */}
      <div className="flex-grow">
        <div className="flex items-center gap-2 mb-2">
          {getStartMethodIcon()}
          <h3 className="text-lg font-semibold text-white">{agentName}</h3>
        </div>
        <p className="text-gray-400 text-sm mb-4">{description}</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-full ${getTagColor(tag)} text-white`}
            >
              {tag}
            </span>
          ))}
        </div>
        {uniqueBlockTypes.length > 0 && (
          <Alert className="bg-gray-800 border-gray-700 p-0">
            <div className="p-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    <AlertTitle className="text-white">Tools</AlertTitle>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>The tools this agent uses</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <AlertDescription>
                <div className="flex flex-wrap gap-3 mt-2">
                  {uniqueBlockTypes.map((type, index) => (
                    <TooltipProvider key={index}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors">
                            {BLOCK_TYPE_ICONS[type] || (
                              <LuBrainCircuit className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{BLOCK_TYPE_TOOLTIPS[type] || type}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </AlertDescription>
            </div>
          </Alert>
        )}
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
