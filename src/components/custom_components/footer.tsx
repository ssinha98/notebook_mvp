import { CSSProperties, useState } from "react";
import {
  PlayCircleOutlined,
  ShareAltOutlined,
  CloudUploadOutlined,
  SaveOutlined,
  // ClearOutlined,
  UpOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import ShareAlert from "./ShareAlert";
import DeployAlert from "./DeployAlert";
import { useAgentStore } from "@/lib/agentStore";
import { useSourceStore } from "@/lib/store";
import { LuBrainCircuit } from "react-icons/lu";
import { FaDatabase } from "react-icons/fa";
import { SiMinutemailer } from "react-icons/si";
import {
  IoPlaySkipForwardCircle,
  IoSearchCircle,
  IoGlobeOutline,
} from "react-icons/io5";
import ToolsSheet from "./ToolsSheet";
import { useBlockManager } from "@/hooks/useBlockManager";
import { useToolsSheet } from "@/hooks/useToolsSheet";
import { Block, Variable } from "@/types/types";
import { auth } from "@/tools/firebase";
import { MdOutlineEmail } from "react-icons/md";
import { api } from "@/tools/api";
import { doc, setDoc, collection } from "firebase/firestore";
import { db } from "@/tools/firebase";

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

// const runButtonStyle: CSSProperties = {
//   ...buttonStyle,
//   backgroundColor: "#09CE6B",
//   color: "white",
//   border: "none",
// };

// const outlineButtonStyle: CSSProperties = {
//   ...buttonStyle,
//   backgroundColor: "transparent",
//   color: "#d1d5db",
//   border: "1px solid #4b5563",
// };

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
  // onClearPrompts?: () => void;
  isProcessing?: boolean;
  isPaused?: boolean;
  variables?: Variable[];
  onAddVariable?: (variable: Variable) => void;
  onAddCheckIn?: () => void;
  onResume?: () => void;
}

// Add this interface for tool buttons
interface ToolButton {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  onClick: () => void;
}

// Update the ToolsPanel to accept toolButtons as a prop
const ToolsPanel = ({
  isExpanded,
  onToggle,
  toolButtons,
}: {
  isExpanded: boolean;
  onToggle: () => void;
  toolButtons: ToolButton[];
}) => {
  return (
    <div
      className={`transition-all duration-300 ease-in-out bg-gray-900 border-t border-gray-700
        fixed bottom-[65px] w-full z-40
        ${isExpanded ? "h-[25vh]" : "h-10"}`}
    >
      <div
        className="flex justify-between items-center px-4 h-10 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 text-gray-300">
          <span className="text-base font-bold">Tools</span>
          <span className="text-xl">⚒️</span>
        </div>
        {isExpanded ? <DownOutlined /> : <UpOutlined />}
      </div>

      {isExpanded && (
        <div className="p-4 overflow-x-auto">
          <div className="flex gap-4 min-w-min">
            <TooltipProvider>
              {toolButtons.map((tool) => (
                <Tooltip key={tool.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex flex-col p-4 w-72 h-32 rounded-lg border border-gray-700 hover:bg-gray-800 flex-shrink-0"
                      onClick={tool.onClick}
                    >
                      <span className="text-[5rem]">{tool.icon}</span>
                      <span className="text-base text-gray-300 break-words w-full overflow-hidden text-center mt-2">
                        {tool.label}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tool.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Footer({
  onRun,
  // onClearPrompts,
  isProcessing = false,
  isPaused,
  variables = [],
  onAddVariable = () => {},
  onResume,
}: FooterProps) {
  const [isToolsPanelExpanded, setIsToolsPanelExpanded] = useState(false);
  const [isShareAlertOpen, setIsShareAlertOpen] = useState(false);
  const [isDeployAlertOpen, setIsDeployAlertOpen] = useState(false);
  const [isToolsSheetOpen, setIsToolsSheetOpen] = useState(false);

  // Add these from the store
  const addBlockToNotebook = useSourceStore(
    (state) => state.addBlockToNotebook
  );
  const nextBlockNumber = useSourceStore((state) => state.nextBlockNumber);

  // Add debugging to see current state
  const blocks = useSourceStore((state) => state.blocks);

  // Create the addNewBlock function
  const addNewBlock = () => {
    addBlockToNotebook({
      type: "agent",
      blockNumber: nextBlockNumber,
      systemPrompt: "",
      userPrompt: "",
      id: crypto.randomUUID(),
      name: `Agent ${nextBlockNumber}`,
      saveAsCsv: false,
      agentId: useAgentStore.getState().currentAgent?.id || "",
    });
  };

  // Add new function to handle check-in blocks with debugging
  const addNewCheckInBlock = () => {
    const newBlock = {
      type: "checkin" as const,
      blockNumber: nextBlockNumber,
      id: crypto.randomUUID(),
      name: `Check-in ${nextBlockNumber}`,
      agentId: useAgentStore.getState().currentAgent?.id || "",
      systemPrompt: "",
      userPrompt: "",
      saveAsCsv: false,
    };

    addBlockToNotebook(newBlock);
  };

  const { addBlock } = useBlockManager();
  // const { setIsToolsSheetOpen } = useToolsSheet();

  const toolButtons: ToolButton[] = [
    {
      id: "agent",
      icon: <LuBrainCircuit className="text-2xl" />,
      label: "Agent Block",
      tooltip: "Add a new agent block...",
      onClick: () => {
        addBlockToNotebook({
          type: "agent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Agent ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "You are a helpful assistant",
          userPrompt: "",
          saveAsCsv: false,
          outputVariable: null,
          sourceInfo: {
            nickname: "",
            downloadUrl: "",
          },
        });
      },
    },
    {
      id: "data",
      icon: <FaDatabase className="text-2xl" />,
      label: "Data and Transformations",
      tooltip: "Load in some data...",
      onClick: () => {
        setIsToolsSheetOpen(true);
      },
    },
    {
      id: "contact",
      icon: <SiMinutemailer className="text-2xl" />,
      label: "Contact",
      tooltip: "Have your agent send...",
      onClick: () => {
        addBlockToNotebook({
          type: "contact",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Contact ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          channel: "email",
          recipient: "",
          subject: "",
          body: "",
        });
      },
    },
    {
      id: "checkin",
      icon: <IoPlaySkipForwardCircle className="text-2xl" />,
      label: "Check In",
      tooltip: "Tell your agent to pause...",
      onClick: () => {
        addBlockToNotebook({
          type: "checkin",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Check-in ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
        });
      },
    },
    {
      id: "search",
      icon: <IoSearchCircle className="text-2xl" />,
      label: "Search Agent",
      tooltip: "Add a search agent block...",
      onClick: () => {
        addBlockToNotebook({
          type: "searchagent",
          blockNumber: nextBlockNumber,
          engine: "search",
          query: "",
          limit: 5,
          id: crypto.randomUUID(),
          name: `Search ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
        });
      },
    },
    {
      id: "webagent",
      icon: <IoGlobeOutline className="text-2xl" />,
      label: "Web Agent",
      tooltip: "Add a web agent block...",
      onClick: () => {
        addBlockToNotebook({
          type: "webagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Web ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          activeTab: "url",
          url: "",
          searchVariable: "",
          selectedVariableId: "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          results: [],
        });
      },
    },
  ];

  const { getBlockList } = useSourceStore();

  const sendCheckInEmail = async () => {
    try {
      const currentUser = auth.currentUser;
      console.log("Current user data:", {
        email: currentUser?.email,
        uid: currentUser?.uid,
        displayName: currentUser?.displayName,
      });

      if (!currentUser || !currentUser.email) {
        console.error("No user is logged in or no email available");
        return;
      }

      // Using the api utility instead of direct fetch
      const response = await api.get(
        `/api/send-checkin-email?email=${encodeURIComponent(currentUser.email)}`
      );

      if (response.success) {
        console.log("Email sent successfully to:", response.sent_to);
      } else {
        console.error("Failed to send email:", response.error);
      }
    } catch (error) {
      console.error("Error sending check-in email:", error);
    }
  };

  // const testFirebase = async () => {
  //   try {
  //     const userId = auth.currentUser?.uid;
  //     if (!userId) throw new Error("No user logged in");

  //     const testDocument = {
  //       full_name: "test variable",
  //       created_at: new Date().toISOString(), // Add timestamp for tracking
  //       userId, // Add userId for reference
  //     };

  //     await setDoc(
  //       doc(db, "users", userId, "test", "test-doc-1"), // Clean document ID
  //       testDocument
  //     );

  //     console.log("Document created at:", `users/${userId}/test/test-doc-1`);
  //     return { success: true, data: testDocument };
  //   } catch (error) {
  //     console.error("Test failed:", error);
  //     throw error; // Throw error to see full stack trace
  //   }
  // };

  return (
    <>
      <ToolsPanel
        isExpanded={isToolsPanelExpanded}
        onToggle={() => setIsToolsPanelExpanded(!isToolsPanelExpanded)}
        toolButtons={toolButtons}
      />
      <footer style={footerStyle}>
        <div style={containerStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Button
              style={{ backgroundColor: "#09CE6B", color: "white" }}
              disabled={isProcessing}
              onClick={() => {
                if (isPaused) {
                  onResume?.();
                } else {
                  onRun();
                }
              }}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Running...
                </>
              ) : isPaused ? (
                <>
                  <PlayCircleOutlined />
                  Continue
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

            {/* Add the test button */}
            {/* <Button variant="outline" onClick={getBlockList}>
              Test
            </Button> */}

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {/* <input
                type="number"
                style={inputStyle}
                defaultValue={1}
                min={1}
              /> */}
              {/* <span style={{ color: "#d1d5db" }}>runs</span> */}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Commenting out email button for now
            <Button
              variant="outline"
              onClick={sendCheckInEmail}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#1f2937"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <MdOutlineEmail className="mr-2" />
              Email
            </Button>
            */}
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
            {/* <Button
              variant="outline"
              onClick={testFirebase}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1f2937")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              Test Firebase
            </Button> */}
          </div>
        </div>
      </footer>
      <ShareAlert open={isShareAlertOpen} onOpenChange={setIsShareAlertOpen} />
      <DeployAlert
        open={isDeployAlertOpen}
        onOpenChange={setIsDeployAlertOpen}
      />
      <ToolsSheet
        open={isToolsSheetOpen}
        onOpenChange={setIsToolsSheetOpen}
        // variables={variables}
        onAddVariable={onAddVariable}
      />
    </>
  );
}
