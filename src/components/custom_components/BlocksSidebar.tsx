import React, { useState } from "react";
import { Block, Variable } from "../../types/types";
import { ChevronRight, Play, Table } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogCancel,
} from "../ui/alert-dialog";
import CollapsibleBox from "./CollapsibleBox";
// Import the store
import { useSourceStore } from "@/lib/store";
// Add imports for all block components
import WebAgent from "./WebAgent";
import SearchAgent from "./SearchAgent";
import AgentBlock from "./AgentBlock";
import TransformBlock from "./TransformBlock";
import CheckInBlock from "./CheckInBlock";
import ContactBlock from "./ContactBlock";
import CodeBlock from "./CodeBlock";
import MakeBlock from "./MakeBlock";
import ExcelAgent from "./ExcelAgent";
import InstagramAgent from "./InstagramAgent";
import DeepResearchAgent from "./DeepResearchAgent";
import PipedriveAgent from "./PipedriveAgent";
import DataVizAgent from "./DataVizAgent";
import ClickUpAgent from "./ClickUpAgent";
import GoogleDriveAgent from "./GoogleDriveAgent";
import ApolloAgent from "./ApolloAgent";
import TableTransformBlock from "./TableTransformBlock";

interface BlocksSidebarProps {
  blocks: Block[];
  selectedData: any[];
  selectedColumn?: string;
  onBlockExecute: (block: Block, params: any) => Promise<void>;
  className?: string;
  currentBlock?: Block | null;
  isRunning?: boolean;
  variables?: Variable[];
  onAddVariable?: (variable: Variable) => void;
  onOpenTools?: () => void;
  agentId?: string;
}

const BlocksSidebar: React.FC<BlocksSidebarProps> = ({
  blocks,
  selectedData,
  selectedColumn,
  onBlockExecute,
  className,
  currentBlock,
  isRunning,
  variables,
  onAddVariable,
  onOpenTools,
  agentId,
}) => {
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleBlockClick = (block: Block) => {
    setSelectedBlock(block);
    setIsDialogOpen(true);
  };

  const handleExecute = async (block: Block) => {
    console.log("1. handleExecute called with block:", block);

    const params = {
      useSelection: selectedData.length > 0,
      selectedData,
      selectedColumn,
    };
    console.log("2. Execution params:", params);

    try {
      console.log("3. About to call onBlockExecute");
      await onBlockExecute(block, params);
      console.log("4. onBlockExecute completed");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error in handleExecute:", error);
    }
  };

  const getBlockIcon = (block: Block) => {
    if (block.outputVariable?.type === "table") {
      return <Table className="w-4 h-4" />;
    }
    return <ChevronRight className="w-4 h-4" />;
  };

  const renderBlockContent = (block: Block) => {
    const commonProps = {
      blockNumber: block.blockNumber,
      onDeleteBlock: () => {},
      onCopyBlock: () => {},
      variables: variables || [],
      onAddVariable: onAddVariable || (() => {}),
      onOpenTools: onOpenTools,
      onUpdateBlock: (blockNumber: number, updates: any) => {},
    };

    switch (block.type) {
      case "transform":
        return (
          <TransformBlock
            {...commonProps}
            originalFilePath={block.originalFilePath || ""}
            sourceName={block.sourceName || ""}
            fileType={block.fileType || "csv"}
            transformations={{
              filterCriteria: block.transformations?.filterCriteria || [],
              columns: block.transformations?.columns || [],
              previewData: block.transformations?.previewData || [],
            }}
            onTransformationsUpdate={() => {}}
          />
        );

      case "agent":
        return (
          <AgentBlock
            {...commonProps}
            initialOutputVariable={block.outputVariable}
            initialSystemPrompt={block.systemPrompt || ""}
            initialUserPrompt={block.userPrompt || ""}
            initialSaveAsCsv={block.saveAsCsv || false}
            onSavePrompts={() => {}}
            isProcessing={false}
            onProcessingChange={() => {}}
          />
        );

      case "checkin":
        return (
          <CheckInBlock
            {...commonProps}
            agentId={agentId || ""}
            editedVariableNames={[]}
          />
        );

      case "searchagent":
        return (
          <SearchAgent
            {...commonProps}
            initialQuery={block.query}
            initialEngine={block.engine}
            initialLimit={block.limit}
            initialTopic={block.topic}
            initialSection={block.section}
            initialTimeWindow={block.timeWindow}
            initialTrend={block.trend}
            initialRegion={block.region}
            initialOutputVariable={block.outputVariable}
          />
        );

      case "contact":
        return (
          <ContactBlock
            {...commonProps}
            initialChannel={block.channel}
            initialRecipient={block.recipient}
            initialSubject={block.subject}
            initialBody={block.body}
            isProcessing={false}
            onProcessingChange={() => {}}
            onSave={() => {}}
          />
        );

      case "webagent":
        return (
          <WebAgent
            {...commonProps}
            initialUrl={block.url}
            initialPrompt={block.prompt}
            initialSelectedVariableId={block.selectedVariableId}
            initialOutputVariable={block.outputVariable}
          />
        );

      case "codeblock":
        return (
          <CodeBlock
            {...commonProps}
            initialLanguage={block.language}
            initialCode={block.code}
            initialOutputVariable={block.outputVariable}
            initialStatus={block.status}
          />
        );

      case "make":
        return (
          <MakeBlock
            {...commonProps}
            initialWebhookUrl={block.webhookUrl}
            initialParameters={block.parameters}
          />
        );

      case "excelagent":
        return (
          <ExcelAgent
            {...commonProps}
            initialPrompt={block.prompt}
            initialOutputVariable={block.outputVariable}
          />
        );

      case "instagramagent":
        return (
          <InstagramAgent
            {...commonProps}
            initialUrl={block.url}
            initialPostCount={block.postCount}
          />
        );

      case "deepresearchagent":
        return (
          <DeepResearchAgent
            {...commonProps}
            initialTopic={block.topic}
            initialSearchEngine={block.searchEngine}
            initialOutputVariable={block.outputVariable}
            blockId={block.id}
            agentId={block.agentId}
          />
        );

      case "pipedriveagent":
        return <PipedriveAgent {...commonProps} initialPrompt={block.prompt} />;

      case "datavizagent":
        return (
          <DataVizAgent
            {...commonProps}
            initialPrompt={block.prompt}
            initialChartType={block.chartType}
          />
        );

      case "clickupagent":
        return <ClickUpAgent {...commonProps} initialPrompt={block.prompt} />;

      case "googledriveagent":
        return (
          <GoogleDriveAgent {...commonProps} initialPrompt={block.prompt} />
        );

      case "apolloagent":
        return (
          <ApolloAgent
            {...commonProps}
            initialFullName={block.fullName}
            initialFirstName={block.firstName}
            initialLastName={block.lastName}
            initialCompany={block.company}
            initialPrompt={block.prompt}
            initialOutputVariable={block.outputVariable}
          />
        );

      case "tabletransform":
        return (
          <TableTransformBlock
            {...commonProps}
            block={block}
            onBlockUpdate={(updatedBlock) => {}}
          />
        );
    }
  };

  return (
    <>
      <div className={`flex flex-col h-full ${className}`}>
        {/* Sidebar list of blocks - unchanged */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="text-sm font-medium text-gray-400">Blocks</div>
          {selectedData.length > 0 && (
            <div className="text-xs text-gray-500">
              {selectedData.length} items selected
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-2">
            {blocks.map((block) => (
              <button
                key={block.id}
                onClick={() => handleBlockClick(block)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg 
                  transition-colors text-left
                  ${
                    currentBlock?.id === block.id
                      ? "bg-gray-700 hover:bg-gray-600"
                      : "bg-gray-800 hover:bg-gray-700"
                  }
                `}
              >
                {getBlockIcon(block)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-200 truncate">
                    {block.name || `${block.type}_${block.blockNumber}`}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">
                    {block.type}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-4xl bg-gray-900">
          {selectedBlock && renderBlockContent(selectedBlock)}

          <div className="flex justify-end gap-2 mt-6">
            <AlertDialogCancel className="bg-gray-800 text-white hover:bg-gray-700">
              Cancel
            </AlertDialogCancel>

            {selectedData.length > 0 && (
              <button
                onClick={() => {
                  console.log("0. Run on @selection button clicked");
                  if (selectedBlock) {
                    handleExecute(selectedBlock);
                  } else {
                    console.warn("No block selected");
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
              >
                <span>Run on @selection</span>
                <span className="text-xs bg-blue-700 px-2 py-0.5 rounded-full">
                  {selectedData.length} rows
                </span>
              </button>
            )}
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BlocksSidebar;
