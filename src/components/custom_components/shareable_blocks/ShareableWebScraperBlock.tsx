import { useEffect, useState } from "react";
import { ShareableWebScraperBlockProps } from "@/types/shareable_blocks";
import { Info, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

const WEB_SCRAPER_BLOCK_DESCRIPTION =
  "Web scraper blocks allow your agent to analyze and extract information from websites using custom DOM, prompts, and suggested actions.";

export default function ShareableWebScraperBlock({
  blockNumber,
  webBlocks,
  outputVariable,
  isRunning = false,
  prompt,
  startingUrl,
  usableInputs,
}: ShareableWebScraperBlockProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showInputs, setShowInputs] = useState(false);

  // Always reset to first block when (re)starting
  useEffect(() => {
    setCurrentIdx(0);
  }, [isRunning]);

  // Cycle through webBlocks every 4 seconds, but only when running and not at last block
  useEffect(() => {
    if (!isRunning) return;
    if (webBlocks.length <= 1) return;
    if (currentIdx === webBlocks.length - 1) return; // Stop cycling at last block
    const interval = setInterval(() => {
      setCurrentIdx((prev) => {
        if (prev < webBlocks.length - 1) {
          return prev + 1;
        }
        return prev;
      });
      setShowInputs(false); // close dropdown on change
    }, 4000);
    return () => clearInterval(interval);
  }, [webBlocks.length, currentIdx, isRunning]);

  const block = webBlocks[currentIdx];

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-4">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-white mr-3">
          Block {blockNumber}
        </h3>
        <AlertDialog>
          <AlertDialogTrigger>
            <Badge
              variant="outline"
              className="flex items-center gap-1 cursor-pointer hover:bg-gray-800"
            >
              Web Scraper <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Web Scraper Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {WEB_SCRAPER_BLOCK_DESCRIPTION}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-gray-800 text-white hover:bg-gray-700">
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        {isRunning && webBlocks.length > 1 && (
          <span className="ml-4 text-xs text-gray-400">
            {currentIdx + 1} / {webBlocks.length}
          </span>
        )}
      </div>

      {/* Always show prompt and starting URL */}
      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Prompt</p>
        <div className="bg-gray-800 rounded px-3 py-2 text-sm text-gray-200 font-normal">
          {prompt}
        </div>
      </div>

      <div className="mb-4">
        <p className="text-xs text-gray-400 mb-1">Starting URL</p>
        <div className="bg-gray-800 rounded px-3 py-2 text-sm text-gray-200 font-normal">
          {startingUrl}
        </div>
      </div>

      {/* Usable Inputs (before run) */}
      {usableInputs && usableInputs.length > 0 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1">Usable Inputs</p>
          <div className="bg-gray-800 rounded p-2 border border-gray-700">
            <table className="min-w-full text-sm text-left">
              <thead>
                <tr>
                  <th className="text-gray-400 px-2 py-1">Key</th>
                  <th className="text-gray-400 px-2 py-1">Value</th>
                </tr>
              </thead>
              <tbody>
                {usableInputs.map((input, i) => (
                  <tr key={i}>
                    <td className="text-blue-300 px-2 py-1">{input.key}</td>
                    <td className="text-gray-200 px-2 py-1">{input.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Web Block URL */}
      <div className="mb-2">
        <p className="text-xs text-gray-400 mb-1">URL</p>
        <div className="bg-gray-800 rounded px-3 py-2 text-sm text-blue-300 font-normal break-all">
          {block.url}
        </div>
      </div>

      {/* Show web blocks only when running */}
      {isRunning && (
        <>
          {/* Agent Preview (DOM) */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">Agent Preview</p>
            <div
              className="bg-gray-950 rounded px-3 py-2 text-sm text-green-300 font-mono border border-gray-700 overflow-auto"
              style={{ maxHeight: "20rem", minHeight: "10rem" }}
            >
              {block.dom}
            </div>
          </div>

          {/* Usable Inputs Dropdown */}
          <div className="mb-4">
            {showInputs && (
              <div className="mt-2 bg-gray-800 rounded p-2 border border-gray-700">
                <table className="min-w-full text-sm text-left">
                  <thead>
                    <tr>
                      <th className="text-gray-400 px-2 py-1">Key</th>
                      <th className="text-gray-400 px-2 py-1">Value</th>
                    </tr>
                  </thead>
                  <tbody></tbody>
                </table>
              </div>
            )}
          </div>

          {/* Suggested Next Agent Action */}
          <div className="mb-4">
            <p className="text-xs text-gray-400 mb-1">
              Suggested Next Agent Action
            </p>
            <div className="bg-gray-800 rounded px-3 py-2 text-sm text-white mb-2">
              {block.suggestedNextAgentAction}
            </div>
            <div className="flex gap-2">
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded">
                Yes
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded">
                No
              </button>
            </div>
          </div>
        </>
      )}

      {/* Show output variable when not running */}
      {!isRunning && outputVariable && (
        <div>
          <p className="text-sm text-gray-400 mb-2">Output:</p>
          <p className="text-blue-400">{outputVariable.name}</p>
        </div>
      )}
    </div>
  );
}
