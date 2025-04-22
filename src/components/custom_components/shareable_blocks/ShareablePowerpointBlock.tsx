import { Presentation, Info } from "lucide-react";
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

interface ShareablePowerpointBlockProps {
  blockNumber: number;
  prompt: string;
  slides: number;
  output?: string;
  isCompleted?: boolean;
  isProcessing?: boolean;
  thinkingEmoji?: string;
}

const POWERPOINT_BLOCK_DESCRIPTION =
  "PowerPoint Agent blocks let you create presentations with AI assistance. Specify the content requirements and number of slides needed.";

export default function ShareablePowerpointBlock({
  blockNumber,
  prompt,
  slides,
  output,
  isCompleted,
  isProcessing,
  thinkingEmoji,
}: ShareablePowerpointBlockProps) {
  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
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
              PowerPoint <Presentation className="h-3 w-3 ml-1" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                PowerPoint Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {POWERPOINT_BLOCK_DESCRIPTION}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction className="bg-gray-800 text-white hover:bg-gray-700">
                Close
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-2">Prompt</p>
          <p className="text-white bg-gray-800 p-3 rounded-lg">{prompt}</p>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Number of Slides</p>
          <p className="text-white bg-gray-800 p-3 rounded-lg">{slides}</p>
        </div>

        {isProcessing && thinkingEmoji && (
          <div className="text-2xl mb-4 animate-pulse text-center">
            {thinkingEmoji}
          </div>
        )}
      </div>
    </div>
  );
}
