import { Globe, Info, Zap, Settings } from "lucide-react";
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
import Image from "next/image";

interface ShareableMakeBlockProps {
  blockNumber: number;
  webhookUrl: string;
  parameters: Array<{ key: string; value: string }>;
  outputVariable?: {
    name: string;
    value?: string;
  };
  output?: string;
  isCompleted?: boolean;
  isProcessing?: boolean;
  thinkingEmoji?: string;
}

const MAKE_BLOCK_DESCRIPTION =
  "Make.com blocks let you call webhooks and APIs. You can pass variables from other blocks and save the response to new variables.";

export default function ShareableMakeBlock({
  blockNumber,
  webhookUrl,
  parameters,
  outputVariable,
  output,
  isCompleted,
  isProcessing,
  thinkingEmoji,
}: ShareableMakeBlockProps) {
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
              Make <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Make.com Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {MAKE_BLOCK_DESCRIPTION}
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
          <p className="text-sm text-gray-400 mb-2">Webhook URL</p>
          <div className="flex items-center gap-2 bg-gray-800 p-3 rounded-lg">
            <Globe className="h-4 w-4 text-blue-400" />
            <span className="text-white break-all">{webhookUrl}</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Parameters</p>
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-700">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-400">Key</div>
                <div className="text-sm font-medium text-gray-400">Value</div>
              </div>
            </div>
            <div className="p-3">
              {parameters.map((param, index) => (
                <div
                  key={index}
                  className="grid grid-cols-2 gap-2 mb-2 last:mb-0"
                >
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-yellow-400" />
                    <span className="text-white">{param.key}</span>
                  </div>
                  <div className="text-gray-300">{param.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {outputVariable && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Save output as:</p>
            <p className="text-blue-400">{outputVariable.name}</p>
          </div>
        )}

        {isProcessing && thinkingEmoji && (
          <div className="mt-4 text-center text-2xl">{thinkingEmoji}</div>
        )}

        {isCompleted && output && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Output:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <p className="text-white">{output}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
