import React, { useState } from "react";
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
}

const ContactBlock: React.FC<ContactBlockProps> = ({
  blockNumber,
  onDeleteBlock,
  onSave,
  onClose,
}) => {
  const [channel, setChannel] = useState("email");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

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

  const handleClear = () => {
    setRecipient("");
    setSubject("");
    setBody("");
  };

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Contact Block #{blockNumber}
        </h3>
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

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveAndClose}>Save and Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ContactBlock;
