import React, { useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Mail, Slack, MessageSquare } from "lucide-react";
import { api } from "@/tools/api";
import { useVariableStore } from "@/lib/variableStore";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";

interface ContactBlockProps {
  blockNumber: number;
  onDeleteBlock?: (blockNumber: number) => void;
  onSave?: (values: {
    channel: string;
    recipient: string;
    subject: string;
    body: string;
  }) => void;
  onClose?: () => void;
  initialChannel?: string;
  initialRecipient?: string;
  initialSubject?: string;
  initialBody?: string;
  onRun?: () => void;
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
}

// Add ref interface for block processing
export interface ContactBlockRef {
  processBlock: () => Promise<boolean>;
}

const ContactBlock = forwardRef<ContactBlockRef, ContactBlockProps>(
  (
    {
      blockNumber,
      onDeleteBlock,
      onSave,
      onClose,
      initialChannel = "email",
      initialRecipient = "",
      initialSubject = "",
      initialBody = "",
      isProcessing = false,
      onProcessingChange = () => {},
    },
    ref
  ) => {
    const [channel, setChannel] = useState(initialChannel);
    const [recipient, setRecipient] = useState(initialRecipient);
    const [subject, setSubject] = useState(initialSubject);
    const [body, setBody] = useState(initialBody);
    const storeVariables = useVariableStore((state) => state.variables);

    // Add store hook for updating block names
    const { updateBlockName } = useSourceStore();

    // Get current block to display its name
    const currentBlock = useSourceStore((state) =>
      state.blocks.find((block) => block.blockNumber === blockNumber)
    );

    // Add helper function to process variables in text
    const processVariablesInText = (text: string): string => {
      const regex = /{{(.*?)}}/g;
      return text.replace(regex, (match, varName) => {
        const variable = useVariableStore
          .getState()
          .getVariableByName(varName.trim());

        // Handle different types of variable values
        if (!variable?.value) return match;

        if (typeof variable.value === "string") {
          return variable.value;
        } else if (Array.isArray(variable.value)) {
          // Handle table variables by converting to string representation
          return `Table with ${variable.value.length} rows`;
        } else {
          // Handle other types
          return String(variable.value);
        }
      });
    };

    // Add helper function to format variables in UI
    const formatTextWithVariables = (text: string) => {
      const regex = /{{(.*?)}}/g;
      const parts = [];
      let lastIndex = 0;

      for (const match of text.matchAll(regex)) {
        const [fullMatch, varName] = match;
        const startIndex = match.index!;
        const trimmedName = varName.trim();
        const varExists = Object.values(storeVariables).some(
          (v) => v.name === trimmedName
        );

        if (startIndex > lastIndex) {
          parts.push(text.slice(lastIndex, startIndex));
        }

        parts.push(
          <span
            key={startIndex}
            className={varExists ? "font-bold text-blue-400" : "text-red-400"}
          >
            {fullMatch}
          </span>
        );

        lastIndex = startIndex + fullMatch.length;
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts.length ? parts : text;
    };

    const handleDeleteBlock = () => {
      if (typeof onDeleteBlock === "function") {
        onDeleteBlock(blockNumber);
      } else {
        console.error("onDeleteBlock is not properly defined");
      }
    };

    const handleSaveAndClose = () => {
      if (onSave) {
        onSave({ channel, recipient, subject, body });
      }
      if (onClose) {
        onClose();
      }
    };

    const handleProcessBlock = async () => {
      try {
        onProcessingChange(true);
        const processedRecipient = processVariablesInText(recipient);
        const processedSubject = processVariablesInText(subject);
        const processedBody = processVariablesInText(body);

        const response = await api.post("/api/send-email", {
          email: processedRecipient,
          subject: processedSubject,
          body: processedBody,
        });

        if (response.success) {
          console.log("Email sent successfully to:", response.sent_to);
          return true;
        } else {
          console.error("Failed to send email:", response.error);
          return false;
        }
      } catch (error) {
        console.error("Error processing contact block:", error);
        return false;
      } finally {
        onProcessingChange(false);
      }
    };

    // Expose processBlock to parent components
    useImperativeHandle(ref, () => ({
      processBlock: handleProcessBlock,
    }));

    return (
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              Contact Block #{blockNumber}
            </h3>
            <BlockNameEditor
              blockName={currentBlock?.name || `Contact Block ${blockNumber}`}
              blockNumber={blockNumber}
              onNameUpdate={updateBlockName}
            />
          </div>
          <Popover>
            <PopoverTrigger>
              <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
                ⚙️
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={handleDeleteBlock}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-300 min-w-[80px]">Channel:</span>
            <Select value={channel} onValueChange={setChannel}>
              <SelectTrigger className="w-[220px]">
                <SelectValue>
                  {channel === "email" ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>Email</span>
                    </div>
                  ) : channel === "slack" ? (
                    <div className="flex items-center gap-2">
                      <Slack className="h-4 w-4" />
                      <span>Slack</span>
                      <Badge
                        variant="outline"
                        className="ml-2 px-2 py-0 h-5 text-xs"
                      >
                        Coming soon
                      </Badge>
                    </div>
                  ) : channel === "teams" ? (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Teams</span>
                      <Badge
                        variant="outline"
                        className="ml-2 px-2 py-0 h-5 text-xs"
                      >
                        Coming soon
                      </Badge>
                    </div>
                  ) : (
                    "Select channel"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="min-w-[220px]">
                <SelectItem value="email" className="pr-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
                <SelectItem value="slack" className="pr-3">
                  <div className="flex items-center gap-2">
                    <Slack className="h-4 w-4" />
                    <span>Slack</span>
                    <Badge
                      variant="outline"
                      className="ml-2 px-2 py-0 h-5 text-xs"
                    >
                      Coming soon
                    </Badge>
                  </div>
                </SelectItem>
                <SelectItem value="teams" className="pr-3">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span>Teams</span>
                    <Badge
                      variant="outline"
                      className="ml-2 px-2 py-0 h-5 text-xs"
                    >
                      Coming soon
                    </Badge>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator className="my-4" />

          {channel === "email" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-300 min-w-[80px]">Recipient:</span>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200"
                  placeholder="Enter recipient"
                />
              </div>
              {recipient && (
                <div className="preview mt-2 text-gray-300 pl-[88px]">
                  {formatTextWithVariables(recipient)}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-gray-300 min-w-[80px]">Subject:</span>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200"
                  placeholder="Enter subject"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-gray-300">Body:</span>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-gray-200 min-h-[120px]"
                  placeholder="Enter message body"
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-400">
              {channel.charAt(0).toUpperCase() + channel.slice(1)} integration
              coming soon!
            </div>
          )}

          <div className="flex justify-start gap-2 mt-4">
            <Button onClick={handleSaveAndClose} variant="outline">
              Save
            </Button>
            <Button
              onClick={handleProcessBlock}
              variant="default"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Sending...
                </>
              ) : (
                "Run"
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }
);

ContactBlock.displayName = "ContactBlock";

export default ContactBlock;
