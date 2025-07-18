import React from "react";
import { Button } from "@/components/ui/button";
import { StopCircle } from "lucide-react";

interface BlockButtonProps {
  isRunning: boolean;
  onRun: () => void;
  onCancel: () => void;
  runLabel?: string;
  runningLabel?: string;
  cancelLabel?: string;
  disabled?: boolean;
}

export const BlockButton: React.FC<BlockButtonProps> = ({
  isRunning,
  onRun,
  onCancel,
  runLabel = "Run",
  runningLabel = "Running...",
  cancelLabel = "Cancel",
  disabled = false,
}) => {
  return isRunning ? (
    <div className="flex gap-2">
      <Button disabled className="bg-blue-600 hover:bg-blue-700">
        <span className="animate-spin mr-2">⟳</span>
        {runningLabel}
      </Button>
      <Button
        onClick={onCancel}
        variant="outline"
        className="border-red-600 text-red-400 hover:bg-red-950"
      >
        <StopCircle className="h-3 w-3 mr-1" />
        {cancelLabel}
      </Button>
    </div>
  ) : (
    <Button
      onClick={onRun}
      disabled={disabled || isRunning}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Run
    </Button>
  );
};
