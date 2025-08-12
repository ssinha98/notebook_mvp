import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { DeepResearchAgentBlock } from "@/types/types";

interface DeepResearchAgentPrimaryInputProps {
  block: DeepResearchAgentBlock;
  onUpdate: (blockData: Partial<DeepResearchAgentBlock>) => void;
}

export function DeepResearchAgentPrimaryInput({
  block,
  onUpdate,
}: DeepResearchAgentPrimaryInputProps) {
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

      {/* Research Topic */}
      <div className="space-y-2">
        <Label htmlFor="topic" className="text-white">
          Research Topic
        </Label>
        <Input
          id="topic"
          value={block.topic || ""}
          onChange={(e) => onUpdate({ topic: e.target.value })}
          placeholder="Enter research topic..."
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}
