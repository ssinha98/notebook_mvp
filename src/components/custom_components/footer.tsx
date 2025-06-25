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
import { FaDatabase, FaListAlt, FaGoogleDrive } from "react-icons/fa";
import { SiMinutemailer } from "react-icons/si";
import {
  IoPlaySkipForwardCircle,
  IoSearchCircle,
  IoGlobeOutline,
  IoCodeSlash,
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
import { SiMakerbot } from "react-icons/si";
import Image from "next/image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import router from "next/router";
import InputVariablesSheet from "@/components/custom_components/InputVariablesSheet";
import { PiChartScatterDuotone } from "react-icons/pi";

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

const recurrencePresets = [
  { label: "Does not repeat", value: "none" },
  { label: "Every day", value: "every_day" },
  { label: "Every week on Friday", value: "every_week_on_friday" },
  { label: "Every weekday (Monday to Friday)", value: "every_weekday" },
  { label: "Custom", value: "custom" },
];

const daysOfWeek = [
  { label: "S", value: "S" },
  { label: "M", value: "M" },
  { label: "T", value: "T" },
  { label: "W", value: "W" },
  { label: "T", value: "Th" },
  { label: "F", value: "F" },
  { label: "S", value: "Sa" },
];

type RecurrenceRule = {
  type: "preset" | "custom";
  preset?: string;
  interval?: number;
  unit?: "day" | "week" | "month" | "year";
  daysOfWeek?: string[];
  ends?: {
    type: "never" | "on" | "after";
    date?: Date | null;
    occurrences?: number;
  };
};

const defaultRecurrence: RecurrenceRule = {
  type: "preset",
  preset: "none",
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
  const [deployType, setDeployType] = useState<string>("");
  const [isDeployed, setIsDeployed] = useState(false);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [isEmailConfigOpen, setIsEmailConfigOpen] = useState(false);
  const [isScheduleConfigOpen, setIsScheduleConfigOpen] = useState(false);

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
      id: "data",
      icon: <FaDatabase className="text-2xl" />,
      label: "Data & Variables",
      tooltip: "Load in some data...",
      onClick: () => {
        setIsToolsSheetOpen(true);
      },
    },
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
    {
      id: "codeblock",
      icon: <IoCodeSlash className="text-2xl" />,
      label: "Code Block",
      tooltip: "Add a code block...",
      onClick: () => {
        console.log("Adding code block");
        addBlockToNotebook({
          type: "codeblock",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Code ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          language: "python",
          code: "",
          outputVariable: null,
          variables: [],
          status: "tbd",
        });
      },
    },
    {
      id: "make",
      icon: (
        <Image
          src="https://images.ctfassets.net/un655fb9wln6/3xu9WYYJyMScG7FKnuVd1V/c4072d425c64525ea94ae9b60093fbaa/Make-Icon-Circle-Purple.svg"
          alt="Make.com"
          width={32}
          height={32}
        />
      ),
      label: "Make.com Integration",
      tooltip: "Add a Make.com webhook integration...",
      onClick: () => {
        addBlockToNotebook({
          type: "make",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Make ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          webhookUrl: "",
          parameters: [{ key: "", value: "" }],
        });
      },
    },
    {
      id: "excelagent",
      icon: <div className="text-2xl">📊</div>,
      label: "Excel Agent",
      tooltip: "Add an Excel processing block...",
      onClick: () => {
        addBlockToNotebook({
          type: "excelagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Excel ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          fileUrl: "",
          sheetName: "",
          range: "",
          operations: [],
        });
      },
    },
    {
      id: "instagramagent",
      icon: <div className="text-2xl">📸</div>,
      label: "Instagram Agent",
      tooltip: "Add an Instagram processing block...",
      onClick: () => {
        addBlockToNotebook({
          type: "instagramagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Instagram ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          url: "",
          postCount: 5,
        });
      },
    },
    {
      id: "deepresearchagent",
      icon: <div className="text-2xl">🔍</div>,
      label: "Deep Research Agent",
      tooltip: "Add a deep research block...",
      onClick: () => {
        addBlockToNotebook({
          type: "deepresearchagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Deep Research ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          topic: "",
        });
      },
    },
    {
      id: "pipedriveagent",
      icon: (
        <img
          src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQMiaXM3Qt8jYH_v3BxmqK7HNwEeADjKmVI6w&s"
          alt="Pipedrive"
          className="w-8 h-8 rounded"
        />
      ),
      label: "Pipedrive Agent",
      tooltip: "Add a Pipedrive CRM integration block...",
      onClick: () => {
        addBlockToNotebook({
          type: "pipedriveagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Pipedrive ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          prompt: "",
        });
      },
    },
    {
      id: "datavizagent",
      icon: <PiChartScatterDuotone className="text-2xl" />,
      label: "Data Visualization",
      tooltip: "Create charts and visualizations...",
      onClick: () => {
        addBlockToNotebook({
          type: "datavizagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `DataViz ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          prompt: "",
          chartType: "smart",
          outputVariable: null,
        });
      },
    },
    {
      id: "clickupagent",
      icon: <FaListAlt className="w-5 h-5" />,
      label: "ClickUp Agent",
      tooltip: "Add ClickUp Agent block",
      onClick: () =>
        addBlockToNotebook({
          type: "clickupagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `ClickUp ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          prompt: "",
        }),
    },
    {
      id: "googledriveagent",
      icon: <FaGoogleDrive className="w-5 h-5" />,
      label: "Google Drive Agent",
      tooltip: "Add Google Drive Agent block",
      onClick: () =>
        addBlockToNotebook({
          type: "googledriveagent",
          blockNumber: nextBlockNumber,
          id: crypto.randomUUID(),
          name: `Google Drive ${nextBlockNumber}`,
          agentId: useAgentStore.getState().currentAgent?.id || "",
          systemPrompt: "",
          userPrompt: "",
          saveAsCsv: false,
          prompt: "",
        }),
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

  const ApiConfigAlert = () => {
    const currentAgent = useAgentStore((state) => state.currentAgent);
    const endpoint = `POST https://usesolari.ai/api/agents/${currentAgent?.id}`;

    const handleCopyEndpoint = () => {
      navigator.clipboard.writeText(endpoint);
      toast("API endpoint copied to clipboard", {
        action: {
          label: "Close",
          onClick: () => toast.dismiss(),
        },
      });
    };

    return (
      <AlertDialog open={isApiConfigOpen} onOpenChange={setIsApiConfigOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>API Configuration</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                API Endpoint
              </label>
              <div className="flex gap-2">
                <Input
                  value={endpoint}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyEndpoint}
                  className="shrink-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <Button
              variant="destructive"
              onClick={() => setIsApiConfigOpen(false)}
            >
              Close
            </Button>
            {/* <Button
              onClick={() => {
                setIsApiConfigOpen(false);
                setIsDeployed(true);
              }}
            >
              Save and Close
            </Button> */}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  const EmailConfigAlert = () => (
    <AlertDialog open={isEmailConfigOpen} onOpenChange={setIsEmailConfigOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Email Configuration</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="py-4">
          <Button
            onClick={() => router.push("/settings")}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            Connect agent to inbox
          </Button>
        </div>
        <AlertDialogFooter>
          <Button
            variant="destructive"
            onClick={() => setIsEmailConfigOpen(false)}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              setIsEmailConfigOpen(false);
              setIsDeployed(true);
            }}
          >
            Save and Close
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const ScheduleConfigAlert = () => {
    const [step, setStep] = useState<1 | 2>(1);
    const [recurrence, setRecurrence] =
      useState<RecurrenceRule>(defaultRecurrence);

    // Custom builder state
    const [interval, setInterval] = useState(1);
    const [unit, setUnit] = useState<"day" | "week" | "month" | "year">("week");
    const [selectedDays, setSelectedDays] = useState<string[]>(["F"]);
    const [endsType, setEndsType] = useState<"never" | "on" | "after">("never");
    const [endsDate, setEndsDate] = useState<Date | null>(null);
    const [endsOccurrences, setEndsOccurrences] = useState(1);

    // Handle preset selection
    const handlePresetSelect = (preset: string) => {
      if (preset === "custom") {
        setStep(2);
        setRecurrence({
          type: "custom",
          interval,
          unit,
          daysOfWeek: selectedDays,
          ends: {
            type: endsType,
            date: endsDate,
            occurrences: endsOccurrences,
          },
        });
      } else {
        setRecurrence({ type: "preset", preset });
        // Save immediately for non-custom, or you can require hitting Save
      }
    };

    // Handle custom save
    const handleCustomSave = () => {
      const rule: RecurrenceRule = {
        type: "custom",
        interval,
        unit,
        daysOfWeek: selectedDays,
        ends: { type: endsType, date: endsDate, occurrences: endsOccurrences },
      };
      setRecurrence(rule);
      console.log("Saved recurrence rule:", rule);
      setIsScheduleConfigOpen(false);
      setStep(1);
    };

    // Handle preset save
    const handlePresetSave = () => {
      console.log("Saved recurrence rule:", recurrence);
      setIsScheduleConfigOpen(false);
      setStep(1);
    };

    // Day selection toggle
    const toggleDay = (day: string) => {
      setSelectedDays((prev) =>
        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
      );
    };

    return (
      <AlertDialog
        open={isScheduleConfigOpen}
        onOpenChange={setIsScheduleConfigOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Event Repeat</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            {step === 1 ? (
              <div>
                <div className="flex flex-col gap-2">
                  {recurrencePresets.map((preset) => (
                    <Button
                      key={preset.value}
                      variant={
                        recurrence.preset === preset.value
                          ? "default"
                          : "outline"
                      }
                      className="w-full justify-start"
                      onClick={() => handlePresetSelect(preset.value)}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={handlePresetSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                {/* Repeat every [n] [unit] */}
                <div className="flex items-center gap-2 mb-4">
                  <span>Repeat every</span>
                  <Input
                    type="number"
                    min={1}
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    className="w-16"
                  />
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white"
                  >
                    <option value="day">days</option>
                    <option value="week">weeks</option>
                    <option value="month">months</option>
                    <option value="year">years</option>
                  </select>
                </div>
                {/* Repeat on */}
                {unit === "week" && (
                  <div className="mb-4">
                    <span className="block mb-2">Repeat on</span>
                    <div className="flex gap-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                        <Button
                          key={d + idx}
                          variant={
                            selectedDays.includes(d) ? "default" : "outline"
                          }
                          className={`rounded-full w-8 h-8 p-0 ${selectedDays.includes(d) ? "bg-blue-600 text-white" : ""}`}
                          onClick={() => toggleDay(d)}
                        >
                          {d}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Ends */}
                <div className="mb-4">
                  <span className="block mb-2">Ends</span>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={endsType === "never"}
                        onChange={() => setEndsType("never")}
                      />
                      Never
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={endsType === "on"}
                        onChange={() => setEndsType("on")}
                      />
                      On
                      {endsType === "on" && (
                        <Calendar
                          required
                          mode="single"
                          selected={endsDate || undefined}
                          onSelect={setEndsDate}
                          className="ml-2"
                        />
                      )}
                      {endsType === "on" && endsDate && (
                        <span className="ml-2 text-sm text-gray-400">
                          {format(endsDate, "PPP")}
                        </span>
                      )}
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={endsType === "after"}
                        onChange={() => setEndsType("after")}
                      />
                      After
                      {endsType === "after" && (
                        <Input
                          type="number"
                          min={1}
                          value={endsOccurrences}
                          onChange={(e) =>
                            setEndsOccurrences(Number(e.target.value))
                          }
                          className="w-16 ml-2"
                        />
                      )}
                      {endsType === "after" && <span>occurrence(s)</span>}
                    </label>
                  </div>
                </div>
                <div className="flex justify-between mt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                  <Button
                    onClick={handleCustomSave}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                setIsScheduleConfigOpen(false);
                setStep(1);
              }}
            >
              Close
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  };

  // const ScheduleConfigAlert = () => (
  //   <AlertDialog
  //     open={isScheduleConfigOpen}
  //     onOpenChange={setIsScheduleConfigOpen}
  //   >
  //     <AlertDialogContent>
  //       <AlertDialogHeader>
  //         <AlertDialogTitle>Schedule Configuration</AlertDialogTitle>
  //       </AlertDialogHeader>
  //       <div className="py-4">
  //         <p>Schedule configuration settings will go here</p>
  //       </div>
  //       <AlertDialogFooter>
  //         <Button
  //           variant="destructive"
  //           onClick={() => setIsScheduleConfigOpen(false)}
  //         >
  //           Close
  //         </Button>
  //         <Button
  //           onClick={() => {
  //             setIsScheduleConfigOpen(false);
  //             setIsDeployed(true);
  //           }}
  //         >
  //           Save and Close
  //         </Button>
  //       </AlertDialogFooter>
  //     </AlertDialogContent>
  //   </AlertDialog>
  // );

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
            <div className="flex items-center gap-2">
              <Select
                value={deployType}
                onValueChange={(value) => {
                  setDeployType(value);
                  setIsDeployed(false); // Reset deployed state when type changes
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select deployment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
              <Button
                style={{ backgroundColor: "#09CE6B", color: "white" }}
                disabled={isProcessing || !deployType}
                onClick={() => {
                  console.log("Deploying agent with type:", deployType);
                  switch (deployType) {
                    case "api":
                      setIsApiConfigOpen(true);
                      break;
                    case "email":
                      setIsEmailConfigOpen(true);
                      break;
                    case "scheduled":
                      setIsScheduleConfigOpen(true);
                      break;
                    case "manual":
                      setIsDeployed(true);
                      break;
                  }
                }}
              >
                {isDeployed ? (
                  <>
                    <span>✓</span>
                    Deployed as {deployType} agent
                  </>
                ) : (
                  <>
                    <CloudUploadOutlined />
                    Deploy Agent
                  </>
                )}
              </Button>
            </div>
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
            {/* <Button
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
            </Button> */}
            {/* <Button
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
            </Button> */}
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
        onAddVariable={onAddVariable}
      />
      <ApiConfigAlert />
      <EmailConfigAlert />
      <ScheduleConfigAlert />
    </>
  );
}
