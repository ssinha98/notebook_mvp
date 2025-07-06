import React, { useState, CSSProperties, forwardRef } from "react";
import {
  ExpandAltOutlined,
  ShrinkOutlined,
  MinusOutlined,
  PauseCircleOutlined,
  CloseOutlined,
  PauseOutlined,
} from "@ant-design/icons";
import AgentBlock from "./AgentBlock";
import {
  ExcelAgentBlock,
  Variable,
  ClickUpAgentBlock,
  GoogleDriveAgentBlock,
} from "@/types/types";
import { AgentBlockRef } from "./AgentBlock";
import TransformBlock from "./TransformBlock";
import { useSourceStore } from "@/lib/store";
import ContactBlock from "./ContactBlock";
import CheckInBlock from "./CheckInBlock";
import SearchAgent from "./SearchAgent";
import { SearchAgentRef } from "./SearchAgent";
import { SourceInfo, Block } from "@/types/types";
import { ContactBlockRef } from "./ContactBlock";
import WebAgent from "./WebAgent";
import CodeBlock from "./CodeBlock";
import MakeBlock from "./MakeBlock";
import ExcelAgent from "./ExcelAgent";
import InstagramAgent from "./InstagramAgent";
import { Button } from "@/components/ui/button";
import BlockTypeDisplay from "./BlockTypeDisplay";
import RateAgentRun from "./RateAgentRun";
import DeepResearchAgent from "./DeepResearchAgent";
import PipedriveAgent from "./PipedriveAgent";
import DataVizAgent, { DataVizAgentRef } from "./DataVizAgent";
import ClickUpAgent from "./ClickUpAgent";
import GoogleDriveAgent from "./GoogleDriveAgent";
import { useVariableStore } from "@/lib/variableStore";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import SortableBlock from "./SortableBlock";

interface CollapsibleBoxProps {
  title: string;
  style?: React.CSSProperties;
  isExpandedByDefault?: boolean;
  children?: React.ReactNode;
  variables?: Variable[];
  agentId?: string;
  onAddVariable?: (variable: Variable) => void;
  onOpenTools?: () => void;
  isEditMode?: boolean;
  isRunning?: boolean;
  onSavePrompts: (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string,
    saveAsCsv: boolean,
    sourceInfo?: SourceInfo,
    outputVariable?: {
      id: string;
      name: string;
      type: "input" | "intermediate";
    } | null
  ) => void;
  blockRefs?: React.MutableRefObject<{
    [key: number]:
      | AgentBlockRef
      | SearchAgentRef
      | ContactBlockRef
      | DataVizAgentRef;
  }>;
  onDeleteBlock?: (blockNumber: number) => void;
  onContinue?: () => void;
  onStop?: () => void;
  isProcessing?: boolean;
  onMinimize?: () => void;
  currentBlock?: Block | null;
  isRunComplete?: boolean;
}

const CollapsibleBox = forwardRef<
  AgentBlockRef | SearchAgentRef,
  CollapsibleBoxProps
>((props, ref) => {
  const blocks = useSourceStore((state) => state.blocks);
  const updateBlock = useSourceStore((state) => state.updateBlock);
  const addBlockToNotebook = useSourceStore(
    (state) => state.addBlockToNotebook
  );
  const deleteBlock = useSourceStore((state) => state.deleteBlock);
  const nextBlockNumber = useSourceStore((state) => state.nextBlockNumber);
  const [processingBlocks, setProcessingBlocks] = useState<{
    [key: number]: boolean;
  }>({});
  const [hasRated, setHasRated] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = blocks.findIndex((block) => block.id === active.id);
      const newIndex = blocks.findIndex((block) => block.id === over?.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderBlocks = useSourceStore.getState().reorderBlocks;
        reorderBlocks(oldIndex, newIndex);
      }
    }
  };

  const addNewBlock = (
    blockType:
      | "agent"
      | "checkin"
      | "searchagent"
      | "codeblock"
      | "make"
      | "deepresearchagent"
      | "pipedriveagent"
      | "datavizagent"
      | "clickupagent"
  ) => {
    const baseBlock = {
      blockNumber: nextBlockNumber,
      systemPrompt: "",
      userPrompt: "",
      id: crypto.randomUUID(),
      name: `Block ${nextBlockNumber}`,
      saveAsCsv: false,
      agentId: props.agentId as string,
      status: "tbd" as "tbd" | "approved",
    };

    const block = {
      ...baseBlock,
      type: blockType,
      ...(blockType === "codeblock" && {
        language: "python",
        code: "",
        variables: [],
      }),
      ...(blockType === "make" && { webhookUrl: "", parameters: [] }),
    } as Block;

    addBlockToNotebook(block);
  };

  const handleProcessingChange = (
    blockNumber: number,
    isProcessing: boolean
  ) => {
    setProcessingBlocks((prev) => ({
      ...prev,
      [blockNumber]: isProcessing,
    }));
  };

  const boxStyle: CSSProperties = {
    border: "1px solid #4a4a4a",
    borderRadius: "8px",
    padding: "16px",
    position: "relative",
    transition: "all 0.3s ease",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    ...props.style,
  };

  const contentStyle: CSSProperties = {
    overflow: "auto",
    flex: 1,
    position: "relative",
  };

  const fabStyle: CSSProperties = {
    position: "absolute",
    bottom: "16px",
    right: "16px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    backgroundColor: "#1a90ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    transition: "background-color 0.3s ease",
    color: "white",
    fontSize: "24px",
    border: "none",
    zIndex: 10,
  };

  const blockContainerStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px", // This adds padding between blocks
  };

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case "transform":
        return (
          <TransformBlock
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            originalFilePath={block.originalFilePath || ""}
            sourceName={block.sourceName || ""}
            fileType={block.fileType || "csv"}
            transformations={{
              filterCriteria: block.transformations?.filterCriteria || [],
              columns: block.transformations?.columns || [],
              previewData: block.transformations?.previewData || [],
            }}
            onTransformationsUpdate={(updates) =>
              updateBlock(block.blockNumber, updates)
            }
            onDeleteBlock={(blockNumber) => {
              deleteBlock(blockNumber);
              props.onDeleteBlock?.(blockNumber);
            }}
          />
        );
      case "checkin":
        return (
          <CheckInBlock
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            agentId={props.agentId || ""}
            onDeleteBlock={(blockNumber) => {
              deleteBlock(blockNumber);
              props.onDeleteBlock?.(blockNumber);
            }}
            variables={props.variables || []}
            editedVariableNames={[]}
            onContinue={props.onContinue}
            onStop={props.onStop}
            isProcessing={props.isProcessing}
          />
        );
      case "searchagent":
        return (
          <SearchAgent
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={(blockNumber) => {
              deleteBlock(blockNumber);
              props.onDeleteBlock?.(blockNumber);
            }}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            variables={props.variables || []}
            onAddVariable={props.onAddVariable || (() => {})}
            ref={(el) => {
              if (el && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = el;
              }
            }}
            isProcessing={processingBlocks[block.blockNumber] || false}
            onProcessingChange={(isProcessing) =>
              handleProcessingChange(block.blockNumber, isProcessing)
            }
            initialQuery={block.query}
            initialEngine={block.engine}
            initialLimit={block.limit}
            initialTopic={block.topic}
            initialSection={block.section}
            initialTimeWindow={block.timeWindow}
            initialTrend={block.trend}
            initialRegion={block.region}
            initialOutputVariable={block.outputVariable}
            onOpenTools={props.onOpenTools}
          />
        );
      case "agent":
        return (
          <AgentBlock
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            variables={props.variables || []}
            initialOutputVariable={block.outputVariable}
            onAddVariable={props.onAddVariable || (() => {})}
            onOpenTools={props.onOpenTools}
            onSavePrompts={(
              blockNumber,
              systemPrompt,
              userPrompt,
              saveAsCsv,
              sourceInfo,
              outputVariable
            ) => {
              updateBlock(block.blockNumber, {
                ...block,
                systemPrompt,
                userPrompt,
                saveAsCsv,
                sourceInfo,
                outputVariable: outputVariable,
                type: "agent",
                agentId: props.agentId || "",
              });
            }}
            ref={(el) => {
              if (el && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = el;
              }
            }}
            isProcessing={processingBlocks[block.blockNumber] || false}
            onProcessingChange={(isProcessing) =>
              handleProcessingChange(block.blockNumber, isProcessing)
            }
            onProcessedPrompts={(system, user) => {
              console.log(`Block ${block.blockNumber} processed:`, {
                system,
                user,
              });
            }}
            onDeleteBlock={(blockNumber) => {
              deleteBlock(blockNumber);
              props.onDeleteBlock?.(blockNumber);
            }}
            initialSystemPrompt={block.systemPrompt || ""}
            initialUserPrompt={block.userPrompt || ""}
            initialSaveAsCsv={block.saveAsCsv || false}
          />
        );
      case "contact":
        return (
          <ContactBlock
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onSave={(values) => {
              updateBlock(block.blockNumber, {
                ...values,
                type: "contact",
                agentId: props.agentId || "",
                systemPrompt: "",
                userPrompt: "",
                saveAsCsv: false,
              });
            }}
            initialChannel={block.channel}
            initialRecipient={block.recipient}
            initialSubject={block.subject}
            initialBody={block.body}
            isProcessing={processingBlocks[block.blockNumber] || false}
            onProcessingChange={(isProcessing) =>
              handleProcessingChange(block.blockNumber, isProcessing)
            }
          />
        );
      case "webagent":
        return (
          <WebAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            onAddVariable={props.onAddVariable || (() => {})}
            onOpenTools={props.onOpenTools}
            initialUrl={block.url}
            initialPrompt={block.prompt}
            initialSelectedVariableId={block.selectedVariableId}
            initialOutputVariable={block.outputVariable}
          />
        );
      case "codeblock":
        return (
          <CodeBlock
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber: number, updates: any) => {
              updateBlock(blockNumber, updates);
            }}
            onAddVariable={props.onAddVariable || (() => {})}
            onOpenTools={props.onOpenTools}
            initialLanguage={block.language}
            initialCode={block.code}
            initialOutputVariable={
              block.outputVariable
                ? {
                    id: block.outputVariable.id,
                    name: block.outputVariable.name,
                    type:
                      block.outputVariable.type === "table"
                        ? "intermediate"
                        : block.outputVariable.type,
                  }
                : null
            }
            initialStatus={block.status}
          />
        );
      case "make":
        return (
          <MakeBlock
            onAddVariable={props.onAddVariable || (() => {})}
            variables={props.variables || []}
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            initialWebhookUrl={block.webhookUrl}
            initialParameters={block.parameters}
            onOpenTools={props.onOpenTools}
          />
        );
      case "excelagent":
        return (
          <ExcelAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(
              blockNumber: number,
              updates: Partial<ExcelAgentBlock>
            ) => {
              updateBlock(blockNumber, updates);
            }}
            initialPrompt={block.prompt}
            isProcessing={processingBlocks[block.blockNumber] || false}
            onOpenTools={props.onOpenTools}
            onProcessingChange={(isProcessing) =>
              handleProcessingChange(block.blockNumber, isProcessing)
            }
            initialOutputVariable={block.outputVariable}
          />
        );
      case "instagramagent":
        return (
          <InstagramAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            variables={props.variables || []}
            onAddVariable={props.onAddVariable || (() => {})}
            onOpenTools={props.onOpenTools}
            isProcessing={processingBlocks[block.blockNumber] || false}
            onProcessingChange={(isProcessing) =>
              handleProcessingChange(block.blockNumber, isProcessing)
            }
            initialUrl={block.url}
            initialPostCount={block.postCount}
          />
        );
      case "deepresearchagent":
        return (
          <DeepResearchAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            initialTopic={block.topic}
            isProcessing={processingBlocks[block.blockNumber] || false}
            onOpenTools={props.onOpenTools}
            initialSearchEngine={block.searchEngine}
            initialOutputVariable={block.outputVariable}
          />
        );
      case "pipedriveagent":
        return (
          <PipedriveAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            initialPrompt={block.prompt}
            isProcessing={processingBlocks[block.blockNumber] || false}
          />
        );
      case "datavizagent":
        return (
          <DataVizAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            initialPrompt={block.prompt}
            initialChartType={block.chartType}
            isProcessing={processingBlocks[block.blockNumber] || false}
            onProcessingChange={(isProcessing) =>
              handleProcessingChange(block.blockNumber, isProcessing)
            }
            onOpenTools={props.onOpenTools}
          />
        );
      case "clickupagent":
        return (
          <ClickUpAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            initialPrompt={(block as ClickUpAgentBlock).prompt}
            isProcessing={processingBlocks[block.blockNumber] || false}
          />
        );
      case "googledriveagent":
        return (
          <GoogleDriveAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={block.blockNumber}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlock(blockNumber, updates);
            }}
            initialPrompt={(block as GoogleDriveAgentBlock).prompt}
            isProcessing={processingBlocks[block.blockNumber] || false}
          />
        );
      default:
        return null;
    }
  };

  const handleButtonClick = () => {
    if (hasRated) {
      props.onMinimize?.();
    } else if (props.onStop) {
      props.onStop();
    }
  };

  const handleRatingSubmit = () => {
    setHasRated(true);
  };

  return (
    <div className="flex w-full gap-4">
      <div
        style={{
          ...boxStyle,
          width: props.isRunning && !props.isEditMode ? "50%" : "100%",
          transition: "width 0.3s ease-in-out",
        }}
      >
        <div className="font-bold text-lg mb-2">
          {!props.isEditMode && (
            <div className="text-xl mb-4 text-blue-500">Start Flow</div>
          )}
          {props.title}
        </div>
        <div style={contentStyle}>
          {props.title === "Agent Flow" ? (
            <>
              <div style={blockContainerStyle}>
                {props.isEditMode ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={blocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {blocks.map((block) => (
                        <SortableBlock key={block.id} block={block}>
                          {renderBlock(block)}
                        </SortableBlock>
                      ))}
                    </SortableContext>
                  </DndContext>
                ) : (
                  <>
                    {blocks.length > 0 && renderBlock(blocks[0])}
                    {blocks.length > 1 && (
                      <div className="text-gray-400 text-sm mt-4 italic">
                        and {blocks.length - 1} more block
                        {blocks.length > 2 ? "s" : ""}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            props.children
          )}
        </div>
      </div>

      {/* Side Panel */}
      {props.isRunning && !props.isEditMode && (
        <div
          className="w-1/2 bg-white rounded-lg shadow-lg fixed right-0 h-screen"
          style={{
            animation: "slideIn 0.3s ease-in-out",
            top: "72px",
            height: "calc(100vh - 72px)",
          }}
        >
          <style jsx>{`
            @keyframes slideIn {
              from {
                transform: translateX(100%);
                opacity: 0;
              }
              to {
                transform: translateX(0);
                opacity: 1;
              }
            }
          `}</style>
          <div
            className="absolute top-6 right-6 cursor-pointer text-black hover:text-gray-700 p-2 bg-gray-100 rounded-full"
            onClick={() => props.onMinimize?.()}
          >
            <MinusOutlined style={{ fontSize: "24px" }} />
          </div>
          <div className="text-black p-6 flex flex-col h-full">
            {props.currentBlock ? (
              <div className="flex-grow flex items-center justify-center">
                {props.isRunComplete ? (
                  <RateAgentRun onRate={handleRatingSubmit} />
                ) : (
                  <BlockTypeDisplay
                    blockType={props.currentBlock.type}
                    blockNumber={props.currentBlock.blockNumber}
                  />
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

            {/* Pause/Close Button */}
            <Button
              className="w-full bg-[#09CE6B] hover:bg-[#07b55d] text-white rounded-lg py-6 mt-4 text-lg font-medium"
              onClick={handleButtonClick}
            >
              {hasRated ? (
                <>
                  <CloseOutlined className="mr-2 text-xl" />
                  Close
                </>
              ) : (
                <>
                  <PauseOutlined className="mr-2 text-xl" />
                  Pause & Edit
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

// Add display name
CollapsibleBox.displayName = "CollapsibleBox";

export default CollapsibleBox;
