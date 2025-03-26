import { ShareableWebBlockProps } from "@/types/shareable_blocks";
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

const WEB_BLOCK_DESCRIPTION =
  "Web agent blocks allow your agent to analyze and extract information from websites. They can gather data about companies, products, or any web-based content to support your agent's decision making.";

export default function ShareableWebBlock({
  blockNumber,
  url,
  nickname,
  outputVariable,
}: ShareableWebBlockProps) {
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
              Web Agent <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Web Agent Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {WEB_BLOCK_DESCRIPTION}
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
        {/* URL Display */}
        <div>
          <p className="text-sm text-gray-400 mb-2">URL:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-gray-300"
            >
              {url}
            </a>
          </div>
        </div>

        {/* Nickname Display */}
        <div>
          <p className="text-sm text-gray-400 mb-2">Nickname:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{nickname}</span>
          </div>
        </div>

        {/* Output Variable */}
        {outputVariable && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Save output as:</p>
            <p className="text-blue-400">{outputVariable.name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
