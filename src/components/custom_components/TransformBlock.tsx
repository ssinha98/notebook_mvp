import React, { useState } from "react";
import { Button } from "../ui/button";
import { FileSpreadsheet, Edit } from "lucide-react";
import TransformCSV from "./TransformCSV";
import { Dialog, DialogContent } from "../ui/dialog";
import { Block } from "@/types/types";

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
}

const TransformBlock: React.FC<TransformBlockProps> = ({
  blockNumber,
  originalFilePath,
  sourceName,
  fileType,
  transformations,
  onTransformationsUpdate,
}) => {
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

    return parts.length > 0 ? parts : (
      <div className="text-sm text-gray-400">No transformations applied</div>
    );
  };

  return (
    <>
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">
              Transform #{blockNumber}
            </h3>
            <span className="px-2 py-1 rounded bg-gray-700 text-gray-300 text-sm">
              {fileType.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center gap-2 text-gray-400">
            <FileSpreadsheet className="h-5 w-5" />
            <span className="flex-1">{originalFilePath}</span>
          </div>

          {/* Source Name */}
          <div className="text-sm">
            <span className="text-gray-400">Saving as: </span>
            <span className="text-white font-medium">{sourceName}</span>
          </div>

          {/* Transformations */}
          <div className="space-y-2">
            {renderTransformations()}
          </div>

          {/* Edit Button */}
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
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[1000px] bg-gray-800">
          <TransformCSV
            onNext={(newData) => {
              onTransformationsUpdate({
                transformations: {
                  filterCriteria: newData.filterCriteria,
                  columns: newData.metadata.columns,
                  previewData: newData.rawData.slice(0, 5)
                }
              });
              setIsEditDialogOpen(false);
            }}
            onBack={() => setIsEditDialogOpen(false)}
            columns={transformations.columns}
            fileName={originalFilePath.split('/').pop() || ''}
            filePath={originalFilePath}
            previewData={transformations.previewData}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TransformBlock;
