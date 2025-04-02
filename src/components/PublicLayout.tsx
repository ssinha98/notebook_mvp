import { PublicDynamicHeader } from "@/components/custom_components/PublicDynamicHeader";
import { Toaster } from "sonner";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="min-h-screen bg-background">
        <PublicDynamicHeader
          onMenuClick={() => {}}
          onSettingsClick={() => {}}
          onHelpClick={() => {}}
        />
        <main>{children}</main>
        <Toaster />
      </div>
    </>
  );
}
