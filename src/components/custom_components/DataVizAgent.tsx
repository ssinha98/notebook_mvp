import React, { useState, useImperativeHandle, forwardRef } from "react";
import { Button } from "@/components/ui/button";
import { api } from "@/tools/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RxMagicWand } from "react-icons/rx";
import { BiScatterChart } from "react-icons/bi";
import { GiHistogram } from "react-icons/gi";
import { AiOutlineBoxPlot } from "react-icons/ai";
import { FaChartArea, FaChartLine } from "react-icons/fa";
import { FcHeatMap } from "react-icons/fc";
import { TbChartHistogram } from "react-icons/tb";
import { FiMap } from "react-icons/fi";
import VariableDropdown from "./VariableDropdown";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";

const DATA_VIZ_BLOCK_DESCRIPTION =
  "Data visualization blocks allow your agent to create visual representations of data. They can generate charts, graphs, and other visualizations to help understand and communicate data insights.";

const CHART_OPTIONS = [
  { value: "smart", label: "Smart", icon: <RxMagicWand className="w-4 h-4" /> },
  { value: "line", label: "Line Chart", icon: "📈" },
  { value: "bar", label: "Bar Chart", icon: "📊" },
  {
    value: "scatter",
    label: "Scatter Plot",
    icon: <BiScatterChart className="w-4 h-4" />,
  },
  {
    value: "histogram",
    label: "Histogram",
    icon: <GiHistogram className="w-4 h-4" />,
  },
  {
    value: "boxplot",
    label: "Box Plot",
    icon: <AiOutlineBoxPlot className="w-4 h-4" />,
  },
  {
    value: "area",
    label: "Area Chart",
    icon: <FaChartArea className="w-4 h-4" />,
  },
  {
    value: "heatmap",
    label: "Heatmap",
    icon: <FcHeatMap className="w-4 h-4" />,
  },
  {
    value: "density",
    label: "Density Plot",
    icon: <TbChartHistogram className="w-4 h-4" />,
  },
  {
    value: "regression",
    label: "Regression",
    icon: <FaChartLine className="w-4 h-4" />,
  },
  { value: "map", label: "Map Chart", icon: <FiMap className="w-4 h-4" /> },
] as const;

interface DataVizAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onUpdateBlock: (blockNumber: number, updates: any) => void;
  initialPrompt?: string;
  initialChartType?: string;
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  onOpenTools?: () => void;
}

export interface DataVizAgentRef {
  processBlock: () => Promise<boolean>;
}

const DataVizAgent = forwardRef<DataVizAgentRef, DataVizAgentProps>(
  (props, ref) => {
    const [prompt, setPrompt] = useState(props.initialPrompt || "");
    const [selectedChartType, setSelectedChartType] = useState(
      props.initialChartType || "smart"
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [result, setResult] = useState<{
      download_url?: string;
      message?: string;
      success?: boolean;
    } | null>(null);
    const [selectedVariableId, setSelectedVariableId] = useState<string>("");
    const variables = useVariableStore((state) => state.variables);
    const currentAgent = useAgentStore((state) => state.currentAgent);

    const selectedChart =
      CHART_OPTIONS.find((opt) => opt.value === selectedChartType) ||
      CHART_OPTIONS[0];

    const handleVariableSelect = (value: string) => {
      if (value === "add_new" && props.onOpenTools) {
        props.onOpenTools();
      } else {
        setSelectedVariableId(value);
      }
    };

    const handleGenerateVisualization = async (): Promise<boolean> => {
      if (!prompt.trim()) {
        alert("Please enter a prompt for the visualization");
        return false;
      }

      setIsProcessing(true);
      setResult(null);
      props.onProcessingChange?.(true);

      try {
        const response = await api.post("/api/visual_agent", {
          prompt: prompt.trim(),
          chart_type: selectedChartType,
          user_id: "user1234",
        });

        setResult(response);

        if (response.success && response.download_url && selectedVariableId) {
          const selectedVariable = Object.values(variables).find(
            (v) => v.id === selectedVariableId
          );
          if (selectedVariable) {
            await useVariableStore
              .getState()
              .updateVariable(selectedVariableId, response.download_url);
          }
        }

        props.onUpdateBlock(props.blockNumber, {
          prompt: prompt.trim(),
          chartType: selectedChartType,
        });

        return response.success || false;
      } catch (error) {
        console.error("Error generating visualization:", error);
        setResult({
          success: false,
          message: error instanceof Error ? error.message : "An error occurred",
        });
        return false;
      } finally {
        setIsProcessing(false);
        props.onProcessingChange?.(false);
      }
    };

    const handleDeleteBlock = () => {
      props.onDeleteBlock(props.blockNumber);
    };

    useImperativeHandle(ref, () => ({
      processBlock: handleGenerateVisualization,
    }));

    return (
      <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">
              Block #{props.blockNumber}
            </h3>
            <AlertDialog>
              <AlertDialogTrigger>
                <Badge
                  variant="outline"
                  className="flex items-center gap-1 cursor-pointer hover:bg-gray-800"
                >
                  Data Visualization <Info className="h-3 w-3" />
                </Badge>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">
                    Data Visualization Block
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    {DATA_VIZ_BLOCK_DESCRIPTION}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogAction className="bg-gray-800 text-white hover:bg-gray-700">
                    Close
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Popover>
            <PopoverTrigger>
              <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
                ⚙️
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={handleDeleteBlock}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-400 mb-2">Chart Type:</p>
            <div className="flex items-center gap-2">
              <Select
                value={selectedChartType}
                onValueChange={setSelectedChartType}
              >
                <SelectTrigger className="w-full bg-gray-800 border-gray-700">
                  <SelectValue>
                    <div className="flex items-center gap-2">
                      <span className="w-4 h-4">{selectedChart.icon}</span>
                      <span>{selectedChart.label}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {CHART_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <span className="w-4 h-4">{option.icon}</span>
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 cursor-help text-gray-400 hover:text-gray-300" />
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    className="bg-gray-800 text-gray-200 border-gray-700 z-50"
                  >
                    <p className="text-sm">
                      {selectedChart.value === "smart"
                        ? "Agent decides what visualization would be best, given the data and goal"
                        : `Displays the data as a ${selectedChart.label.toLowerCase()}`}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-400 mb-2">Prompt:</p>
            <textarea
              className="w-full h-32 bg-gray-800 border border-gray-700 rounded p-3 text-gray-200 resize-none"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the visualization you want to create..."
            />
          </div>

          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
              onAddNew={props.onOpenTools}
            />
          </div>

          <div className="flex justify-end gap-2 p-4 border-t border-gray-700">
            <Button
              onClick={handleGenerateVisualization}
              disabled={isProcessing || !prompt.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Generating...
                </>
              ) : (
                "Generate Visualization"
              )}
            </Button>
          </div>

          {result && (
            <div className="mt-4 p-4 bg-gray-800 rounded border border-gray-700">
              {result.success && result.download_url ? (
                <div className="text-sm text-gray-300">
                  <span>Here's </span>
                  <a
                    href={result.download_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    your image
                  </a>
                  <span>!</span>
                  {result.message && (
                    <div className="mt-2 text-xs text-gray-400">
                      {result.message}
                    </div>
                  )}
                  {selectedVariableId && (
                    <div className="mt-2 text-sm text-green-400">
                      Saved as{" "}
                      {
                        Object.values(variables).find(
                          (v) => v.id === selectedVariableId
                        )?.name
                      }
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-red-400">
                  Error: {result.message || "Failed to generate visualization"}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

DataVizAgent.displayName = "DataVizAgent";

export default DataVizAgent;
