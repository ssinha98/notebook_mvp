import React, { useState, CSSProperties, forwardRef } from "react";
import { ExpandAltOutlined, ShrinkOutlined } from "@ant-design/icons";
import AgentBlock from "./AgentBlock";
import { Variable } from "@/types/types";
import { AgentBlockRef } from './AgentBlock';

interface CollapsibleBoxProps {
  title: string;
  style?: React.CSSProperties;
  isExpandedByDefault?: boolean;
  children?: React.ReactNode;
  variables?: Variable[];
  onAddVariable?: (variable: Variable) => void;
  onOpenTools?: () => void;
  onSavePrompts: (blockNumber: number, systemPrompt: string, userPrompt: string) => void;
  blockRefs?: React.MutableRefObject<{ [key: number]: AgentBlockRef }>;
}

const CollapsibleBox = forwardRef<AgentBlockRef, CollapsibleBoxProps>((props, ref) => {
  const [isMaximized, setIsMaximized] = useState(props.isExpandedByDefault || false);
  const [blocks, setBlocks] = useState([1]);

  const addNewBlock = () => {
    setBlocks((currentBlocks) => [...currentBlocks, currentBlocks.length + 1]);
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
              {blocks.map((blockNumber) => (
                <AgentBlock
                  key={blockNumber}
                  blockNumber={blockNumber}
                  variables={props.variables || []}
                  onAddVariable={props.onAddVariable || (() => {})}
                  onOpenTools={props.onOpenTools}
                  onSavePrompts={props.onSavePrompts}
                  ref={(el) => {
                    if (el && props.blockRefs) {
                      props.blockRefs.current[blockNumber] = el;
                    }
                  }}
                  isProcessing={false}
                  onProcessingChange={() => {}}
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
});

export default CollapsibleBox;
