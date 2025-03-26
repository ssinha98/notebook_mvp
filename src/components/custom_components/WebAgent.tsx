import React, {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { InfoIcon, XIcon, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useVariableStore } from "@/lib/variableStore";
import { Variable, WebAgentBlock, AgentBlock } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import { AgentBlockRef } from "@/components/custom_components/AgentBlock";
import { api } from "@/tools/api";
import ReactMarkdown from "react-markdown";
import { fileManager } from "@/tools/fileManager";
import { auth } from "@/tools/firebase";

interface WebAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onAddVariable: (variable: Variable) => void;
  onOpenTools?: () => void;
  onUpdateBlock?: (
    blockNumber: number,
    updates: Partial<WebAgentBlock>
  ) => void;
  initialActiveTab?: "url" | "variables";
  initialUrl?: string;
  initialSearchVariable?: string;
  initialSelectedVariableId?: string;
  initialResults?: Array<{ url: string; content: string }>;
  initialNickname?: string;
}

export interface WebAgentRef {
  processBlock: () => Promise<boolean>;
}

const WebAgent = forwardRef<WebAgentRef, WebAgentProps>((props, ref) => {
  const {
    blockNumber,
    onDeleteBlock,
    onAddVariable,
    onOpenTools,
    onUpdateBlock,
    initialActiveTab = "url",
    initialUrl = "",
    initialSearchVariable = "",
    initialSelectedVariableId = "",
    initialResults = [],
    initialNickname = "",
  } = props;
  const [activeTab, setActiveTab] = useState(initialActiveTab);
  const [url, setUrl] = useState(initialUrl);
  const [searchVariable, setSearchVariable] = useState(initialSearchVariable);
  const [selectedVariableId, setSelectedVariableId] = useState(
    initialSelectedVariableId
  );
  const [results, setResults] = useState(initialResults);
  const variables = useVariableStore((state) => state.variables) || {};
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState(initialNickname);
  const [isSaving, setIsSaving] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Dummy data for carousel testing
  const dummyResults = [
    { url: "https://example1.com", content: "Content from first website" },
    { url: "https://example2.com", content: "Content from second website" },
    { url: "https://example3.com", content: "Content from third website" },
  ];

  const handleSave = () => {
    if (onUpdateBlock) {
      const selectedVariable = Object.values(variables).find(
        (v) => v.id === selectedVariableId
      );

      onUpdateBlock(blockNumber, {
        activeTab,
        url,
        searchVariable,
        searchVariableId: selectedVariableId,
        selectedVariableId,
        selectedVariableName: selectedVariable?.name,
      });
    }
  };

  const handleUrlSave = () => {
    console.log("Saving URL:", url);
    handleSave();
  };

  useEffect(() => {
    handleSave();
  }, [activeTab, url, searchVariable, selectedVariableId]);

  // Add formatTextWithVariables function from AgentBlock
  const formatTextWithVariables = (text: string) => {
    const regex = /{{(.*?)}}/g;
    const parts = [];
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const [fullMatch, varName] = match;
      const startIndex = match.index!;
      const trimmedName = varName.trim();
      const varExists = Object.values(variables).some(
        (v) => v.name === trimmedName
      );

      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex));
      }

      parts.push(
        <span
          key={startIndex}
          className={varExists ? "font-bold text-blue-400" : "text-red-400"}
        >
          {fullMatch}
        </span>
      );

      lastIndex = startIndex + fullMatch.length;
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length ? parts : text;
  };

  const handleVariableSelect = (value: string) => {
    if (value === "add_new" && onOpenTools) {
      onOpenTools();
    } else {
      setSelectedVariableId(value);
    }
  };

  const responsive = {
    desktop: {
      breakpoint: { max: 3000, min: 1024 },
      items: 1,
    },
    tablet: {
      breakpoint: { max: 1024, min: 464 },
      items: 1,
    },
    mobile: {
      breakpoint: { max: 464, min: 0 },
      items: 1,
    },
  };

  const handleScrapeUrl = async () => {
    if (!url) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get(
        `/api/scrape?url=${encodeURIComponent(url)}`
      );
      if (response.success && response.data?.markdown) {
        setContent(response.data.markdown);
      } else {
        setError(response.error || "Failed to scrape website");
      }
    } catch (err) {
      setError("Failed to fetch website content");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!url.trim()) return;

    try {
      const selectedVariable = Object.values(variables).find(
        (v) => v.id === selectedVariableId
      );

      await fileManager.handleFile({
        userId: auth.currentUser?.uid || "",
        type: "website",
        url: url.trim(),
        nickname: selectedVariable?.name || url.trim(),
      });
    } catch (error) {
      console.error("Error saving website:", error);
    }
  };

  const handleFetch = async () => {
    if (!url || !auth.currentUser) return;

    setIsLoading(true);
    try {
      const response = await api.get(
        `/api/process_url?url=${encodeURIComponent(url.trim())}&user_id=${auth.currentUser.uid}&nickname=${encodeURIComponent(nickname.trim())}`
      );

      if (response.success) {
        setContent(response.content);
        console.log("Retrieved processed URL content:", response);
      } else {
        setError(
          "This URL hasn't been processed yet. Please confirm it first."
        );
        console.error("Failed to fetch URL content:", response.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Error fetching content: ${errorMessage}`);
      console.error("Error fetching content:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!url.trim() || !nickname.trim()) return;

    setIsSaving(true);
    try {
      await fileManager.handleFile({
        userId: auth.currentUser?.uid || "",
        type: "website",
        url: url.trim(),
        nickname: nickname.trim(),
      });
      // Optional: Show success feedback
      console.log("Saved website with nickname:", nickname);
    } catch (error) {
      console.error("Error saving nickname:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (!url.trim() || !nickname.trim() || !auth.currentUser) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post("/api/process_url", {
        url: url.trim(),
        nickname: nickname.trim(),
        user_id: auth.currentUser.uid,
      });

      if (response.success) {
        setIsConfirmed(true);
        setContent(response.content); // Set content directly from the response
        console.log("URL processed successfully:", response);

        // Save the URL info for later use
        if (onUpdateBlock) {
          onUpdateBlock(blockNumber, {
            url: url.trim(),
            sanitizedUrl: response.sanitized_url,
            downloadLink: response.download_link,
          });
        }
      } else {
        setError(response.error || "Failed to process URL");
        console.error("URL processing failed:", response.error);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(`Error processing URL: ${errorMessage}`);
      console.error("Error processing URL:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    processBlock: async () => {
      try {
        await handleFetch();
        return true;
      } catch (error) {
        console.error("Error processing web block:", error);
        return false;
      }
    },
  }));

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Web Agent #{blockNumber}
        </h3>
        <Popover>
          <PopoverTrigger>
            <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
              ⚙️
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-0 bg-black border border-red-500">
            <button
              className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
              onClick={() => onDeleteBlock(blockNumber)}
            >
              Delete Block
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <Tabs
        defaultValue="url"
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "url" | "variables")}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 bg-gray-900">
          <TabsTrigger
            value="url"
            className="text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            URL to visit
          </TabsTrigger>
          <TabsTrigger
            value="variables"
            className="text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
          >
            Variables to search for
          </TabsTrigger>
        </TabsList>

        <TabsContent value="url" className="mt-4 space-y-4">
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder="The URL you want us to visit"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Give it a @nickname for later blocks"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleConfirm}
                  disabled={!url.trim() || !nickname.trim() || isLoading}
                  className="whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      Processing...
                    </>
                  ) : isConfirmed ? (
                    "Processed ✔"
                  ) : (
                    "Process URL"
                  )}
                </Button>
              </div>

              {error && (
                <div className="text-red-400 text-sm mt-2">{error}</div>
              )}

              {url && (
                <div className="preview mt-2 text-gray-300">
                  {formatTextWithVariables(url)}
                </div>
              )}
            </div>
          </div>

          <hr className="border-gray-700 my-4" />

          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-4">
              <div className="text-sm text-gray-400 mb-2">{url}</div>
              <div className="text-white prose prose-invert max-w-none h-[25vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
                {error ? (
                  <div className="text-red-400">{error}</div>
                ) : isLoading ? (
                  "Fetching..."
                ) : content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  "Enter a URL and click Fetch to see website content here"
                )}
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleFetch}
            disabled={!url.trim() || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Fetching...
              </>
            ) : (
              "Fetch"
            )}
          </Button>
        </TabsContent>

        <TabsContent value="variables" className="mt-4 space-y-4">
          <div className="flex items-center gap-2">
            <Input
              placeholder="Variable to search for"
              value={searchVariable}
              onChange={(e) => setSearchVariable(e.target.value)}
              className="w-full"
            />
            <AlertDialog>
              <AlertDialogTrigger>
                <InfoIcon className="h-5 w-5 text-gray-400 hover:text-gray-300" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Search Variables</AlertDialogTitle>
                  <AlertDialogDescription>
                    Enter a variable to search for across websites. The results
                    will be displayed in the carousel below.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-300">
                  <XIcon className="h-5 w-5" />
                </button>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {searchVariable && (
            <div className="preview mt-2 text-gray-300">
              {formatTextWithVariables(searchVariable)}
            </div>
          )}

          <hr className="border-gray-700 my-4" />

          <div className="relative mt-8">
            <div className="absolute right-4 -top-8 flex gap-2">
              <button
                className="text-gray-400 hover:text-gray-200 transition-colors"
                onClick={() => {
                  const carousel = document.querySelector(
                    ".react-multi-carousel-list"
                  );
                  if (carousel) {
                    (carousel as any).previous();
                  }
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                className="text-gray-400 hover:text-gray-200 transition-colors"
                onClick={() => {
                  const carousel = document.querySelector(
                    ".react-multi-carousel-list"
                  );
                  if (carousel) {
                    (carousel as any).next();
                  }
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
            <Carousel
              responsive={responsive}
              infinite={false}
              className="w-full"
              containerClass="carousel-container"
              itemClass="carousel-item px-2"
              arrows={false}
              showDots={true}
            >
              {dummyResults.map((result, index) => (
                <div key={index} className="px-4">
                  <Card className="bg-gray-900 border-gray-700">
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-400 mb-2">
                        {result.url}
                      </div>
                      <div className="text-white">{result.content}</div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </Carousel>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

export default WebAgent;
