import { Button } from "@/components/ui/button";
import { useRouter } from "next/router";
import { ExperimentOutlined } from "@ant-design/icons";

interface PublicDynamicHeaderProps {
  onMenuClick?: () => void;
  onSettingsClick?: () => void;
  onHelpClick?: () => void;
}

export function PublicDynamicHeader({
  onMenuClick,
  onSettingsClick,
  onHelpClick,
}: PublicDynamicHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 flex">
          <Button
            variant="ghost"
            className="mr-2 px-0"
            onClick={() => router.push("/")}
          >
            <ExperimentOutlined className="h-6 w-6" />
            <span className="sr-only">Caio</span>
          </Button>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Button
              variant="default"
              className="bg-blue-600/80 hover:bg-blue-700/90"
              onClick={() => router.push("/notebook")}
            >
              Back to Notebook
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
