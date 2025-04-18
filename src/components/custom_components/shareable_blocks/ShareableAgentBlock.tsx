import { FileText, FileSpreadsheet, Globe, Eye, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

interface ShareableAgentBlockProps {
  blockNumber: number;
  userPrompt: string;
  attachedFile?: {
    name: string;
    type: string;
    url: string;
  };
  outputVariable?: {
    name: string;
    value?: string;
  };
  isCompleted?: boolean;
  output?: string;
  isProcessing?: boolean;
  thinkingEmoji?: string;
}

const AGENT_BLOCK_DESCRIPTION =
  "Agent blocks let you pass in content for your agent to think through or process, via a call to a large language model. They're the building blocks for complex reasoning and analysis tasks.";

export default function ShareableAgentBlock({
  blockNumber,
  userPrompt,
  attachedFile,
  outputVariable,
  isCompleted,
  output,
  isProcessing,
  thinkingEmoji,
}: ShareableAgentBlockProps) {
  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "csv":
        return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
      case "website":
        return <Globe className="h-5 w-5 text-purple-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleOpenFile = () => {
    if (attachedFile?.url) {
      window.open(attachedFile.url, "_blank");
    }
  };

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
              Agent <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Agent Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {AGENT_BLOCK_DESCRIPTION}
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
        {attachedFile && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Attachment:</p>
            <div className="bg-gray-800 p-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getFileIcon(attachedFile.type)}
                <span className="text-white">{attachedFile.name}</span>
              </div>
              <button
                onClick={handleOpenFile}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                title="Open file"
              >
                <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
              </button>
            </div>
          </div>
        )}
        <div>
          <p className="text-sm text-gray-400 mb-2">User Prompt</p>
          <p className="text-white bg-gray-800 p-3 rounded-lg">{userPrompt}</p>
        </div>
        {outputVariable && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Save output as:</p>
            <p className="text-blue-400">{outputVariable.name}</p>
          </div>
        )}
        {isProcessing && thinkingEmoji && (
          <div className="text-2xl mb-4 animate-pulse">{thinkingEmoji}</div>
        )}
        {isCompleted && output && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {output}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
