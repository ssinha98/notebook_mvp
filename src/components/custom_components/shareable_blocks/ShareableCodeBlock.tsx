import { FileCode, Info, X } from "lucide-react";
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

interface ShareableCodeBlockProps {
  blockNumber: number;
  language: string;
  code: string;
  output?: string;
  outputVariable?: {
    name: string;
    value?: string;
  };
  isCompleted?: boolean;
}

const CODE_BLOCK_DESCRIPTION =
  "Code blocks let you write and execute Python code. You can use variables from other blocks and save the output to new variables.";

export default function ShareableCodeBlock({
  blockNumber,
  language,
  code,
  outputVariable,
}: ShareableCodeBlockProps) {
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
              Code <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Code Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {CODE_BLOCK_DESCRIPTION}
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
          <p className="text-sm text-gray-400 mb-2">Language</p>
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-blue-400" />
            <span className="text-white">{language}</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-2">Code</p>
          <pre className="bg-gray-800 p-4 rounded-lg overflow-x-auto text-white font-mono text-sm">
            {code}
          </pre>
        </div>
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
