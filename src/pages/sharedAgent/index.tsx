import { useRouter } from "next/router";
import { useState, useEffect, useCallback } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { PlayIcon, StopIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import { Share2, Mail, Clock } from "lucide-react";
import {
  ArrowLeftIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { MinusOutlined } from "@ant-design/icons";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import ShareableAgentBlock from "@/components/custom_components/shareable_blocks/ShareableAgentBlock";
import ShareableWebBlock from "@/components/custom_components/shareable_blocks/ShareableWebBlock";
import ShareableContactBlock from "@/components/custom_components/shareable_blocks/ShareableContactBlock";
import ShareableCheckinBlock from "@/components/custom_components/shareable_blocks/ShareableCheckinBlock";
import { toast } from "sonner";
import ShareableExcelAgent from "@/components/custom_components/shareable_blocks/ShareableExcelAgent";
import ShareableCodeBlock from "@/components/custom_components/shareable_blocks/ShareableCodeBlock";
import ShareableMakeBlock from "@/components/custom_components/shareable_blocks/ShareableMakeBlock";
import ShareableInstagramAgent from "@/components/custom_components/shareable_blocks/ShareableInstagramAgent";
import {
  ShareableInstagramBlock,
  SimulatedApiBlockType,
  SimulatedEmailBlockType,
} from "@/types/shareable_blocks";
import ShareableSearchBlock from "@/components/custom_components/shareable_blocks/ShareableSearchBlock";
import { Switch } from "@/components/ui/switch";
import BlockTypeDisplay from "@/components/custom_components/BlockTypeDisplay";
import RateAgentRun from "@/components/custom_components/RateAgentRun";
import ShareablePowerpointBlock from "@/components/custom_components/shareable_blocks/ShareablePowerpointBlock";
import { ShareableDocDiffBlock } from "@/components/custom_components/shareable_blocks/ShareableDocDiff";
import { ShareableDocDiffBlock as ShareableDocDiffBlockType } from "../../types/shareable_blocks";
import { ShareableDocAnnotatorBlock as ShareableDocAnnotatorBlockType } from "../../types/shareable_blocks";
import ShareableDocAnnotatorBlock from "@/components/custom_components/shareable_blocks/ShareableDocAnnotator";
import { MdOutlineEmail } from "react-icons/md";
import { TbApi } from "react-icons/tb";
import SimulatedEmailBlock from "@/components/custom_components/shareable_blocks/SimulatedEmailBlock";
import SimulatedApiBlock from "@/components/custom_components/shareable_blocks/SimulatedApiBlock";
// Change these imports
import type { ShareableDataVizBlock as ShareableDataVizBlockType } from "@/types/shareable_blocks";
import ShareableDataVizBlock from "@/components/ShareableDataVizBlock";
import WebAgentViewer from "@/components/custom_components/WebAgentViewer";
import { SHAREABLE_AGENTS } from "../../data/shared_agents";
import ShareableWebScraperBlock from "@/components/custom_components/shareable_blocks/ShareableWebScraperBlock";
import type { ShareableWebScraperBlock as ShareableWebScraperBlockType } from "@/types/shareable_blocks";

// Enum for run states
enum RunState {
  NOT_STARTED = "NOT_STARTED",
  RUNNING = "RUNNING",
  COMPLETED = "COMPLETED",
}

// Update block interfaces
interface BaseShareableBlock {
  id: string;
  blockNumber: number;
  type: string;
  output?: string;
  outputVariable?: {
    name: string;
    value?: string; // This will store the output when the block is run
  };
}

interface ShareableAgentBlock extends BaseShareableBlock {
  type: "agent";
  systemPrompt?: string;
  userPrompt: string;
  attachedFile?: {
    name: string;
    type: string;
    url: string;
    content: string;
  };
}

interface ShareableContactBlock extends BaseShareableBlock {
  type: "contact";
  to: string;
  subject: string;
  body: string;
}

interface ShareableWebBlock extends BaseShareableBlock {
  type: "webagent";
  url: string;
  nickname: string;
}

interface ShareableCheckinBlock extends BaseShareableBlock {
  type: "checkin";
}

interface ShareableCodeBlock extends BaseShareableBlock {
  type: "codeblock";
  language: string;
  code: string;
}

interface ShareableMakeBlock extends BaseShareableBlock {
  type: "make";
  webhookUrl: string;
  parameters: { key: string; value: string }[];
}

interface ShareableExcelBlock extends BaseShareableBlock {
  type: "excelagent";
  userPrompt: string;
}

interface ShareableSearchBlock extends BaseShareableBlock {
  type: "searchagent";
  engine: "search" | "news" | "finance" | "markets" | "image";
  query: string;
  limit: number;
  topic?: string;
  section?: string;
  timeWindow?: string;
  trend?: string;
  prompt?: string;
  region?: string;
  imageResults?: {
    url: string;
    title: string;
    analysisResult?: string;
  }[];
}

interface ShareablePowerpointBlock extends BaseShareableBlock {
  type: "powerpoint";
  prompt: string;
  slides: number;
}

// Update the ShareableBlock type
export type ShareableBlock =
  | ShareableAgentBlock
  | ShareableContactBlock
  | ShareableWebBlock
  | ShareableCheckinBlock
  | ShareableCodeBlock
  | ShareableMakeBlock
  | ShareableExcelBlock
  | ShareableInstagramBlock
  | ShareableSearchBlock
  | ShareablePowerpointBlock
  | ShareableDocDiffBlockType
  | ShareableDocAnnotatorBlockType
  | SimulatedApiBlockType
  | SimulatedEmailBlockType
  | ShareableDataVizBlockType
  | ShareableWebScraperBlockType;

interface ShareableAgent {
  id: string;
  name: string;
  description: string;
  agentDescription: string;
  tags: string[];
  blocks: ShareableBlock[];
  start_method?: string;
  tools?: string[];
}

// Helper function within the same file
function getShareableAgentById(id: string): ShareableAgent | undefined {
  return SHAREABLE_AGENTS.find((agent: ShareableAgent) => agent.id === id);
}

// Update the interface to match our new Agent type
interface SharedAgentData extends ShareableAgent {}

export default function SharedAgentPage() {
  const router = useRouter();
  const { agentId } = router.query;

  const [agentData, setAgentData] = useState<SharedAgentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [runState, setRunState] = useState<RunState>(RunState.NOT_STARTED);
  const [processingBlockIndex, setProcessingBlockIndex] = useState<
    number | null
  >(null);
  const [completedBlocks, setCompletedBlocks] = useState<number[]>([]);
  const [thinkingEmoji, setThinkingEmoji] = useState("🤔");
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [currentBlock, setCurrentBlock] = useState<ShareableBlock | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(
    null
  );
  const [displaySwitchState, setDisplaySwitchState] = useState(false);

  const EmailStartMethod = () => {
    return (
      <div className="bg-gray-950 p-3 rounded-lg mb-6 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <MdOutlineEmail className="h-5 w-5 text-white" />
          <h3 className="text-white font-medium">Start Method: Email</h3>
        </div>
        <p className="text-gray-400 mb-3">
          This agent is triggered via receiving an email to the agent inbox.
          This simulates an agent run, that is kicked off upon receiving an
          email.
        </p>
        {/* gap-3 controls spacing between flex items (the text and button) */}
        <p className="text-gray-400 flex items-center gap-3">
          Tap
          {/* mx-1 adds margin on both sides of the button */}
          <button
            onClick={handleRunAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2 mx-1"
          >
            <span className="text-lg">▶</span>
            <span>Simulate Run</span>
            <span className="text-xs opacity-75 ml-1">⌘↵</span>
          </button>
          to kick off the agent.
        </p>
      </div>
    );
  };

  const APIStartMethod = () => {
    return (
      <div className="bg-gray-950 p-3 rounded-lg mb-6 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <TbApi className="h-5 w-5 text-white" />
          <h3 className="text-white font-medium">Start Method: API</h3>
        </div>
        <p className="text-gray-400 mb-3">
          This agent is triggered via an API call. This simulates an agent run,
          after receiving an API call.
        </p>
        {/* gap-3 controls spacing between flex items (the text and button) */}
        <p className="text-gray-400 flex items-center gap-3">
          Tap
          {/* mx-1 adds margin on both sides of the button */}
          <button
            onClick={handleRunAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2 mx-1"
          >
            <span className="text-lg">▶</span>
            <span>Simulate Run</span>
            <span className="text-xs opacity-75 ml-1">⌘↵</span>
          </button>
          to kick off the agent.
        </p>
      </div>
    );
  };

  const ScheduleStartMethod = () => {
    return (
      <div className="bg-gray-950 p-3 rounded-lg mb-6 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="h-5 w-5 text-white" />
          <h3 className="text-white font-medium">Start Method: Schedule</h3>
        </div>
        <p className="text-gray-400 mb-3">
          This agent is triggered on a schedule. This simulates an agent run,
          that is kicked off on a schedule.
        </p>
        {/* gap-3 controls spacing between flex items (the text and button) */}
        <p className="text-gray-400 flex items-center gap-3">
          Tap
          {/* mx-1 adds margin on both sides of the button */}
          <button
            onClick={handleRunAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2 mx-1"
          >
            <span className="text-lg">▶</span>
            <span>Simulate Run</span>
            <span className="text-xs opacity-75 ml-1">⌘↵</span>
          </button>
          to kick off the agent.
        </p>
      </div>
    );
  };

  const ManualStartMethod = () => {
    return (
      <div className="bg-gray-950 p-3 rounded-lg mb-6 border border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <PlayIcon className="h-5 w-5 text-white" />
          <h3 className="text-white font-medium">Start Method: Manual</h3>
        </div>
        <p className="text-gray-400 mb-3">
          This agent is triggered manually by clicking the run button.
        </p>
        {/* gap-3 controls spacing between flex items (the text and button) */}
        <p className="text-gray-400 flex items-center gap-3">
          Tap
          {/* mx-1 adds margin on both sides of the button */}
          <button
            onClick={handleRunAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors inline-flex items-center gap-2 mx-1"
          >
            <span className="text-lg">▶</span>
            <span>Run</span>
            <span className="text-xs opacity-75 ml-1">⌘↵</span>
          </button>
          to kick off the agent.
        </p>
      </div>
    );
  };

  const cycleEmoji = useCallback(() => {
    const emojis = ["🤔", "🧠", "💭"];
    setThinkingEmoji((prev) => {
      const currentIndex = emojis.indexOf(prev);
      return emojis[(currentIndex + 1) % emojis.length];
    });
  }, []);

  const processBlocks = async () => {
    setRunState(RunState.RUNNING);
    setCompletedBlocks([]);
    setIsProcessing(true);

    for (let i = 0; i < agentData!.blocks.length; i++) {
      setProcessingBlockIndex(i);
      setCurrentBlock(agentData!.blocks[i]);

      // Start emoji cycling
      const emojiInterval = setInterval(cycleEmoji, 500);

      // Custom wait time for webscraper blocks
      let waitTime = 3000; // default 3 seconds
      const block = agentData!.blocks[i];
      if (block.type === "webscraper" && Array.isArray(block.webBlocks)) {
        waitTime = block.webBlocks.length * 4000; // 4 seconds per web block
      }

      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Stop emoji cycling and show output
      clearInterval(emojiInterval);
      setCompletedBlocks((prev) => [...prev, i]);

      // If this is the last block, mark as completed
      if (i === agentData!.blocks.length - 1) {
        setRunState(RunState.COMPLETED);
        setProcessingBlockIndex(null);
        setIsProcessing(false);
      }
    }
  };

  const handleRunAgent = () => {
    if (!agentData) return;
    setRunState(RunState.RUNNING);
    processBlocks();
    if (agentData.blocks.length > 0) {
      setCurrentBlock(agentData.blocks[0]);
      setIsPanelOpen(true);
    }
  };

  const handleStopAgent = () => {
    setRunState(RunState.COMPLETED);
    // TODO: Implement agent stopping logic
  };

  const handleBack = () => {
    router.push("/agentStore");
  };

  const handleShare = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    toast("Link to agent copied!", {
      action: {
        label: "Close",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const handleGetInTouch = () => {
    window.location.href = "mailto:sahil@lytix.co";
  };

  const handleClosePanel = () => {
    console.log("Closing panel...");
    console.log("Before:", { isPanelOpen, currentBlock, runState });
    setIsPanelOpen(false);
    setCurrentBlock(null);
    setRunState(RunState.COMPLETED);
    console.log("After:", {
      isPanelOpen: false,
      currentBlock: null,
      runState: RunState.COMPLETED,
    });
  };

  // Add effect to track panel state changes
  useEffect(() => {
    console.log("Panel state changed:", { isPanelOpen });
  }, [isPanelOpen]);

  // Add effect to close panel when switching to edit mode
  useEffect(() => {
    if (isEditMode && isPanelOpen) {
      handleClosePanel();
    }
  }, [isEditMode]);

  // Dynamic footer content based on run state
  const renderFooterContent = () => {
    const buttonText =
      agentData?.start_method &&
      ["api", "email", "schedule"].includes(agentData.start_method)
        ? "Simulate Run"
        : "Run";

    switch (runState) {
      case RunState.NOT_STARTED:
        return (
          <div className="flex justify-end items-center w-full max-w-screen-xl mx-auto px-4">
            <Button
              onClick={handleRunAgent}
              className="bg-blue-600/80 hover:bg-blue-700/90"
            >
              <PlayIcon className="h-5 w-5 mr-2" />
              {buttonText} ⌘⏎
            </Button>
          </div>
        );
      case RunState.RUNNING:
        return (
          <div className="flex justify-center items-center w-full max-w-screen-xl mx-auto px-4">
            <div className="text-gray-400">Running...</div>
          </div>
        );
      case RunState.COMPLETED:
        return (
          <div className="grid grid-cols-3 gap-4 w-full max-w-screen-xl mx-auto px-4">
            <div className="flex justify-center">
              <Button
                onClick={handleShare}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Share agent
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleRunAgent}
                variant="outline"
                className="border-gray-700 hover:bg-gray-800"
              >
                <PlayIcon className="h-5 w-5 mr-2" />
                {buttonText} ⌘⏎
              </Button>
            </div>
            <div className="flex justify-center">
              <Button
                onClick={handleGetInTouch}
                className="bg-blue-600/80 hover:bg-blue-700/90"
              >
                <Mail className="h-5 w-5 mr-2" />
                Get in touch!
              </Button>
            </div>
          </div>
        );
    }
  };

  const renderBlock = (block: ShareableBlock) => {
    const isProcessing = processingBlockIndex === block.blockNumber - 1;
    const isCompleted = completedBlocks.includes(block.blockNumber - 1);

    const commonProps = {
      blockNumber: block.blockNumber,
      isCompleted,
      output: isCompleted ? block.output : undefined, // Only pass output if block is completed
      outputVariable: block.outputVariable,
      isProcessing,
      thinkingEmoji: isProcessing ? thinkingEmoji : undefined,
    };

    const renderBlockContent = () => {
      switch (block.type) {
        case "agent":
          return (
            <ShareableAgentBlock
              {...commonProps}
              userPrompt={block.userPrompt}
              attachedFile={block.attachedFile}
            />
          );
        case "webagent":
          return (
            <ShareableWebBlock
              {...commonProps}
              url={block.url}
              nickname={block.nickname}
            />
          );
        case "contact":
          return (
            <ShareableContactBlock
              {...commonProps}
              to={block.to}
              subject={block.subject}
              body={block.body}
            />
          );
        case "checkin":
          return <ShareableCheckinBlock {...commonProps} />;
        case "instagramagent":
          return (
            <ShareableInstagramAgent
              {...commonProps}
              url={block.url}
              postCount={block.postCount}
            />
          );
        case "searchagent":
          return (
            <ShareableSearchBlock
              {...commonProps}
              engine={block.engine}
              query={block.query}
              limit={block.limit}
              topic={block.topic}
              section={block.section}
              timeWindow={block.timeWindow}
              prompt={block.prompt}
              trend={block.trend}
              region={block.region}
              imageResults={block.imageResults}
            />
          );
        case "make":
          return (
            <ShareableMakeBlock
              {...commonProps}
              webhookUrl={block.webhookUrl}
              parameters={block.parameters}
            />
          );
        case "powerpoint":
          return (
            <ShareablePowerpointBlock
              {...commonProps}
              prompt={block.prompt}
              slides={block.slides}
            />
          );
        case "excelagent":
          return (
            <ShareableExcelAgent
              {...commonProps}
              userPrompt={block.userPrompt}
            />
          );
        case "codeblock":
          return (
            <ShareableCodeBlock
              {...commonProps}
              language={block.language}
              code={block.code}
            />
          );
        case "docdiff":
          return (
            <ShareableDocDiffBlock
              {...commonProps}
              id={block.id}
              type={block.type}
              input_prompt={block.input_prompt}
              document_diffs={block.document_diffs}
              isProcessing={isProcessing}
            />
          );
        case "docannotator":
          return (
            <ShareableDocAnnotatorBlock
              {...commonProps}
              sourceName={block.sourceName}
              sourceLink={block.sourceLink}
              prompt={block.prompt}
              annotatedDocLink={block.annotatedDocLink}
              extractedChunks={block.extractedChunks}
            />
          );
        case "simulatedemail":
          return (
            <SimulatedEmailBlock
              {...commonProps}
              from={block.from}
              subject={block.subject}
              body={block.body}
              attachments={block.attachments}
              isRunning={runState === RunState.RUNNING}
            />
          );
        case "simulatedapi":
          return (
            <SimulatedApiBlock
              {...commonProps}
              endpoint={block.endpoint}
              method={block.method}
              headers={block.headers}
              body={block.body}
              isRunning={runState === RunState.RUNNING}
            />
          );
        case "dataviz":
          return (
            <ShareableDataVizBlock
              {...commonProps}
              id={block.id}
              type={block.type}
              chosenChart={block.chosenChart}
              source={block.source}
              context={block.context}
              pointers={block.pointers}
              isProcessing={isProcessing}
              isCompleted={isCompleted}
              thinkingEmoji={isProcessing ? thinkingEmoji : undefined}
              output={isCompleted ? block.output : undefined}
            />
          );
        case "webscraper":
          return (
            <ShareableWebScraperBlock
              {...commonProps}
              webBlocks={block.webBlocks}
              isRunning={isProcessing}
              usableInputs={block.usableInputs}
              // isRunning={runState === RunState.RUNNING}
              startingUrl={block.startingUrl}
              prompt={block.prompt}
            />
          );
        default:
          return null;
      }
    };

    return <div className="relative">{renderBlockContent()}</div>;
  };

  useEffect(() => {
    if (agentId && typeof agentId === "string") {
      setIsLoading(true);
      const agent = getShareableAgentById(agentId);
      if (agent) {
        setAgentData(agent);
      }
      setIsLoading(false);
    }
  }, [agentId]);

  const handleRateAgent = (isPositive: boolean) => {
    console.log("Agent rated:", isPositive);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (runState === RunState.COMPLETED) {
      interval = setInterval(() => {
        setDisplaySwitchState((prev) => !prev);
      }, 3000); // Toggle every 3 seconds
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [runState]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-400">Loading...</div>
        </div>
      </PublicLayout>
    );
  }

  if (!agentData) {
    return (
      <PublicLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-gray-400">Agent not found</div>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-900 border-b border-gray-700">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBack}
                  className="text-gray-400 hover:text-white"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold text-white">
                  {agentData.name}
                </h1>
                <button
                  onClick={() => setShowInfoDialog(true)}
                  className="text-gray-400 hover:text-white"
                >
                  <InformationCircleIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                  <span
                    className={`text-sm ${!isEditMode ? "text-white" : "text-gray-400"}`}
                  >
                    View
                  </span>
                  <Switch
                    checked={isEditMode}
                    onCheckedChange={setIsEditMode}
                    className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-600 h-6 w-11 [&>span]:h-5 [&>span]:w-5 [&>span]:bg-white"
                  />
                  <span
                    className={`text-sm ${isEditMode ? "text-white" : "text-gray-400"}`}
                  >
                    Edit
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add our new edit mode box here */}
        {isEditMode && (
          <div className="fixed right-4 top-32 bg-white border border-gray-200 rounded-lg p-4 shadow-sm w-64 z-20">
            <div className="flex flex-col items-center text-center">
              <LockClosedIcon className="h-6 w-6 text-gray-800 mb-2" />
              <p className="text-sm text-gray-800 mb-4">
                Edit mode is locked for shared agents
              </p>
              <a
                href="https://usesolari.ai/"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 transition-colors inline-block"
              >
                Log in
              </a>
            </div>
          </div>
        )}

        {/* Main container with flex layout */}
        <div className="flex flex-grow">
          {/* Main Content */}
          <main
            className={`transition-all duration-300 px-4 py-6 ${
              isPanelOpen && !isEditMode ? "w-1/2" : "w-full"
            }`}
          >
            <div className="space-y-6">
              <p className="text-gray-400 mb-6">{agentData.description}</p>
              {(() => {
                const startMethod = agentData.start_method || "manual";
                switch (startMethod) {
                  case "email":
                    return <EmailStartMethod />;
                  case "api":
                    return <APIStartMethod />;
                  case "schedule":
                    return <ScheduleStartMethod />;
                  default:
                    return <ManualStartMethod />;
                }
              })()}
              {isEditMode ? (
                // In edit mode, show all blocks with their outputs
                agentData.blocks.map((block, index) => (
                  <div key={block.id} className="space-y-4">
                    {renderBlock(block)}
                    {completedBlocks.includes(index) && block.output && (
                      <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                        {block.type === "powerpoint" ? (
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span>
                              Your presentation is ready! View it at:{" "}
                            </span>
                            <a
                              href={block.output}
                              className="text-blue-500 underline hover:text-blue-400"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {block.output}
                            </a>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-300 whitespace-pre-wrap">
                            {block.output}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <>
                  {agentData.blocks.length > 0 &&
                    renderBlock(agentData.blocks[0])}
                  {agentData.blocks.length > 1 && (
                    <div className="text-gray-400 text-sm mt-4 text-center">
                      and {agentData.blocks.length - 1} more blocks
                    </div>
                  )}
                </>
              )}
            </div>
          </main>

          {/* Side Panel - Only show if not in edit mode */}
          {isPanelOpen && !isEditMode && (
            <div className="w-1/2 bg-white border-l border-gray-200 overflow-y-auto h-screen">
              <div className="p-4 relative max-w-full">
                <button
                  className="absolute top-4 right-4 cursor-pointer text-black hover:text-gray-700 p-2 bg-gray-100 rounded-full z-50 hover:bg-gray-200"
                  onClick={(e) => {
                    console.log("Minimize button clicked");
                    e.preventDefault();
                    handleClosePanel();
                  }}
                  style={{ zIndex: 50 }}
                >
                  <MinusOutlined style={{ fontSize: "24px" }} />
                </button>
                <div className="mt-12 max-w-full overflow-x-auto">
                  {currentBlock ? (
                    <div className="flex-grow flex flex-col items-center justify-center max-w-full">
                      {/* Block content container */}
                      <div className="w-full overflow-x-auto mb-8">
                        {renderBlock(currentBlock)}
                      </div>

                      {/* Show output if block is completed */}
                      {completedBlocks.includes(currentBlock.blockNumber - 1) &&
                        currentBlock.output && (
                          <div className="w-full mb-16 p-4 bg-gray-100 rounded-lg border border-gray-200">
                            {currentBlock.type === "powerpoint" ? (
                              <div className="flex items-center gap-2 text-sm text-gray-700">
                                <span>
                                  Your presentation is ready! View it at:{" "}
                                </span>
                                <a
                                  href={currentBlock.output}
                                  className="text-blue-600 underline hover:text-blue-500"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {currentBlock.output}
                                </a>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                {currentBlock.output}
                              </p>
                            )}
                          </div>
                        )}

                      {/* Show either loading indicator or rating component based on run state */}
                      {runState === RunState.COMPLETED ? (
                        <RateAgentRun onRate={handleRateAgent} />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center mt-8">
                          <div className="text-6xl mb-6">⌛</div>
                          <div className="text-xl text-gray-400 mb-3">
                            Running...
                          </div>
                          <div className="text-sm text-gray-500">
                            Current block: {currentBlock.type}{" "}
                            {currentBlock.blockNumber}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-grow flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-6xl mb-4">⏳</div>
                        <div className="text-xl text-gray-700">
                          Waiting to start...
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 py-4">
          <div className="container mx-auto px-4">{renderFooterContent()}</div>
        </div>
      </div>
    </PublicLayout>
  );
}
