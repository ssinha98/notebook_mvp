import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useEffect,
} from "react";
import { InstagramAgentBlock, Variable } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import VariableDropdown from "./VariableDropdown";
import { api } from "@/tools/api";
import InstagramPostList from "./InstagramPostList";
import { toast } from "sonner";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";

interface SimplifiedPost {
  pk: string;
  id: string;
  taken_at: string;
  image_url: string;
  comment_count: number;
  like_count: number;
  play_count: number | null;
  has_liked: boolean;
  caption: string;
}

interface InstagramAgentProps {
  blockNumber: number;
  onDeleteBlock: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void; // Add this line
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<InstagramAgentBlock>
  ) => void;
  onAddVariable: (variable: Variable) => void;
  onOpenTools?: () => void;
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  initialUrl?: string;
  initialPostCount?: number;
  variables: Variable[]; // Add this line
}

export interface InstagramAgentRef {
  processBlock: () => Promise<boolean>;
}

const InstagramAgent = forwardRef<InstagramAgentRef, InstagramAgentProps>(
  (props, ref) => {
    const [url, setUrl] = useState(props.initialUrl || "");
    const [postCount, setPostCount] = useState(props.initialPostCount || 5);
    const [selectedVariableId, setSelectedVariableId] = useState<string>("");
    const [modelResponse, setModelResponse] = useState<string | null>(null);
    const storeVariables = useVariableStore((state) => state.variables);
    const currentAgent = useAgentStore((state) => state.currentAgent);
    const [posts, setPosts] = useState<SimplifiedPost[]>([]);
    const [selectedPosts, setSelectedPosts] = useState<SimplifiedPost[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Add store hook for updating block names
    const { updateBlockName } = useSourceStore();

    // Get current block to display its name
    const currentBlock = useSourceStore((state) =>
      state.blocks.find((block) => block.blockNumber === props.blockNumber)
    );

    // Expose processBlock to parent components
    useImperativeHandle(ref, () => ({
      processBlock: async () => {
        return handleProcessBlock();
      },
    }));

    const handleUpdateBlock = (updates: Partial<InstagramAgentBlock>) => {
      try {
        if (typeof props.onUpdateBlock === "function") {
          props.onUpdateBlock(props.blockNumber, updates);
        } else {
          console.warn("onUpdateBlock is not available");
        }
      } catch (error) {
        console.error("Error updating block:", error);
      }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newUrl = e.target.value;
      setUrl(newUrl);
      handleUpdateBlock({
        type: "instagramagent",
        blockNumber: props.blockNumber,
        url: newUrl,
        postCount,
      });
    };

    const handlePostCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newCount = parseInt(e.target.value) || 0;
      setPostCount(newCount);
      handleUpdateBlock({
        type: "instagramagent",
        blockNumber: props.blockNumber,
        url,
        postCount: newCount,
      });
    };

    const handleVariableSelect = (value: string) => {
      if (value === "add_new" && props.onOpenTools) {
        props.onOpenTools();
      } else {
        setSelectedVariableId(value);
        const selectedVariable = props.variables.find((v) => v.id === value);
        if (selectedVariable) {
          props.onUpdateBlock(props.blockNumber, {
            type: "instagramagent",
            blockNumber: props.blockNumber,
            url,
            postCount,
            outputVariable: {
              id: selectedVariable.id,
              name: selectedVariable.name,
              type: selectedVariable.type,
            },
          });
        }
      }
    };

    const handleProcessBlock = async () => {
      if (!url) {
        setError("Please enter a valid Instagram URL");
        return false;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const response = await api.post("/api/instagram_agent", {
          profile_url: url,
          post_limit: postCount,
        });

        if (!response.success) {
          throw new Error(response.error || "Failed to fetch Instagram posts");
        }

        setPosts(response.posts);
        setSelectedPosts(response.posts);

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        return false;
      } finally {
        setIsProcessing(false);
      }
    };

    // Add this effect to update the variable when selected posts change
    useEffect(() => {
      const updateVariableWithPosts = async () => {
        if (selectedVariableId && selectedPosts.length >= 0) {
          // Note: >= 0 to allow empty selection
          try {
            const postsJson = JSON.stringify(selectedPosts);
            await useVariableStore
              .getState()
              .updateVariable(selectedVariableId, postsJson);
          } catch (error) {
            console.error(
              "Error updating variable with selected posts:",
              error
            );
            toast.error("Failed to save selected posts to variable");
          }
        }
      };

      updateVariableWithPosts();
    }, [selectedPosts, selectedVariableId]);

    return (
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              Instagram Agent #{props.blockNumber}
            </h3>
            <BlockNameEditor
              blockName={
                currentBlock?.name || `Instagram Agent ${props.blockNumber}`
              }
              blockNumber={props.blockNumber}
              onNameUpdate={updateBlockName}
            />
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
                onClick={() => props.onDeleteBlock(props.blockNumber)}
              >
                Delete Block
              </button>
              <button
                className="w-full px-4 py-2 text-blue-500 hover:bg-blue-950 text-left transition-colors"
                onClick={() => {
                  props.onCopyBlock?.(props.blockNumber);
                  toast.success("Block copied!");
                }}
              >
                Copy Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm text-gray-400 mb-2">
              Instagram URL
            </label>
            <Input
              id="url"
              value={url}
              onChange={handleUrlChange}
              placeholder="Instagram URL you want us to parse"
              className="w-full"
            />
          </div>

          <div>
            <label
              htmlFor="postCount"
              className="block text-sm text-gray-400 mb-2"
            >
              Number of Posts
            </label>
            <Input
              id="postCount"
              type="number"
              value={postCount}
              onChange={handlePostCountChange}
              placeholder="the number of posts you want us to grab"
              className="w-full"
              min={1}
            />
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-2 text-gray-300">
            <span>Set output as:</span>
            <VariableDropdown
              value={selectedVariableId}
              onValueChange={handleVariableSelect}
              agentId={currentAgent?.id || null}
              onAddNew={props.onOpenTools}
            />
          </div>

          <div className="mt-4 flex justify-start">
            <Button
              className="flex items-center gap-2"
              onClick={handleProcessBlock}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="animate-spin mr-2">⟳</span>
                  Processing...
                </>
              ) : (
                "Process"
              )}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-800 rounded">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-4">
            <InstagramPostList
              posts={posts}
              onSelectionChange={setSelectedPosts}
            />
          </div>
        )}

        {modelResponse && !isProcessing && (
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(modelResponse, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  }
);

InstagramAgent.displayName = "InstagramAgent";

export default InstagramAgent;
