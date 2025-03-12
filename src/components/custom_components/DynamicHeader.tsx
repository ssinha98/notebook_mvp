import { Button } from "@/components/ui/button";
import { NavigationDrawer } from "@/components/ui/NavigationDrawer";
import { useRouter } from "next/router";
import {
  ExperimentOutlined,
  KeyOutlined,
  ToolOutlined,
  CodeOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

interface DynamicHeaderProps {
  onApiKeyClick: () => void;
  onToolsClick: () => void;
  onCodeClick: () => void;
  onVideoGuideClick: () => void;
}

export function DynamicHeader({
  onApiKeyClick,
  onToolsClick,
  onCodeClick,
  onVideoGuideClick,
}: DynamicHeaderProps) {
  const router = useRouter();

  const renderPageActions = () => {
    switch (router.pathname) {
      case "/notebook":
        return (
          <div className="flex items-center gap-4">
            <Button className="flex items-center" onClick={onVideoGuideClick}>
              <VideoCameraOutlined />
              Guide
            </Button>
            {/* <Button onClick={onApiKeyClick}>
              <KeyOutlined />
              API Keys
            </Button> */}
            {/* <Button onClick={onToolsClick}>
              <ToolOutlined />
              Tools
            </Button> */}
            {/* <Button onClick={onCodeClick}>
              <CodeOutlined />
              Code
            </Button> */}
          </div>
        );
      case "/agents":
        return (
          <div className="flex items-center gap-4">
            {/* //     <Button>Create New Agent</Button> */}
          </div>
        );
      case "/files":
        return (
          <div className="flex items-center gap-4">
            {/* <Button>Upload File</Button> */}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-black">
      <div className="container mx-auto flex h-14 items-center justify-between">
        <div className="flex items-center">
          <NavigationDrawer />
          <div className="flex items-center gap-2 ml-4">
            <ExperimentOutlined style={{ fontSize: "24px" }} />
            <span className="font-bold">lab</span>
          </div>
        </div>
        {renderPageActions()}
      </div>
    </header>
  );
}
