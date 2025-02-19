import React, { useState, CSSProperties, forwardRef } from "react";
import { ExpandAltOutlined, ShrinkOutlined } from "@ant-design/icons";
import AgentBlock from "./AgentBlock";
import { Variable } from "@/types/types";
import { AgentBlockRef } from "./AgentBlock";
import TransformBlock from "./TransformBlock";
import { useSourceStore } from "@/lib/store";

interface CollapsibleBoxProps {
  title: string;
  style?: React.CSSProperties;
  isExpandedByDefault?: boolean;
  children?: React.ReactNode;
  variables?: Variable[];
  onAddVariable?: (variable: Variable) => void;
  onOpenTools?: () => void;
  onSavePrompts: (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string
  ) => void;
  blockRefs?: React.MutableRefObject<{ [key: number]: AgentBlockRef }>;
  onDeleteBlock?: (blockNumber: number) => void;
}

const CollapsibleBox = forwardRef<AgentBlockRef, CollapsibleBoxProps>(
  (props, ref) => {
    const [isMaximized, setIsMaximized] = useState(
      props.isExpandedByDefault || false
    );
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

    const addNewBlock = () => {
      addBlockToNotebook({
        type: "agent",
        blockNumber: nextBlockNumber,
        systemPrompt: "",
        userPrompt: "",
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
      height: isMaximized ? "auto" : "120px",
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

    return (
      <div style={boxStyle}>
        <div className="font-bold text-lg mb-2">{props.title}</div>
        <div
          className="absolute top-4 right-4 cursor-pointer"
          onClick={() => setIsMaximized(!isMaximized)}
        >
          {isMaximized ? <ShrinkOutlined /> : <ExpandAltOutlined />}
        </div>
        <div style={contentStyle}>
          {props.title === "Agent Flow" ? (
            <>
              <div style={blockContainerStyle}>
                {blocks
                  .filter((block) => block.type === "transform")
                  .map((block) => (
                    <TransformBlock
                      key={block.blockNumber}
                      blockNumber={block.blockNumber}
                      originalFilePath={block.originalFilePath || ""}
                      sourceName={block.sourceName || ""}
                      fileType={block.fileType || "csv"}
                      transformations={{
                        filterCriteria:
                          block.transformations?.filterCriteria || [],
                        columns: block.transformations?.columns || [],
                        previewData: block.transformations?.previewData || [],
                      }}
                      onTransformationsUpdate={(updates) =>
                        updateBlock(block.blockNumber, updates)
                      }
                    />
                  ))}

                {blocks
                  .filter((block) => block.type === "agent")
                  .map((block) => (
                    <AgentBlock
                      key={block.blockNumber}
                      blockNumber={block.blockNumber}
                      variables={props.variables || []}
                      onAddVariable={props.onAddVariable || (() => {})}
                      onOpenTools={props.onOpenTools}
                      onSavePrompts={props.onSavePrompts}
                      ref={(el) => {
                        if (el && props.blockRefs) {
                          props.blockRefs.current[block.blockNumber] = el;
                        }
                      }}
                      isProcessing={
                        processingBlocks[block.blockNumber] || false
                      }
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
                  ))}
              </div>
              <button
                style={fabStyle}
                className="hover:bg-blue-500"
                onClick={addNewBlock}
              >
                +
              </button>
            </>
          ) : (
            props.children
          )}
        </div>
      </div>
    );
  }
);

// Add display name
CollapsibleBox.displayName = "CollapsibleBox";

export default CollapsibleBox;
