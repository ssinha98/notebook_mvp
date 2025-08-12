import React, { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useSourceStore } from "@/lib/store";
import { useAgentStore } from "@/lib/agentStore";
import { toast } from "sonner";
import { Block } from "@/types/types";

interface ImportCSVProps {
  onBack: () => void;
  onImport: () => void;
  processedData: {
    processedData: string;
    rawData: any[];
    originalName: string;
    filterCriteria?: any[];
    metadata: {
      original_row_count: number;
      filtered_row_count: number;
      columns: string[];
      applied_filters: any[];
    };
  };
}

const ImportCSV: React.FC<ImportCSVProps> = ({
  onBack,
  onImport,
  processedData,
}) => {
  const [sourceName, setSourceName] = useState(
    processedData.originalName.replace(".csv", "")
  );
  const addSource = useSourceStore((state) => state.addSource);
  const { addBlockToAgent } = useAgentStore();
  const currentAgent = useAgentStore((state) => state.currentAgent);

  const handleImport = () => {
    if (!sourceName.trim()) {
      toast.error("Please provide a name for this source");
      return;
    }

    addSource(sourceName, {
      type: "csv",
      processedData: processedData.processedData,
      rawData: processedData.rawData,
      originalName: processedData.originalName,
      filterCriteria: processedData.filterCriteria,
      metadata: processedData.metadata,
    });

    // Get the next block number from current agent
    const blocks = currentAgent?.blocks || [];
    const nextBlockNumber =
      blocks.length > 0 ? Math.max(...blocks.map((b) => b.blockNumber)) + 1 : 1;

    const transformBlock = {
      type: "transform",
      blockNumber: nextBlockNumber,
      originalFilePath: processedData.originalName,
      sourceName: sourceName,
      fileType: "csv",
      transformations: {
        filterCriteria: processedData.filterCriteria,
        columns: processedData.metadata.columns,
        previewData: processedData.rawData.slice(0, 5),
      },
    };

    addBlockToAgent(transformBlock as Block);

    toast.success("Source added successfully");
    onImport();
  };

  return (
    <div className="grid gap-4">
      <Button variant="ghost" className="w-fit" onClick={onBack}>
        ← Back
      </Button>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="sourceName" className="text-white">
            Source Name
          </Label>
          <Input
            id="sourceName"
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white"
            placeholder="Enter a name for this source"
          />
        </div>

        <div className="bg-gray-700 p-4 rounded-md">
          <h3 className="text-lg font-medium text-white mb-2">Data Preview</h3>
          <div className="text-sm text-gray-300 mb-4">
            <p>Original rows: {processedData.metadata.original_row_count}</p>
            <p>Filtered rows: {processedData.metadata.filtered_row_count}</p>
            <p>
              Applied filters: {processedData.metadata.applied_filters.length}
            </p>
          </div>

          <div className="max-h-[300px] overflow-auto">
            <table className="w-full text-sm text-white">
              <thead className="bg-gray-800">
                <tr>
                  {processedData.metadata.columns.map((col: string) => (
                    <th key={col} className="p-2 text-left">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedData.rawData
                  .slice(0, 5)
                  .map((row: any, i: number) => (
                    <tr key={i} className="border-t border-gray-600">
                      {processedData.metadata.columns.map((col: string) => (
                        <td key={col} className="p-2">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button onClick={handleImport}>Import CSV</Button>
      </div>
    </div>
  );
};

export default ImportCSV;
