import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Block } from "@/types/types";

interface SortableBlockProps {
  block: Block;
  children: React.ReactNode;
}

const SortableBlock: React.FC<SortableBlockProps> = ({ block, children }) => {
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
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
