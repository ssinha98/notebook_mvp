import React, { useState } from "react";
import { Button } from "../ui/button";
import { FileSpreadsheet, Edit, FileText, Image, Globe } from "lucide-react";
import TransformCSV from "./TransformCSV";
import { Dialog, DialogContent } from "../ui/dialog";
import { Block } from "@/types/types";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";

interface TransformBlockProps {
  blockNumber: number;
  originalFilePath: string;
  sourceName: string;
  fileType: "image" | "csv" | "pdf" | "website";
  transformations: {
    filterCriteria: Array<{
      id: string;
      column: string;
      operator: string;
      value: string;
    }>;
    columns: string[];
    previewData: any[];
  };
  onTransformationsUpdate: (newTransformations: Partial<Block>) => void;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void; // Add this line
}

const TransformBlock: React.FC<TransformBlockProps> = ({
  blockNumber,
  originalFilePath,
  sourceName,
  fileType,
  transformations,
  onTransformationsUpdate,
  onDeleteBlock,
  onCopyBlock,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);

  // Add store hook for updating block names
  const { updateBlockName } = useSourceStore();

  // Get current block to display its name
  const currentBlock = useSourceStore((state) =>
    state.blocks.find((block) => block.blockNumber === blockNumber)
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const renderTransformations = () => {
    const parts = [];

    // Add filter transformations
    if (transformations.filterCriteria?.length > 0) {
      parts.push(
        <div key="filters" className="space-y-1">
          <h4 className="text-sm font-medium text-gray-400">Filters:</h4>
          {transformations.filterCriteria.map((filter) => (
            <div key={filter.id} className="text-sm text-gray-300 ml-2">
              • {filter.column} {filter.operator} "{filter.value}"
            </div>
          ))}
        </div>
      );
    }

    return parts.length > 0 ? (
      parts
    ) : (
      <div className="text-sm text-gray-400">No transformations applied</div>
    );
  };

  const renderSourceTypeSpecificContent = () => {
    switch (fileType) {
      case "csv":
        return (
          <>
            <div className="space-y-2">{renderTransformations()}</div>
            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditDialogOpen(true)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Transformations
              </Button>
            </div>
          </>
        );

      case "pdf":
        return (
          <div className="text-sm text-gray-400">
            PDF processing options coming soon
          </div>
        );

      case "image":
        return (
          <div className="text-sm text-gray-400">
            Image processing options coming soon
          </div>
        );

      case "website":
        return (
          <div className="text-sm text-gray-400">
            Website scraping options coming soon
          </div>
        );

      default:
        return null;
    }
  };

  const getSourceIcon = () => {
    switch (fileType) {
      case "csv":
        return <FileSpreadsheet className="h-5 w-5" />;
      case "pdf":
        return <FileText className="h-5 w-5" />;
      case "image":
        return <Image className="h-5 w-5" />;
      case "website":
        return <Globe className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const handleDeleteBlock = () => {
    if (typeof onDeleteBlock === "function") {
      onDeleteBlock(blockNumber);
    } else {
      console.error("onDeleteBlock is not properly defined");
    }
  };

  const handleCopyBlock = () => {
    if (onCopyBlock) {
      onCopyBlock(blockNumber);
    }
  };

  return (
    <>
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">
                Data + Transformations #{blockNumber}
              </h3>
              <BlockNameEditor
                blockName={
                  currentBlock?.name || `Data + Transformations ${blockNumber}`
                }
                blockNumber={blockNumber}
                onNameUpdate={updateBlockName}
              />
            </div>
            <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-sm">
              {fileType.toUpperCase()}
            </span>
          </div>
          <Popover>
            <PopoverTrigger>
              <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
                ⚙️
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={handleDeleteBlock}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-2 text-gray-400">
            {getSourceIcon()}
            <span className="flex-1">{originalFilePath}</span>
          </div>

          {/* Source Name */}
          <div className="text-sm">
            <span className="text-gray-400">Saving as: </span>
            <span className="text-white font-medium">{sourceName}</span>
          </div>

          {/* Source-specific content */}
          {renderSourceTypeSpecificContent()}
        </div>
      </div>

      {/* Edit Dialog - only rendered for CSV files */}
      {fileType === "csv" && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[1000px] bg-gray-800">
            <TransformCSV
              onNext={(newData) => {
                onTransformationsUpdate({
                  transformations: {
                    filterCriteria: newData.filterCriteria,
                    columns: newData.metadata.columns,
                    previewData: newData.rawData.slice(0, 5),
                  },
                });
                setIsEditDialogOpen(false);
              }}
              onBack={() => setIsEditDialogOpen(false)}
              columns={transformations.columns}
              fileName={originalFilePath.split("/").pop() || ""}
              filePath={originalFilePath}
              previewData={transformations.previewData}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default TransformBlock;
