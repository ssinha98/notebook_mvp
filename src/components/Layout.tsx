import { DynamicHeader } from "@/components/custom_components/DynamicHeader";
import { SessionHandler } from "@/components/custom_components/SessionHandler";
import { useState } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isApiKeySheetOpen, setIsApiKeySheetOpen] = useState(false);
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);
  const [isVideoGuideOpen, setIsVideoGuideOpen] = useState(false);
  const [isCodeAlertOpen, setIsCodeAlertOpen] = useState(false);

  return (
    <>
      <SessionHandler />
      <div className="min-h-screen bg-background">
        <DynamicHeader
          onApiKeyClick={() => setIsApiKeySheetOpen(true)}
          onToolsClick={() => setIsToolsSheetOpen(true)}
          onCodeClick={() => setIsCodeAlertOpen(true)}
          onVideoGuideClick={() => setIsVideoGuideOpen(true)}
        />
        <main>{children}</main>
      </div>
    </>
  );
}
