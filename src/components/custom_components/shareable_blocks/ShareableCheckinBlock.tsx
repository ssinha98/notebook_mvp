import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEffect, useState } from "react";

interface ShareableCheckinBlockProps {
  blockNumber: number;
  outputVariable?: {
    name: string;
    value?: string;
  };
  isProcessing?: boolean;
  isCompleted?: boolean;
}

export default function ShareableCheckinBlock({
  blockNumber,
  outputVariable,
  isProcessing,
  isCompleted,
}: ShareableCheckinBlockProps) {
  const [showOldValue, setShowOldValue] = useState(false);
  const [showStrikethrough, setShowStrikethrough] = useState(false);
  const [showNewValue, setShowNewValue] = useState(false);

  useEffect(() => {
    if (!outputVariable?.value || !isProcessing) return;

    // Reset states when processing starts
    setShowOldValue(false);
    setShowStrikethrough(false);
    setShowNewValue(false);

    // Show the old value first
    const oldValueTimer = setTimeout(() => {
      setShowOldValue(true);
    }, 500);

    // Add strikethrough and show new value after delay
    const strikethroughTimer = setTimeout(() => {
      setShowStrikethrough(true);
      setShowNewValue(true);
    }, 1500);

    return () => {
      clearTimeout(oldValueTimer);
      clearTimeout(strikethroughTimer);
    };
  }, [outputVariable, isProcessing]);

  // Extract URL if present, otherwise use the full value
  const newValue =
    outputVariable?.value?.match(/https?:\/\/[^\s]+/)?.[0] ||
    outputVariable?.value ||
    "";

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">
          Block {blockNumber}
        </h3>
      </div>
      <div className="space-y-4">
        {outputVariable && (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-300">Variable Name</TableHead>
                  <TableHead className="text-gray-300">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-gray-300">
                    {outputVariable.name}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col space-y-2">
                      {showOldValue && (
                        <div
                          className={`text-gray-400 transition-all duration-500 ${
                            showStrikethrough ? "line-through" : ""
                          }`}
                        >
                          {outputVariable.value}
                        </div>
                      )}
                      {showNewValue && (
                        <div
                          style={{ color: "#4ade80" }}
                          className="font-medium"
                        >
                          @{newValue}
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
        <div className="text-sm text-gray-400">
          After checking all your variables are right and making any necessary
          changes, run the next blocks!
        </div>
      </div>
    </div>
  );
}
