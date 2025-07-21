import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import VariableDropdown from "./VariableDropdown";

interface SearchResult {
  title: string;
  snippet: string;
  displayed_link: string;
  position: number;
  link: string;
}

interface PreviewRow {
  rowId: string;
  rowIndex: number;
  searchQuery: string;
  results: SearchResult[];
}

interface SearchPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewData: PreviewRow[];
  onConfirm: (
    selectedResults: { [rowId: string]: string[] },
    targetVariableId: string
  ) => void;
  agentId?: string;
}

const SearchPreviewDialog: React.FC<SearchPreviewDialogProps> = ({
  open,
  onOpenChange,
  previewData,
  onConfirm,
  agentId,
}) => {
  const [selectedResults, setSelectedResults] = useState<{
    [rowId: string]: Set<string>;
  }>({});
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);
  const [selectedVariableId, setSelectedVariableId] = useState<string>("");

  const handleCheckboxChange = (
    rowId: string,
    link: string,
    checked: boolean
  ) => {
    setSelectedResults((prev) => {
      const current = prev[rowId] || new Set();
      const updated = new Set(current);

      if (checked) {
        updated.add(link);
      } else {
        updated.delete(link);
      }

      return {
        ...prev,
        [rowId]: updated,
      };
    });
  };

  const handleConfirm = () => {
    if (!selectedVariableId) {
      // Show a more prominent warning
      console.warn("No variable selected");
      return;
    }

    // Check if any results are selected
    const hasSelectedResults = Object.values(selectedResults).some(
      (urls) => urls.size > 0
    );

    if (!hasSelectedResults) {
      console.warn("No search results selected");
      return;
    }

    // Convert Sets to arrays for the callback
    const result: { [rowId: string]: string[] } = {};
    Object.entries(selectedResults).forEach(([rowId, links]) => {
      result[rowId] = Array.from(links);
    });
    onConfirm(result, selectedVariableId);
    onOpenChange(false);
  };

  const handleCancel = () => {
    setSelectedResults({});
    setCurrentQueryIndex(0);
    setSelectedVariableId("");
    onOpenChange(false);
  };

  const goToPreviousQuery = () => {
    setCurrentQueryIndex((prev) =>
      prev > 0 ? prev - 1 : previewData.length - 1
    );
  };

  const goToNextQuery = () => {
    setCurrentQueryIndex((prev) =>
      prev < previewData.length - 1 ? prev + 1 : 0
    );
  };

  const currentRow = previewData[currentQueryIndex];

  // Check if any results are selected
  const hasSelectedResults = Object.values(selectedResults).some(
    (urls) => urls.size > 0
  );

  // Check if we can proceed
  const canProceed = selectedVariableId && hasSelectedResults;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] bg-black border-gray-600">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Preview Search Results
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-300">
            Select which search results you want to add to each row. Only the
            selected URLs will be added to the table.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Variable Selection */}
        <div className="mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-300 font-medium">
              Add results to variable:
            </label>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={setSelectedVariableId}
              agentId={agentId}
              className="flex-1"
            />
          </div>

          {/* Warning message if no variable selected */}
          {!selectedVariableId && (
            <div className="flex items-center gap-2 mt-2 text-yellow-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Please select a variable to add the results to</span>
            </div>
          )}
        </div>

        {/* Query Navigation */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-800 rounded-lg border border-gray-600">
          <button
            onClick={goToPreviousQuery}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            disabled={previewData.length <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="text-center">
            <div className="text-white font-medium">
              Query {currentQueryIndex + 1} of {previewData.length}
            </div>
            <div className="text-gray-400 text-sm">
              {currentRow?.searchQuery}
            </div>
          </div>

          <button
            onClick={goToNextQuery}
            className="flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
            disabled={previewData.length <= 1}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Current Query Results */}
        {currentRow && (
          <div className="space-y-3 flex-1 min-h-0">
            <div className="flex items-center gap-2">
              <div className="bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                {currentRow.rowIndex + 1}
              </div>
              <div className="text-sm text-gray-400">
                Query:{" "}
                <span className="text-white">{currentRow.searchQuery}</span>
              </div>
            </div>

            {/* Scrollable results area with much shorter height */}
            <div className="border border-gray-700 rounded-lg overflow-y-auto flex-1 min-h-0 max-h-[30vh] sm:max-h-[35vh] md:max-h-[250px]">
              <div className="p-4 space-y-3">
                {currentRow.results.map((result, index) => (
                  <div key={`${currentRow.rowId}-${index}`}>
                    <Card className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={
                              selectedResults[currentRow.rowId]?.has(
                                result.link
                              ) || false
                            }
                            onCheckedChange={(checked) =>
                              handleCheckboxChange(
                                currentRow.rowId,
                                result.link,
                                checked as boolean
                              )
                            }
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <a
                              href={result.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-lg font-semibold text-blue-400 hover:underline line-clamp-2 cursor-pointer block"
                            >
                              {result.title}
                            </a>
                            <div className="text-sm text-gray-400 mb-2">
                              {result.displayed_link}
                            </div>
                            <div className="text-sm text-gray-300 line-clamp-2">
                              {result.snippet}
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              URL: {result.link}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Warning message if no results selected */}
        {!hasSelectedResults && (
          <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg text-yellow-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            <span>Please select at least one search result to add</span>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel
            onClick={handleCancel}
            className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
            disabled={!canProceed}
          >
            Add Selected URLs
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SearchPreviewDialog;
