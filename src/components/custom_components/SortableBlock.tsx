import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "@/types/types";
import { toast } from "sonner";

interface SortableBlockProps {
  block: Block;
  children: React.ReactNode;
  isViewOnly?: boolean;
}

const SortableBlock: React.FC<SortableBlockProps> = ({
  block,
  children,
  isViewOnly = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Add visual styling for skipped blocks
  const isSkipped = block.skip === true;
  const blockStyle = {
    ...style,
    opacity: isDragging ? 0.5 : isSkipped ? 0.4 : 1,
    filter: isSkipped ? "grayscale(0.8)" : "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={blockStyle}
      {...attributes}
      className={`relative ${isSkipped ? "border-l-4 border-l-gray-400 bg-gray-50 dark:bg-gray-800" : ""}`}
    >
      {/* View-only overlay for this block */}
      {isViewOnly && (
        <div
          className="absolute inset-0 z-50 bg-transparent"
          onClick={() => {
            toast.error(
              "You're in view-only mode. You can only run the agent and input variables."
            );
          }}
          style={{ pointerEvents: "auto" }}
        />
      )}

      {/* Drag handle - only this part captures drag events */}
      <div
        {...listeners}
        className="absolute left-2 top-4 z-10 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300 p-1 rounded"
        title="Drag to reorder"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="currentColor"
          className="opacity-40 hover:opacity-80 transition-opacity"
        >
          <circle cx="2" cy="3" r="1" />
          <circle cx="6" cy="3" r="1" />
          <circle cx="10" cy="3" r="1" />
          <circle cx="2" cy="6" r="1" />
          <circle cx="6" cy="6" r="1" />
          <circle cx="10" cy="6" r="1" />
          <circle cx="2" cy="9" r="1" />
          <circle cx="6" cy="9" r="1" />
          <circle cx="10" cy="9" r="1" />
        </svg>
      </div>

      {/* Content - receives normal events */}
      <div className="pl-6">{children}</div>
    </div>
  );
};

export default SortableBlock;
