// src/components/custom_components/WebAgentPrimaryInput.tsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { WebAgentBlock } from "@/types/types";

interface WebAgentPrimaryInputProps {
  block: WebAgentBlock;
  onUpdate: (updates: Partial<WebAgentBlock>) => void;
}

export function WebAgentPrimaryInput({
  block,
  onUpdate,
}: WebAgentPrimaryInputProps) {
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

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="url" className="text-white">
          Website URL
        </Label>
        <Input
          id="url"
          value={block.url || ""}
          onChange={(e) => onUpdate({ url: e.target.value })}
          placeholder="Enter website URL..."
          className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
        />
      </div>
    </div>
  );
}
