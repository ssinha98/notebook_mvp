import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface VideoGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const VideoGuide: React.FC<VideoGuideProps> = ({ open, onOpenChange }) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-4xl bg-[#1e1e1e]">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">
            Quick Start Guide
          </AlertDialogTitle>
          <AlertDialogDescription>
            Watch this short video to learn how to use the app.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="aspect-video w-full">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/kGfkL9LS3PU"
            title="Tutorial Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
        <AlertDialogCancel className="bg-gray-700 text-white hover:bg-gray-600">
          Close
        </AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default VideoGuide;
