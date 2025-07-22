import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { IoExpandSharp } from "react-icons/io5";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface SearchResult {
  date?: string | null;
  title: string;
  url: string;
  description?: string;
}

interface ResearchResultsSectionProps {
  summary: string;
  results: SearchResult[];
  selectedItems: Set<string>;
  onItemSelect: (itemId: string, isSelected: boolean) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
  loading?: boolean;
  hideExpandIcon?: boolean;
}

const ResearchResultsSection: React.FC<ResearchResultsSectionProps> = ({
  summary,
  results,
  selectedItems,
  onItemSelect,
  onSelectAll,
  onClearAll,
  loading,
  hideExpandIcon = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Summary Box with Expand */}
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 relative">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-300">Summary</h4>
          {!hideExpandIcon && (
            <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <AlertDialogTrigger asChild>
                <button
                  className="text-gray-400 hover:text-gray-100 transition-colors"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <IoExpandSharp className="h-4 w-4" />
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 max-w-[60vw] w-[60vw] h-[70vh] max-h-[70vh] flex flex-col">
                <AlertDialogHeader className="flex-shrink-0">
                  <AlertDialogTitle className="text-gray-100">
                    Research Summary
                  </AlertDialogTitle>
                </AlertDialogHeader>
                <div className="flex-1 overflow-hidden flex flex-col space-y-4">
                  <div className="flex-1 overflow-y-auto">
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>{summary}</ReactMarkdown>
                    </div>
                  </div>
                  {results && results.length > 0 && (
                    <div className="flex-shrink-0">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">
                        Sources
                      </h4>
                      <div className="h-32 overflow-x-auto overflow-y-hidden">
                        <div className="flex gap-4 pb-2">
                          {results.map((result, i) => (
                            <div
                              key={i}
                              className="flex-shrink-0 w-72 p-3 bg-gray-800 rounded border border-gray-600 hover:border-blue-500 transition-colors"
                            >
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <div className="text-xs font-medium text-blue-400 hover:text-blue-300 line-clamp-3 break-all">
                                  {result.url}
                                </div>
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <AlertDialogFooter className="flex-shrink-0 justify-end">
                  <AlertDialogCancel className="bg-gray-800 text-gray-100 hover:bg-gray-700 border-gray-700">
                    Close
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        <div className="h-32 overflow-y-auto">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown>{summary}</ReactMarkdown>
          </div>
        </div>
      </div>
      {/* Results Section with Selection */}
      {results && results.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-300">Sources</h4>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                {selectedItems.size} sources selected
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onSelectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={onClearAll}>
                  Clear All
                </Button>
              </div>
            </div>
          </div>
          <div className="h-48 overflow-y-auto">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {results.map((result, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 w-72 p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-500 transition-colors relative"
                >
                  <div className="absolute top-2 right-2">
                    <Checkbox
                      checked={selectedItems.has(result.url)}
                      onCheckedChange={(checked) =>
                        onItemSelect(result.url, checked as boolean)
                      }
                      className="bg-gray-700 border-gray-600"
                    />
                  </div>
                  <div className="space-y-2 pr-6">
                    {result.date && (
                      <div className="text-xs text-gray-400">
                        {new Date(result.date).toLocaleDateString()}
                      </div>
                    )}
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <h5 className="text-sm font-medium text-blue-400 hover:text-blue-300 line-clamp-2">
                        {result.title}
                      </h5>
                    </a>
                    <div className="text-xs text-gray-400 truncate">
                      {result.url}
                    </div>
                    {result.description && (
                      <div className="text-xs text-gray-300 line-clamp-2">
                        {result.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Remove the Variable Dropdown section */}
        </div>
      )}
    </div>
  );
};

export default ResearchResultsSection;
