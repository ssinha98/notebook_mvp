import { CSSProperties, useState } from "react";
import {
  PlayCircleOutlined,
  ShareAltOutlined,
  CloudUploadOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import ShareAlert from "./ShareAlert";
import DeployAlert from "./DeployAlert";

const footerStyle: CSSProperties = {
  position: "sticky",
  bottom: 0,
  zIndex: 50,
  width: "100%",
  borderTop: "1px solid #1f2937",
  backgroundColor: "rgba(17, 24, 39, 0.95)",
  backdropFilter: "blur(10px)",
};

const containerStyle: CSSProperties = {
  display: "flex",
  height: "64px",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "21px",
  maxWidth: "100%",
  margin: "0",
};

const buttonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "8px 12px",
  borderRadius: "4px",
  cursor: "pointer",
  fontSize: "14px",
};

const runButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "#09CE6B",
  color: "white",
  border: "none",
};

const outlineButtonStyle: CSSProperties = {
  ...buttonStyle,
  backgroundColor: "transparent",
  color: "#d1d5db",
  border: "1px solid #4b5563",
};

const inputStyle: CSSProperties = {
  width: "64px",
  padding: "4px 8px",
  backgroundColor: "#1f2937",
  border: "1px solid #4b5563",
  borderRadius: "4px",
  color: "white",
};

interface FooterProps {
  onRun: () => void;
  onClearPrompts?: () => void;
  isProcessing?: boolean;
}

export default function Footer({
  onRun,
  onClearPrompts,
  isProcessing = false,
}: FooterProps) {
  const [isShareAlertOpen, setIsShareAlertOpen] = useState(false);
  const [isDeployAlertOpen, setIsDeployAlertOpen] = useState(false);

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Button
            style={{ backgroundColor: "#09CE6B", color: "white" }}
            disabled={isProcessing}
            onClick={() => {
              console.log("run started");
              onRun();
            }}
          >
            {isProcessing ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Running...
              </>
            ) : (
              <>
                <PlayCircleOutlined />
                Run
              </>
            )}
            <span className="ml-2 text-xs border border-opacity-40 rounded px-1">
              ⌘↵
            </span>
          </Button>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="number" style={inputStyle} defaultValue={1} min={1} />
            <span style={{ color: "#d1d5db" }}>runs</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Button
            variant="outline"
            onClick={() => setIsShareAlertOpen(true)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1f2937")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <ShareAltOutlined />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsDeployAlertOpen(true)}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#1f2937")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "transparent")
            }
          >
            <CloudUploadOutlined />
            Deploy
          </Button>
        </div>
      </div>
      <ShareAlert open={isShareAlertOpen} onOpenChange={setIsShareAlertOpen} />
      <DeployAlert
        open={isDeployAlertOpen}
        onOpenChange={setIsDeployAlertOpen}
      />
    </footer>
  );
}
