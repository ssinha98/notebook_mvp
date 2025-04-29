// SimpleDiffViewer.tsx

import { diffWords } from "diff";
import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Info, Check, Edit2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FcDocument } from "react-icons/fc";

interface DocDiffProps {
  id: string;
  type: "docdiff";
  blockNumber: number;
  input_prompt: string;
  document_diffs: Array<{
    document_name: string;
    original: string;
    modified: string;
  }>;
  isCompleted?: boolean;
  output?: string;
  isProcessing?: boolean;
  thinkingEmoji?: string;
}

const BLOCK_DESCRIPTION =
  "Doc Diff Agent helps you make systematic changes across multiple documents based on your specified changes.";

const DiffView: React.FC<{ original: string; modified: string }> = ({
  original,
  modified,
}) => {
  const changes = diffWords(original, modified);

  return (
    <div
      style={{
        lineHeight: "1.6",
        fontFamily: "monospace",
        whiteSpace: "pre-wrap",
      }}
    >
      {changes.map((part, index) => (
        <span
          key={index}
          style={{
            backgroundColor: part.added
              ? "#d4f7d4"
              : part.removed
                ? "#f8d7da"
                : "transparent",
            color: part.added ? "green" : part.removed ? "red" : "inherit",
            textDecoration: part.removed ? "line-through" : "none",
            fontWeight: part.added ? "bold" : "normal",
          }}
        >
          {part.value}
        </span>
      ))}
    </div>
  );
};

export const ShareableDocDiffBlock: React.FC<DocDiffProps> = ({
  blockNumber,
  input_prompt,
  document_diffs,
  isCompleted,
  isProcessing,
  thinkingEmoji,
}) => {
  const [showDiffs, setShowDiffs] = useState(false);
  const [confirmedDiffs, setConfirmedDiffs] = useState<{
    [key: string]: "confirmed" | "edit" | null;
  }>({});

  useEffect(() => {
    if (isCompleted) {
      // Just handle showing the diffs after a delay
      setTimeout(() => setShowDiffs(true), 1000);
    }
  }, [isCompleted]);

  const handleDiffAction = (
    documentName: string,
    action: "confirmed" | "edit"
  ) => {
    setConfirmedDiffs((prev) => ({
      ...prev,
      [documentName]: action,
    }));
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 w-full">
      <div className="flex items-center mb-3">
        <h3 className="text-lg font-semibold text-white mr-3">
          Block {blockNumber}
        </h3>
        <Badge
          variant="outline"
          className="flex items-center gap-1 cursor-pointer hover:bg-gray-800"
        >
          Doc Diff Agent <Info className="h-3 w-3" />
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Input Section */}
        <div>
          <label className="text-sm text-gray-400 mb-2 block">
            Input the change you want agents to edit documents based on
          </label>
          <div className="w-full bg-gray-800 text-white p-3 rounded-lg min-h-[100px] mb-3">
            {input_prompt}
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => {}}
          >
            Process Changes
          </Button>
        </div>

        {/* Processing/Output Sections */}
        {isProcessing && thinkingEmoji && (
          <div className="text-2xl mb-4 animate-pulse">{thinkingEmoji}</div>
        )}

        {/* Only the Suggested Edits section */}
        {isCompleted && showDiffs && document_diffs.length > 0 && (
          <div>
            <h4 className="text-white font-semibold mb-3">Suggested Edits</h4>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {document_diffs.map((diff, index) => (
                <div
                  key={index}
                  className="bg-gray-800 p-4 rounded-lg min-w-[350px] h-[500px] flex flex-col"
                >
                  <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                    <FcDocument className="h-5 w-5 flex-shrink-0" />
                    <span className="truncate">{diff.document_name}</span>
                  </h5>

                  {/* Diff content */}
                  <div className="flex-1 overflow-y-auto bg-gray-900 rounded p-3 mb-4">
                    <DiffView
                      original={diff.original}
                      modified={diff.modified}
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-auto">
                    <Button
                      onClick={() =>
                        handleDiffAction(diff.document_name, "confirmed")
                      }
                      className={`flex-1 ${
                        confirmedDiffs[diff.document_name] === "confirmed"
                          ? "bg-green-600 hover:bg-green-700"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      {confirmedDiffs[diff.document_name] === "confirmed" ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Confirmed
                        </>
                      ) : (
                        "Confirm"
                      )}
                    </Button>
                    <Button
                      onClick={() =>
                        handleDiffAction(diff.document_name, "edit")
                      }
                      className={`flex-1 ${
                        confirmedDiffs[diff.document_name] === "edit"
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-gray-700 hover:bg-gray-600"
                      }`}
                    >
                      {confirmedDiffs[diff.document_name] === "edit" ? (
                        <>
                          <Check className="h-4 w-4 mr-2" />
                          Editing
                        </>
                      ) : (
                        <>
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// Usage example somewhere else in your app:
// <SimpleDiffViewer original={originalText} modified={modifiedText} />
