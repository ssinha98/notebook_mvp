import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { AgentBlock } from "@/types/types";

interface AgentBlockPrimaryInputProps {
  block: AgentBlock;
  onUpdate: (blockData: Partial<AgentBlock>) => void;
}

export function AgentBlockPrimaryInput({
  block,
  onUpdate,
}: AgentBlockPrimaryInputProps) {
  return (
    <div className="space-y-4">
      {/* Skip Block Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="skip"
          checked={block.skip || false}
          onCheckedChange={(checked) => onUpdate({ skip: checked as boolean })}
        />
        <Label htmlFor="skip" className="text-white">
          Skip Block
        </Label>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="systemPrompt" className="text-white">
          System Prompt
        </Label>
        <Textarea
          id="systemPrompt"
          value={block.systemPrompt || ""}
          onChange={(e) => onUpdate({ systemPrompt: e.target.value })}
          placeholder="Enter system prompt..."
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
        />
      </div>

      {/* User Prompt */}
      <div className="space-y-2">
        <Label htmlFor="userPrompt" className="text-white">
          User Prompt
        </Label>
        <Textarea
          id="userPrompt"
          value={block.userPrompt || ""}
          onChange={(e) => onUpdate({ userPrompt: e.target.value })}
          placeholder="Enter user prompt..."
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 min-h-[100px]"
        />
      </div>
    </div>
  );
}
