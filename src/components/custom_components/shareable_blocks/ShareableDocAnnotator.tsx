import React from "react";
import { EyeIcon, DocumentTextIcon } from "@heroicons/react/24/outline";
import { IoIosExpand } from "react-icons/io";

interface ShareableDocAnnotatorProps {
  blockNumber: number;
  sourceLink: string;
  sourceName: string;
  prompt: string;
  annotatedDocLink: string;
  extractedChunks: string[];
  isProcessing?: boolean;
  isCompleted?: boolean;
  output?: string;
  thinkingEmoji?: string;
}

const ShareableDocAnnotator: React.FC<ShareableDocAnnotatorProps> = ({
  blockNumber,
  sourceLink,
  sourceName,
  prompt,
  annotatedDocLink,
  extractedChunks,
  isProcessing,
  isCompleted,
  output,
  thinkingEmoji,
}) => {
  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-800">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">
          Document Extraction and Annotation Agent
        </h3>
        {isCompleted && <span className="text-green-400">✓</span>}
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Selected Source
          </label>
          <div className="flex items-center gap-2">
            <select
              className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
              value={sourceName}
              disabled
            >
              <option>{sourceName}</option>
            </select>
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-400 hover:text-white"
            >
              <EyeIcon className="h-5 w-5" />
            </a>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Prompt describing what you'd like the agent to look for and annotate
          </label>
          <input
            type="text"
            value={prompt}
            disabled
            className="w-full p-2 border border-gray-600 rounded-md bg-gray-700 text-white"
          />
        </div>

        {isProcessing && thinkingEmoji && (
          <div className="text-2xl mb-4 animate-pulse text-center">
            {thinkingEmoji}
          </div>
        )}

        {isCompleted && (
          <div className="border-t border-gray-700 pt-4">
            <h4 className="font-medium mb-4 text-white">Output</h4>

            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2 border border-gray-600 rounded-md bg-gray-700">
                <DocumentTextIcon className="h-5 w-5 text-gray-400" />
                <span className="flex-1 text-white">
                  Here is the annotated doc
                </span>
                <a
                  href={annotatedDocLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-white"
                >
                  <IoIosExpand className="h-5 w-5" />
                </a>
              </div>

              <div>
                <h4 className="font-medium mb-2 text-white">
                  Extracted Chunks
                </h4>
                <div className="flex gap-4 overflow-x-auto pb-4">
                  {extractedChunks.map((chunk, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 w-64 p-4 border border-gray-600 rounded-lg bg-gray-700 text-white shadow-sm hover:bg-gray-600 transition-colors"
                    >
                      <p className="italic">"{chunk}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareableDocAnnotator;
