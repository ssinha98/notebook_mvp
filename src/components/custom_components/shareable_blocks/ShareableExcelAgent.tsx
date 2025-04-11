import { FileSpreadsheet, Info } from "lucide-react";
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

interface ShareableExcelAgentProps {
  blockNumber: number;
  userPrompt: string;
}

const EXCEL_AGENT_DESCRIPTION =
  "Excel Agent blocks let you create and manipulate Excel files. You can use data from other blocks and save the output as a new Excel file.";

export default function ShareableExcelAgent({
  blockNumber,
  userPrompt,
}: ShareableExcelAgentProps) {
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
              Excel Agent <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Excel Agent Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {EXCEL_AGENT_DESCRIPTION}
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
      <div>
        <p className="text-sm text-gray-400 mb-2">User Prompt</p>
        <p className="text-white bg-gray-800 p-3 rounded-lg">{userPrompt}</p>
      </div>
    </div>
  );
}
