import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import React from "react";

export function SessionExpiredAlert() {
  return (
    <AlertDialog open={true}>
      <AlertDialogContent className="bg-[#1e1e1e]">
        <AlertDialogHeader>
          <ExclamationTriangleIcon className="h-4 w-4 text-destructive" />
          <AlertDialogTitle className="text-white">
            Session Expired
          </AlertDialogTitle>
          <AlertDialogDescription>
            Your session has expired. Redirecting you to login...
          </AlertDialogDescription>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
}
