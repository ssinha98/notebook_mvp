import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface DeployAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DeployAlert: React.FC<DeployAlertProps> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl bg-[#1e1e1e]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Deploy Agent Chain
          </AlertDialogTitle>
          <AlertDialogDescription>
            Coming soon! The ability to deploy your chain with team members
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
          Close
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeployAlert;
