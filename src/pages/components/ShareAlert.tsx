import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface ShareAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ShareAlert: React.FC<ShareAlertProps> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl bg-[#1e1e1e]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Share Agent Chain
          </AlertDialogTitle>
          <AlertDialogDescription>
            Coming soon! The ability to share your chain with team members
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
          Close
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ShareAlert; 