import React, { useState } from "react";
import { Pencil } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BlockNameEditorProps {
  blockName: string;
  blockNumber: number;
  onNameUpdate: (blockNumber: number, newName: string) => void;
  className?: string;
}

const BlockNameEditor: React.FC<BlockNameEditorProps> = ({
  blockName,
  blockNumber,
  onNameUpdate,
  className = "",
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingName, setEditingName] = useState(blockName);

  const handleSave = () => {
    if (editingName.trim() && editingName.trim() !== blockName) {
      onNameUpdate(blockNumber, editingName.trim());
    }
    setIsDialogOpen(false);
  };

  const handleCancel = () => {
    setEditingName(blockName); // Reset to original name
    setIsDialogOpen(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <>
      <div className={`flex items-center gap-2 ${className}`}>
        <h3 className="text-lg font-semibold text-white">{blockName}</h3>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="p-1 text-gray-400 hover:text-white transition-colors rounded"
          title="Edit block name"
        >
          <Pencil size={16} />
        </button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-gray-900 border-gray-600">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Block Name</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <Input
              value={editingName}
              onChange={(e) => setEditingName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Enter block name"
              className="bg-gray-800 border-gray-600 text-white"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={!editingName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlockNameEditor;
