import { FileText, FileSpreadsheet, Globe, Eye, Info, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FaFilePowerpoint } from "react-icons/fa";
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
import { useState } from "react";
import { Input } from "@/components/ui/input";

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
  checkin?: boolean;
  isPaused?: boolean;
  onPause?: () => void;
  onResume?: () => void;
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
  checkin,
  isPaused,
  onPause,
  onResume,
}: ShareableAgentBlockProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [dialogFields, setDialogFields] = useState<
    { title: string; value: string }[]
  >([]);

  const getFileIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "pdf":
        return <FileText className="h-5 w-5 text-blue-400" />;
      case "csv":
        return <FileSpreadsheet className="h-5 w-5 text-green-400" />;
      case "website":
        return <Globe className="h-5 w-5 text-purple-400" />;
      case "pptx":
        return <FaFilePowerpoint className="h-5 w-5 text-red-400" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleOpenFile = () => {
    if (attachedFile?.url) {
      window.open(attachedFile.url, "_blank");
    }
  };

  const handleEditClick = () => {
    setDialogFields([
      {
        title: "Draft Subject",
        value: "Quick Follow-Up on Your Packaging Inquiry",
      },
      {
        title: "Draft Body",
        value: `Sure! Here's the draft body:
Hi Jack,
  
  Thanks for reaching out — great to hear from you, and Jack's Apple Cider sounds awesome!
  
  To make sure we're the right fit, I just have a couple quick questions:
      •	What's your estimated monthly order volume?
      •	Does your packaging require anything specialty (e.g. biodegradable, temperature-sensitive, etc.)?
  
  Once I have that, I can point you in the right direction or connect you with someone on our team.
  
  Looking forward to hearing from you!
  
  Best,
  Alan the Lead Qualifier Agent
        `,
      },
    ]);
    setShowDialog(true);
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
      </div>
      {checkin && (
        <div className="flex gap-4 mt-6">
          <Button variant="outline" onClick={handleEditClick}>
            Pause & edit
          </Button>
          <Button
            variant="default"
            onClick={() => {
              onResume && onResume();
            }}
            disabled={!isPaused}
          >
            Confirm & Next
          </Button>
          <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
            <AlertDialogContent className="bg-black">
              <AlertDialogHeader>
                <AlertDialogTitle>Edit Block</AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-4">
                {dialogFields.map((field, idx) => (
                  <div key={field.title}>
                    <label className="block text-white mb-1">
                      {field.title}
                    </label>
                    <textarea
                      className="bg-gray-900 text-white border-gray-700 rounded w-full p-2 resize-none"
                      value={field.value}
                      onChange={(e) => {
                        const updatedFields = [...dialogFields];
                        updatedFields[idx] = {
                          ...field,
                          value: e.target.value,
                        };
                        setDialogFields(updatedFields);
                      }}
                      rows={5}
                      style={{
                        minHeight: "6em",
                        maxHeight: "20vh",
                        overflowY: "auto",
                      }}
                    />
                  </div>
                ))}
                {/* {dialogFields.map((field, idx) => (
                  <div key={field.title}>
                    <label className="block text-white mb-1">
                      {field.title}
                    </label>
                    <textarea
                      className="bg-gray-900 text-white border-gray-700 rounded w-full p-2 resize-none"
                      value={field.value}
                      // readOnly
                      rows={5}
                      style={{
                        minHeight: "6em",
                        maxHeight: "20vh",
                        overflowY: "auto",
                      }}
                    />
                  </div>
                ))} */}
              </div>
              <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowDialog(false)}>
                  Discard
                </AlertDialogAction>
                <AlertDialogAction onClick={() => setShowDialog(false)}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
