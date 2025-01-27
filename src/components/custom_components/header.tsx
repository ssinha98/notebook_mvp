import { CSSProperties, useState } from "react";
import {
  ExperimentOutlined,
  KeyOutlined,
  ToolOutlined,
  CodeOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { Button } from "@/components/ui/button";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger,
// } from "@/components/ui/sheet";
import VideoGuide from "./VideoGuide";
import CodeAlert from "./CodeAlert";

// import { Button } from "antd";

interface HeaderProps {
  onApiKeyClick: () => void;
  onToolsClick: () => void;
}

const headerStyle: CSSProperties = {
  //   position: "sticky",
  top: 0,
  zIndex: 50,
  width: "100%",
  borderBottom: "1px solid #1f2937",
  backgroundColor: "#333333",
  backdropFilter: "blur(10px)",
};

const containerStyle: CSSProperties = {
  display: "flex",
  height: "64px",
  padding: "21px",
  maxWidth: "100%",
  justifyContent: "space-between",
};

const logoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  color: "white",
  fontSize: "16px",
  fontWeight: "bold",
};

const navStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
};

// const buttonStyle: CSSProperties = {
//   background: "none",
//   border: "none",
//   color: "#d1d5db",
//   display: "flex",
//   alignItems: "center",
//   gap: "8px",
//   padding: "8px 12px",
//   borderRadius: "4px",
//   cursor: "pointer",
// };

export default function Header({ onApiKeyClick, onToolsClick }: HeaderProps) {
  const [isVideoGuideOpen, setIsVideoGuideOpen] = useState(false);
  const [isCodeAlertOpen, setIsCodeAlertOpen] = useState(false);

  return (
    <header style={headerStyle}>
      <div style={containerStyle}>
        <div style={logoStyle}>
          <ExperimentOutlined style={{ fontSize: "24px" }} />
          <span>lab</span>
        </div>
        <nav style={navStyle}>
          <Button
            className="flex items-center"
            onClick={() => setIsVideoGuideOpen(true)}
          >
            <VideoCameraOutlined />
            Guide
          </Button>
          <Button onClick={onApiKeyClick}>
            <KeyOutlined />
            API Keys
          </Button>
          <Button
            // style={buttonStyle}
            onClick={onToolsClick}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1f2937")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <ToolOutlined />
            Tools
          </Button>
          <Button
            onClick={() => setIsCodeAlertOpen(true)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1f2937")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <CodeOutlined />
            Code
          </Button>
        </nav>
      </div>
      <VideoGuide open={isVideoGuideOpen} onOpenChange={setIsVideoGuideOpen} />
      <CodeAlert open={isCodeAlertOpen} onOpenChange={setIsCodeAlertOpen} />
    </header>
  );
}
