import React, { useState, useEffect, CSSProperties, forwardRef } from "react";
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
import GongAgent from "./GongAgent";
import JiraAgent from "./JiraAgent";
import SalesforceAgent from "./SalesforceAgent";
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
import ApolloAgent from "./ApolloAgent";
import { Upload } from "lucide-react";
import TableTransformBlock, {
  TableTransformBlockRef,
} from "./TableTransformBlock";
import { TableTransformBlock as TableTransformBlockType } from "@/types/types";
import { useAgentStore } from "@/lib/agentStore";
import { Lock } from "lucide-react";
import { toast } from "sonner"; // Add this import

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
  onSavePrompts?: (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string,
    saveAsCsv: boolean,
    sourceInfo?: SourceInfo,
    outputVariable?: {
      id: string;
      name: string;
      type: "input" | "intermediate" | "table";
      columnName?: string;
    } | null,
    containsPrimaryInput?: boolean,
    skip?: boolean,
    images?: { type: "base64"; data: string; mime_type: string }[]
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
  blockElementRefs?: React.MutableRefObject<{
    [blockId: string]: HTMLDivElement | null;
  }>;
  isViewOnly?: boolean; // Add this new prop
}

const CollapsibleBox = forwardRef<
  AgentBlockRef | SearchAgentRef,
  CollapsibleBoxProps
>((props, ref) => {
  const { currentAgent, updateBlockData, deleteBlock } = useAgentStore();
  const blocks = currentAgent?.blocks || [];
  const nextBlockNumber =
    blocks.length > 0 ? Math.max(...blocks.map((b) => b.blockNumber)) + 1 : 1;
  const [processingBlocks, setProcessingBlocks] = useState<{
    [key: number]: boolean;
  }>({});
  const [hasRated, setHasRated] = useState(false);
  // Start minimized if user is view-only, otherwise expanded
  const [isMinimized, setIsMinimized] = useState(false);

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
      | "gong"
      | "jira"
      | "salesforce"
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
      ...(blockType === "gong" && {
        prompt: "",
        endpoint: "/api/gong",
      }),
      ...(blockType === "jira" && {
        prompt: "search_for_issue",
        searchQuery: "",
        endpoint: "/api/jira",
      }),
      ...(blockType === "salesforce" && {
        prompt: "search_company_by_name",
        companyName: "",
        endpoint: "/api/salesforce",
      }),
      ...(blockType === "agent" && {
        imageMode: false, // Default to false, can be set to true for image analysis
        images: [],
      }),
    } as Block;

    if (!currentAgent) return;

    useAgentStore.getState().updateCurrentAgent({
      ...currentAgent,
      blocks: [...currentAgent.blocks, block],
    });
  };

  // Add new function to handle image analysis agents
  const addNewImageAnalysisAgent = () => {
    const baseBlock = {
      blockNumber: nextBlockNumber,
      systemPrompt:
        "You are a helpful assistant that analyzes images. Describe what you see in the provided images.",
      userPrompt: "What do you see in these images?",
      id: crypto.randomUUID(),
      name: `Image Analysis ${nextBlockNumber}`,
      saveAsCsv: false,
      agentId: props.agentId as string,
      status: "tbd" as "tbd" | "approved",
    };

    const block = {
      ...baseBlock,
      type: "agent" as const,
      imageMode: true,
      images: [],
    } as Block;

    if (!currentAgent) return;

    useAgentStore.getState().updateCurrentAgent({
      ...currentAgent,
      blocks: [...currentAgent.blocks, block],
    });
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

  const copyBlock = useSourceStore((state) => state.copyBlockAfter);

  const renderBlock = (block: Block) => {
    switch (block.type) {
      case "transform":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
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
                updateBlockData(block.blockNumber, updates)
              }
              onDeleteBlock={(blockNumber) => {
                deleteBlock(blockNumber);
                props.onDeleteBlock?.(blockNumber);
              }}
              onCopyBlock={copyBlock}
            />
          </div>
        );
      case "checkin":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <CheckInBlock
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              agentId={props.agentId || ""}
              onDeleteBlock={(blockNumber) => {
                deleteBlock(blockNumber);
                props.onDeleteBlock?.(blockNumber);
              }}
              onCopyBlock={copyBlock}
              variables={props.variables || []}
              editedVariableNames={[]}
              onContinue={props.onContinue}
              onStop={props.onStop}
              isProcessing={props.isProcessing}
            />
          </div>
        );
      case "searchagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <SearchAgent
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={(blockNumber) => {
                deleteBlock(blockNumber);
                props.onDeleteBlock?.(blockNumber);
              }}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
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
          </div>
        );
      case "agent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
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
                outputVariable,
                containsPrimaryInput,
                skip,
                images
              ) => {
                updateBlockData(block.blockNumber, {
                  ...block,
                  systemPrompt,
                  userPrompt,
                  saveAsCsv,
                  sourceInfo,
                  outputVariable,
                  containsPrimaryInput,
                  skip,
                  images,
                  imageMode: images && images.length > 0,
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
              onCopyBlock={copyBlock}
              initialSystemPrompt={block.systemPrompt || ""}
              initialUserPrompt={block.userPrompt || ""}
              initialSaveAsCsv={block.saveAsCsv || false}
              imageMode={block.imageMode}
              initialImages={block.images}
            />
          </div>
        );
      case "contact":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <ContactBlock
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onSave={(values) => {
                updateBlockData(block.blockNumber, {
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
          </div>
        );
      case "webagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <WebAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
              }}
              onAddVariable={props.onAddVariable || (() => {})}
              onOpenTools={props.onOpenTools}
              initialUrl={block.url}
              initialPrompt={block.prompt}
              initialSelectedVariableId={block.selectedVariableId}
              initialOutputVariable={block.outputVariable}
            />
          </div>
        );
      case "codeblock":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <CodeBlock
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber: number, updates: any) => {
                updateBlockData(blockNumber, updates);
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
          </div>
        );
      case "make":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
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
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
              }}
              initialWebhookUrl={block.webhookUrl}
              initialParameters={block.parameters}
              onOpenTools={props.onOpenTools}
            />
          </div>
        );
      case "excelagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <ExcelAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(
                blockNumber: number,
                updates: Partial<ExcelAgentBlock>
              ) => {
                updateBlockData(blockNumber, updates);
              }}
              initialPrompt={block.prompt}
              isProcessing={processingBlocks[block.blockNumber] || false}
              onOpenTools={props.onOpenTools}
              onProcessingChange={(isProcessing) =>
                handleProcessingChange(block.blockNumber, isProcessing)
              }
              initialOutputVariable={block.outputVariable}
            />
          </div>
        );
      case "instagramagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <InstagramAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
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
          </div>
        );
      case "deepresearchagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <DeepResearchAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
              }}
              initialTopic={block.topic}
              isProcessing={processingBlocks[block.blockNumber] || false}
              onOpenTools={props.onOpenTools}
              initialSearchEngine={block.searchEngine}
              initialOutputVariable={block.outputVariable}
              blockId={block.id}
              agentId={block.agentId}
            />
          </div>
        );
      case "pipedriveagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <PipedriveAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
              }}
              initialPrompt={block.prompt}
              isProcessing={processingBlocks[block.blockNumber] || false}
            />
          </div>
        );
      case "datavizagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <DataVizAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
              }}
              initialPrompt={block.prompt}
              initialChartType={block.chartType}
              isProcessing={processingBlocks[block.blockNumber] || false}
              onProcessingChange={(isProcessing) =>
                handleProcessingChange(block.blockNumber, isProcessing)
              }
              onOpenTools={props.onOpenTools}
            />
          </div>
        );
      case "clickupagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <ClickUpAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
              }}
              initialPrompt={(block as ClickUpAgentBlock).prompt}
              isProcessing={processingBlocks[block.blockNumber] || false}
            />
          </div>
        );
      case "googledriveagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <GoogleDriveAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates);
              }}
              initialPrompt={(block as GoogleDriveAgentBlock).prompt}
              isProcessing={processingBlocks[block.blockNumber] || false}
            />
          </div>
        );
      case "apolloagent":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <ApolloAgent
              ref={(ref) => {
                if (ref && props.blockRefs)
                  props.blockRefs.current[block.blockNumber] = ref;
              }}
              key={block.blockNumber}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={updateBlockData}
              initialFullName={block.fullName}
              initialFirstName={block.firstName}
              initialLastName={block.lastName}
              initialCompany={block.company}
              initialPrompt={block.prompt}
              initialOutputVariable={block.outputVariable}
              isProcessing={processingBlocks[block.blockNumber]}
            />
          </div>
        );
      case "tabletransform":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <TableTransformBlock
              ref={(el) => {
                if (el && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = el;
                }
              }}
              block={block as TableTransformBlockType}
              onBlockUpdate={(updatedBlock) =>
                updateBlockData(updatedBlock.blockNumber, updatedBlock)
              }
            />
          </div>
        );
      case "gong":
        return (
          <GongAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={`gong-${block.blockNumber}`}
            blockNumber={block.blockNumber}
            onDeleteBlock={deleteBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlockData(blockNumber, updates as Partial<Block>);
            }}
            initialPrompt={block.prompt}
            initialCallIds={block.callIds}
            initialOutputVariable={block.outputVariable}
            isProcessing={processingBlocks[block.blockNumber] || false}
          />
        );
      case "jira":
        return (
          <div
            ref={(el) => {
              if (props.blockElementRefs) {
                props.blockElementRefs.current[block.id] = el;
              }
            }}
          >
            <JiraAgent
              ref={(ref) => {
                if (ref && props.blockRefs) {
                  props.blockRefs.current[block.blockNumber] = ref;
                }
              }}
              key={`jira-${block.blockNumber}`}
              blockNumber={block.blockNumber}
              onDeleteBlock={deleteBlock}
              onCopyBlock={copyBlock}
              onUpdateBlock={(blockNumber, updates) => {
                updateBlockData(blockNumber, updates as Partial<Block>);
              }}
              initialOutputVariable={block.outputVariable}
              initialPrompt={block.prompt}
              isProcessing={processingBlocks[block.blockNumber] || false}
            />
          </div>
        );
      case "salesforce":
        return (
          <SalesforceAgent
            ref={(ref) => {
              if (ref && props.blockRefs) {
                props.blockRefs.current[block.blockNumber] = ref;
              }
            }}
            key={`salesforce-${block.blockNumber}`}
            blockNumber={block.blockNumber}
            onDeleteBlock={(blockNumber) => {
              deleteBlock(blockNumber);
              props.onDeleteBlock?.(blockNumber);
            }}
            onCopyBlock={copyBlock}
            onUpdateBlock={(blockNumber, updates) => {
              updateBlockData(blockNumber, updates as Partial<Block>);
            }}
            initialPrompt={block.prompt}
            initialCompanyName={block.companyName}
            initialOutputVariable={block.outputVariable}
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
          width: "100%",
          transition: "width 0.3s ease-in-out",
          position: "relative",
        }}
      >
        <div className="font-bold text-lg mb-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              {props.title}
              {isMinimized && blocks.length > 0 && (
                <span className="text-gray-400 text-sm ml-2">
                  ({blocks.length} block{blocks.length > 1 ? "s" : ""})
                </span>
              )}
            </div>
            {/* Add Upload Table button next to Output Editor title */}
            {props.title === "Output Editor" && props.onOpenTools && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={props.onOpenTools}
                  className="text-xs bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-300"
                >
                  <Upload className="h-3 w-3 mr-1" />
                  Upload Table as Variable
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Navigate to the output editor page
                    const currentUrl = window.location.href;
                    const agentIdMatch = currentUrl.match(/agentId=([^&]+)/);
                    if (agentIdMatch) {
                      const agentId = agentIdMatch[1];
                      window.location.href = `/output-editor/${agentId}`;
                    }
                  }}
                  className="text-xs bg-blue-600 hover:bg-blue-700 border-blue-600 text-white"
                >
                  Open Full Editor
                </Button>
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setIsMinimized(!isMinimized);
            }}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isMinimized ? <ExpandAltOutlined /> : <MinusOutlined />}
          </button>
        </div>
        {!isMinimized && (
          <div style={contentStyle}>
            {props.title === "Workflow and Tools" ? (
              <>
                <div style={blockContainerStyle}>
                  {/* ALWAYS SHOW EDIT MODE - COMMENTED OUT VIEW MODE CONDITION */}
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
                        <SortableBlock
                          key={block.id}
                          block={block}
                          isViewOnly={props.isViewOnly}
                        >
                          {renderBlock(block)}
                        </SortableBlock>
                      ))}
                    </SortableContext>
                  </DndContext>
                </div>
              </>
            ) : (
              props.children
            )}
          </div>
        )}
      </div>

      {/* COMMENTED OUT - SIDE PANEL (VIEW MODE ONLY) - will restore later if needed */}
    </div>
  );
});

// Add display name
CollapsibleBox.displayName = "CollapsibleBox";

export default CollapsibleBox;
