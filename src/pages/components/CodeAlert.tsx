import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface CodeAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CodeAlert: React.FC<CodeAlertProps> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl bg-[#1e1e1e]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Agent Chain Code
          </AlertDialogTitle>
          <AlertDialogDescription>
            Coming soon! All the code for your agent chain, at your disposal
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
          Close
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CodeAlert;
