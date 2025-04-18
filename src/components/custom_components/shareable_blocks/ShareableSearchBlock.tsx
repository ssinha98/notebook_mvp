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
import { Card, CardContent } from "@/components/ui/card";

interface ImageResult {
  url: string;
  title: string;
  analysisResult?: string;
}

interface ShareableSearchBlockProps {
  blockNumber: number;
  engine: "search" | "news" | "finance" | "markets" | "image";
  query: string;
  limit: number;
  topic?: string;
  section?: string;
  timeWindow?: string;
  trend?: string;
  region?: string;
  prompt?: string;
  isProcessing?: boolean;
  thinkingEmoji?: string;
  isCompleted?: boolean;
  output?: string;
  imageResults?: ImageResult[];
}

const SEARCH_BLOCK_DESCRIPTION =
  "Search blocks allow your agent to perform web searches, news searches, financial data lookups, market analysis, and image searches. They can gather information from various sources to help with analysis and decision-making.";

const ShareableSearchBlock: React.FC<ShareableSearchBlockProps> = ({
  blockNumber,
  engine,
  query,
  limit,
  topic,
  section,
  timeWindow,
  trend,
  region,
  prompt,
  isProcessing,
  thinkingEmoji,
  isCompleted,
  output,
  imageResults,
}) => {
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
              Search <Info className="h-3 w-3" />
            </Badge>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-gray-900 border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">
                Search Block
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-400">
                {SEARCH_BLOCK_DESCRIPTION}
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
          <p className="text-sm text-gray-400 mb-2">Engine:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{engine}</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Query:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{query}</span>
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-400 mb-2">Limit:</p>
          <div className="bg-gray-800 p-3 rounded-lg">
            <span className="text-white">{limit}</span>
          </div>
        </div>

        {prompt && (
          <div>
            <p className="text-sm text-gray-400 mb-2">
              Prompt - you want us to run across each of the search results:
            </p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{prompt}</span>
            </div>
          </div>
        )}

        {topic && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Topic:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{topic}</span>
            </div>
          </div>
        )}

        {section && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Section:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{section}</span>
            </div>
          </div>
        )}

        {timeWindow && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Time Window:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{timeWindow}</span>
            </div>
          </div>
        )}

        {trend && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Trend:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{trend}</span>
            </div>
          </div>
        )}

        {region && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Region:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{region}</span>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="flex justify-center mt-4">
            <span className="text-2xl">{thinkingEmoji}</span>
          </div>
        )}

        {isCompleted && engine === "image" && imageResults && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Results:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {imageResults.map((result, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardContent className="p-4">
                    <img
                      src={result.url}
                      alt={result.title}
                      className="w-full h-48 object-cover rounded-lg mb-3"
                    />
                    <h4 className="text-white font-medium mb-2">
                      {result.title}
                    </h4>
                    {result.analysisResult && (
                      <p className="text-sm text-gray-400">
                        {result.analysisResult}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {isCompleted && output && engine !== "image" && (
          <div className="mt-4">
            <p className="text-sm text-gray-400 mb-2">Output:</p>
            <div className="bg-gray-800 p-3 rounded-lg">
              <span className="text-white">{output}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareableSearchBlock;
