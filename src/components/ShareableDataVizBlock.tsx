import type { ShareableDataVizBlock } from "@/types/shareable_blocks";
import { PiChartScatterDuotone } from "react-icons/pi";
import { BiScatterChart } from "react-icons/bi";
import { GiHistogram } from "react-icons/gi";
import { AiOutlineBoxPlot } from "react-icons/ai";
import { FaChartArea, FaChartLine } from "react-icons/fa";
import { FcHeatMap } from "react-icons/fc";
import { TbChartHistogram } from "react-icons/tb";
import { FiMap } from "react-icons/fi";
import { Badge } from "@/components/ui/badge";
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
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Info } from "lucide-react";
import { RxMagicWand } from "react-icons/rx";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

export default function ShareableDataVizBlock({
  blockNumber,
  chosenChart,
  source,
  context,
  pointers,
  isProcessing,
  isCompleted,
  thinkingEmoji,
  output,
}: ShareableDataVizBlock) {
  // Find the selected chart option
  const selectedChart =
    CHART_OPTIONS.find((opt) => opt.value === chosenChart) || CHART_OPTIONS[0];

  return (
    <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 mb-4">
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-white mr-3">
          Block {blockNumber}
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

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-2">Chart Type:</p>
          <div className="flex items-center gap-2">
            <Select value={selectedChart.value} onValueChange={() => {}}>
              <SelectTrigger className="w-full bg-gray-800 border-gray-700 cursor-pointer">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4">{selectedChart.icon}</span>
                    <span>{selectedChart.label}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {CHART_OPTIONS.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="cursor-not-allowed opacity-50"
                  >
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
          <p className="text-sm text-gray-400 mb-2">Data Source:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{source}</span>
          </div>
        </div>

        {context && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Context:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{context}</span>
            </div>
          </div>
        )}

        {pointers && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Pointers:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{pointers}</span>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <span>{thinkingEmoji}</span>
            <span>Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
}
