import { Info } from "lucide-react";
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

interface ShareableContactBlockProps {
  blockNumber: number;
  to: string;
  subject: string;
  body: string;
  isProcessing?: boolean;
  thinkingEmoji?: string;
  isCompleted?: boolean;
  output?: string;
}

const CONTACT_BLOCK_DESCRIPTION =
  "Contact blocks let your agent contact you or a team member. They can send emails with their findings, recommendations, or request human input when needed.";

export default function ShareableContactBlock({
  blockNumber,
  to,
  subject,
  body,
  isProcessing,
  thinkingEmoji,
  isCompleted,
  output,
}: ShareableContactBlockProps) {
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
              Contact <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Contact Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {CONTACT_BLOCK_DESCRIPTION}
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
          <p className="text-sm text-gray-400 mb-2">To:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{to}</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Subject:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{subject}</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Body:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{body}</span>
          </div>
        </div>

        {isProcessing && (
          <div className="flex justify-center mt-4">
            <span className="text-2xl">{thinkingEmoji}</span>
          </div>
        )}

        {isCompleted && output && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Output:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{output}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
