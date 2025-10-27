import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { AgentBlock } from "@/types/types";
import { ImageUploader } from "./ImageUploader";

interface AgentBlockPrimaryInputProps {
  block: AgentBlock;
  onUpdate: (blockData: Partial<AgentBlock>) => void;
  onRunBlock: (blockNumber: number) => Promise<void>;
}

export function AgentBlockPrimaryInput({
  block,
  onUpdate,
  onRunBlock,
}: AgentBlockPrimaryInputProps) {
  const [isRunning, setIsRunning] = useState(false);

  const handleRunBlock = async () => {
    setIsRunning(true);
    try {
      await onRunBlock(block.blockNumber);
    } catch (error) {
      console.error("Error running block:", error);
    } finally {
      setIsRunning(false);
    }
  };

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

      {/* Image Upload */}
      <div className="space-y-2">
        <Label className="text-white">Images</Label>
        <ImageUploader
          images={block.images || []}
          onImagesChange={(images) => {
            console.log("🔍 AgentBlockPrimaryInput onImagesChange:", {
              images,
              imagesLength: images.length,
              firstImage: images[0],
              blockNumber: block.blockNumber,
            });
            const updateData = {
              images,
              imageMode: images && images.length > 0,
            };
            console.log(
              "🔍 AgentBlockPrimaryInput calling onUpdate with:",
              updateData
            );
            onUpdate(updateData);
          }}
          maxSize={2 * 1024 * 1024}
        />
      </div>

      {/* Run Button */}
      <div className="pt-4">
        <Button
          onClick={handleRunBlock}
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? "Running..." : "Run Block"}
        </Button>
      </div>
    </div>
  );
}
