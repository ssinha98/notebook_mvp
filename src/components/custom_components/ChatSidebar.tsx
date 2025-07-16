import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Check,
  X,
  Clock,
  AlertCircle,
  StopCircle,
  Edit,
} from "lucide-react";
import { Block } from "@/types/types";
import { cn } from "@/lib/utils";
import ChatBlockForm from "./ChatBlockForm";
import SearchPreviewDialog from "./SearchPreviewDialog";
import { useAgentStore } from "@/lib/agentStore";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface BlockExecution {
  blockName: string;
  blockNumber: number;
  blockType: string;
  params: any;
  status:
    | "pending"
    | "form_pending"
    | "approved"
    | "rejected"
    | "executing"
    | "completed"
    | "failed"
    | "stopped";
  result?: any;
  error?: string;
  formData?: any;
  validationErrors?: Record<string, string>;
}

interface ChatMessage {
  id: string;
  type:
    | "user"
    | "bot"
    | "approval_request"
    | "form_request"
    | "success"
    | "error";
  content: string;
  timestamp: Date;
  blockExecution?: BlockExecution;
}

interface ChatSidebarProps {
  blocks: Block[];
  selectedData: any[];
  selectedColumn?: string;
  onBlockExecute: (blockName: string, params: any) => Promise<void>;
  className?: string;
}

interface PreviewRow {
  rowId: string;
  rowIndex: number;
  searchQuery: string;
  results: any[];
}

const ChatMessage: React.FC<{
  message: ChatMessage;
  selectedData: any[];
  selectedColumn?: string;
  onReject?: (messageId: string) => void;
  onFormSubmit?: (messageId: string, formData: any) => void;
  onStop?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
}> = ({
  message,
  selectedData,
  selectedColumn,
  onReject,
  onFormSubmit,
  onStop,
  onRetry,
}) => {
  const getMessageStyles = () => {
    switch (message.type) {
      case "user":
        return "bg-blue-600 text-white ml-8";
      case "bot":
        return "bg-gray-700 text-gray-100 mr-8";
      case "approval_request":
        return "bg-yellow-800 text-yellow-100 mr-8 border border-yellow-600";
      case "form_request":
        return "bg-purple-800 text-purple-100 mr-8 border border-purple-600";
      case "success":
        return "bg-green-800 text-green-100 mr-8 border border-green-600";
      case "error":
        return "bg-red-800 text-red-100 mr-8 border border-red-600";
      default:
        return "bg-gray-700 text-gray-100 mr-8";
    }
  };

  const getIcon = () => {
    switch (message.type) {
      case "approval_request":
        return <Clock className="h-4 w-4" />;
      case "form_request":
        return <Edit className="h-4 w-4" />;
      case "success":
        return <Check className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleFormSubmit = (formData: any) => {
    onFormSubmit?.(message.id, formData);
  };

  const handleFormCancel = () => {
    onReject?.(message.id);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 mb-4",
        message.type === "user" ? "items-end" : "items-start"
      )}
    >
      <div
        className={cn(
          "rounded-lg p-3 max-w-[80%] break-words",
          getMessageStyles()
        )}
      >
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1">
            <div className="text-sm whitespace-pre-wrap">{message.content}</div>
            {message.blockExecution && (
              <div className="mt-2 text-xs opacity-80">
                <div>Block: {message.blockExecution.blockName}</div>
                <div>Status: {message.blockExecution.status}</div>
                {message.blockExecution.error && (
                  <div className="text-red-300 mt-1">
                    Error: {message.blockExecution.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Form for parameter input */}
        {message.type === "form_request" &&
          message.blockExecution?.status === "form_pending" && (
            <ChatBlockForm
              blockType={message.blockExecution.blockType}
              blockName={message.blockExecution.blockName}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              initialValues={message.blockExecution.formData}
              validationErrors={message.blockExecution.validationErrors}
              selectedData={selectedData}
              selectedColumn={selectedColumn}
            />
          )}

        {/* Stop button for executing blocks */}
        {message.blockExecution?.status === "executing" && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onStop?.(message.id)}
              className="border-red-600 text-red-400 hover:bg-red-950"
            >
              <StopCircle className="h-3 w-3 mr-1" />
              Stop
            </Button>
          </div>
        )}

        {/* Retry button for failed executions */}
        {message.blockExecution?.status === "failed" && (
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={() => onRetry?.(message.id)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-400 px-1">
        {message.timestamp.toLocaleTimeString()}
      </div>
    </div>
  );
};

// Remove the counter completely and use crypto.randomUUID()
const ChatSidebar: React.FC<ChatSidebarProps> = ({
  blocks,
  selectedData,
  selectedColumn,
  onBlockExecute,
  className,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(), // Use crypto.randomUUID() for initial message
      type: "bot",
      content: `Hello! I can help you execute blocks by name. 

Available blocks:
${blocks.map((b) => `• @${b.name || `${b.type}_${b.blockNumber}`}`).join("\n")}

Try: "run @block_name" or "run @block_name @selection"`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [executingBlocks, setExecutingBlocks] = useState<Set<string>>(
    new Set()
  );
  const viewportRef = useRef<HTMLDivElement>(null);

  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [pendingBlockExecution, setPendingBlockExecution] = useState<{
    blockName: string;
    params: any;
  } | null>(null);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);

  const addMessage = (
    type: ChatMessage["type"],
    content: string,
    blockExecution?: BlockExecution
  ) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(), // Use crypto.randomUUID() for all messages
      type,
      content,
      timestamp: new Date(),
      blockExecution,
    };
    // console.log("ChatSidebar: Adding message with ID:", message.id);
    setMessages((prev) => [...prev, message]);
    return message.id;
  };

  const updateMessage = (messageId: string, updates: Partial<ChatMessage>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
    );
  };

  const parseCommand = (input: string) => {
    // Parse "run @block_name" or "run @block_name @selection" or "run @block_name on @selection" or "run @block_name in @preview"
    // Also handle combinations like "run @block_name @selection in @preview" or "run @block_name on @selection in @preview"
    // Updated regex to support spaces in block names
    const match = input.match(
      /^run\s+@([a-zA-Z_][a-zA-Z0-9_\s]*)\s*(?:(?:on\s+)?@selection)?\s*(?:in\s+@preview)?$/i
    );
    if (match) {
      const [, blockName] = match;
      const hasSelection = input.includes("@selection");
      const hasPreview = input.includes("@preview");
      return {
        blockName: blockName.trim(),
        useSelection: hasSelection,
        usePreview: hasPreview,
      };
    }
    return null;
  };

  const findBlockByName = (blockName: string) => {
    return blocks.find(
      (block) =>
        block.name === blockName ||
        `${block.type}_${block.blockNumber}` === blockName
    );
  };

  const getBlockConfiguration = (block: Block, command?: any) => {
    // Extract current configuration from the block
    const baseConfig = {
      systemPrompt: block.systemPrompt || "",
      userPrompt: block.userPrompt || "",
      saveAsCsv: block.saveAsCsv || false,
    };

    switch (block.type) {
      case "agent":
        return {
          ...baseConfig,
          systemPrompt: block.systemPrompt || "",
        };

      case "searchagent":
        const searchBlock = block as any;
        const config: any = {
          ...baseConfig,
          engine: searchBlock.engine || "google",
          limit: searchBlock.limit || 10,
          topic: searchBlock.topic || "",
          section: searchBlock.section || "",
          timeWindow: searchBlock.timeWindow || "",
          trend: searchBlock.trend || "",
          region: searchBlock.region || "",
          query: "", // Always empty for user to fill
        };

        // Add preview mode if specified in command
        if (command?.usePreview) {
          config.previewMode = true;
        }

        // Add selection data if specified in command
        if (command?.useSelection && selectedData.length > 0) {
          config.selectedData = selectedData;
          config.selectedColumn = selectedColumn || undefined; // Handle undefined case gracefully
        }

        return config;

      case "deepresearchagent":
        const deepResearchBlock = block as any;
        return {
          ...baseConfig,
          searchEngine: deepResearchBlock.searchEngine || "google",
          // Don't pre-fill topic - let user enter it fresh each time
          topic: "",
        };

      case "webagent":
        const webBlock = block as any; // WebAgentBlock
        return {
          ...baseConfig,
          url: webBlock.url || "",
          prompt: webBlock.prompt || "", // Use existing prompt instead of empty string
        };

      case "codeblock":
        const codeBlock = block as any;
        return {
          ...baseConfig,
          language: codeBlock.language || "python",
          // Don't pre-fill code - let user enter it fresh each time
          code: "",
        };

      case "instagramagent":
        const instaBlock = block as any;
        return {
          ...baseConfig,
          postCount: instaBlock.postCount || 10,
          // Don't pre-fill url - let user enter it fresh each time
          url: "",
        };

      case "excelagent":
        return {
          ...baseConfig,
          // Don't pre-fill prompt - let user enter it fresh each time
          prompt: "",
        };

      case "pipedriveagent":
        return {
          ...baseConfig,
          // Don't pre-fill prompt - let user enter it fresh each time
          prompt: "",
        };

      case "clickupagent":
        return {
          ...baseConfig,
          // Don't pre-fill prompt - let user enter it fresh each time
          prompt: "",
        };

      case "datavizagent":
        const datavizBlock = block as any;
        return {
          ...baseConfig,
          chartType: datavizBlock.chartType || "auto",
          // Don't pre-fill prompt - let user enter it fresh each time
          prompt: "",
        };

      case "googledriveagent":
        return {
          ...baseConfig,
          // Don't pre-fill prompt - let user enter it fresh each time
          prompt: "",
        };

      case "make":
        const makeBlock = block as any;
        return {
          ...baseConfig,
          webhookUrl: makeBlock.webhookUrl || "",
          parameters: makeBlock.parameters || "",
        };

      case "contact":
        const contactBlock = block as any;
        return {
          ...baseConfig,
          channel: contactBlock.channel || "email",
          recipient: contactBlock.recipient || "",
          subject: contactBlock.subject || "",
          body: contactBlock.body || "",
        };

      case "apolloagent":
        const apolloBlock = block as any;
        return {
          ...baseConfig,
          fullName: apolloBlock.fullName || "",
          company: apolloBlock.company || "",
          prompt: apolloBlock.prompt || "", // Use the block's actual prompt
          outputVariable: apolloBlock.outputVariable || null, // Pass the output variable
        };

      default:
        return baseConfig;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    setIsProcessing(true);

    // Add user message
    addMessage("user", userMessage);

    try {
      // Parse the command
      const command = parseCommand(userMessage);

      if (command) {
        // Find matching block
        const matchingBlock = findBlockByName(command.blockName);

        if (matchingBlock) {
          // Get existing configuration from the block, passing the command for context
          const existingConfig = getBlockConfiguration(matchingBlock, command);

          // Create block execution
          const blockExecution: BlockExecution = {
            blockName:
              matchingBlock.name ||
              `${matchingBlock.type}_${matchingBlock.blockNumber}`,
            blockNumber: matchingBlock.blockNumber,
            blockType: matchingBlock.type,
            params: {
              useSelection: command.useSelection,
              selectedData: command.useSelection ? selectedData : [],
              usePreview: command.usePreview,
            },
            status: "form_pending",
            formData: existingConfig, // Pre-fill with existing config
          };

          // Show form for parameter input
          addMessage(
            "form_request",
            `Please provide parameters for "${blockExecution.blockName}":`,
            blockExecution
          );
        } else {
          // Block not found
          const availableBlocks = blocks
            .map((b) => `@${b.name || `${b.type}_${b.blockNumber}`}`)
            .join("\n• ");
          addMessage(
            "error",
            `Block "@${command.blockName}" not found.\n\nAvailable blocks:\n• ${availableBlocks}`
          );
        }
      } else {
        // Invalid command format
        addMessage(
          "bot",
          `Invalid command format. Use: "run @block_name" or "run @block_name @selection" or "run @block_name in @preview"\n\nAvailable blocks:\n${blocks.map((b) => `• @${b.name || `${b.type}_${b.blockNumber}`}`).join("\n")}`
        );
      }
    } catch (error) {
      addMessage(
        "error",
        `Error processing command: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const executeSearchInPreviewMode = async (
    params: any
  ): Promise<PreviewRow[]> => {
    const searchBlock = blocks.find(
      (block) => block.type === "searchagent" && block.name === params.blockName
    );
    if (!searchBlock) {
      throw new Error(
        `Search agent block not found for name: ${params.blockName}`
      );
    }

    const existingConfig = getBlockConfiguration(searchBlock);
    const searchParams = {
      ...existingConfig,
      query: params.query,
      limit: params.limit,
      topic: params.topic,
      section: params.section,
      timeWindow: params.timeWindow,
      trend: params.trend,
      region: params.region,
    };

    const blockExecution: BlockExecution = {
      blockName:
        searchBlock.name || `${searchBlock.type}_${searchBlock.blockNumber}`,
      blockNumber: searchBlock.blockNumber,
      blockType: searchBlock.type,
      params: {
        useSelection: false, // Preview mode doesn't use selection
        selectedData: [],
      },
      status: "executing",
      formData: searchParams,
    };

    const messageId = addMessage(
      "form_request",
      `Executing search for "${searchParams.query}"...`,
      blockExecution
    );
    setPendingBlockExecution({
      blockName:
        searchBlock.name || `${searchBlock.type}_${searchBlock.blockNumber}`,
      params: searchParams,
    });

    try {
      await onBlockExecute(
        searchBlock.name || `${searchBlock.type}_${searchBlock.blockNumber}`,
        searchParams
      );
      const results = [
        {
          rowId: messageId,
          rowIndex: 0,
          searchQuery: searchParams.query,
          results: [],
        }, // Placeholder for results
      ];
      setPreviewData(results);
      setIsPreviewDialogOpen(true);
      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      updateMessage(messageId, {
        content: `❌ Failed to execute search: ${errorMessage}`,
        blockExecution: {
          ...blockExecution,
          status: "failed",
          error: errorMessage,
        },
      });
      throw error;
    }
  };

  // Update the function signature to match SearchPreviewDialog expectations
  const handlePreviewConfirm = async (
    selectedResults: { [rowId: string]: string[] },
    targetVariableId: string
  ) => {
    if (!pendingBlockExecution) return;

    const messageId = pendingBlockExecution.blockName;
    const message = messages.find((m) => m.id === messageId);
    if (!message?.blockExecution) return;

    const updatedBlockExecution: BlockExecution = {
      ...message.blockExecution,
      status: "completed",
      result: selectedResults,
    };

    updateMessage(messageId, {
      content: `✅ Search results confirmed for "${message.blockExecution.blockName}".`,
      blockExecution: updatedBlockExecution,
    });

    setPendingBlockExecution(null);
    setIsPreviewDialogOpen(false);
    setPreviewData([]);
  };

  const handleFormSubmit = async (messageId: string, formData: any) => {
    // console.log("ChatSidebar: handleFormSubmit called with:", {
    //   messageId,
    //   formData,
    // });

    const message = messages.find((m) => m.id === messageId);
    if (!message?.blockExecution) {
      console.error(
        "ChatSidebar: No message or blockExecution found for ID:",
        messageId
      );
      return;
    }

    // console.log("ChatSidebar: Found message:", message);

    try {
      // Update status to executing
      updateMessage(messageId, {
        content: `Executing "${message.blockExecution.blockName}" with parameters...`,
        blockExecution: {
          ...message.blockExecution,
          status: "executing",
          formData,
        },
      });

      // Add to executing blocks
      setExecutingBlocks((prev) => new Set(prev).add(messageId));

      // Prepare parameters for execution
      const executionParams = {
        ...message.blockExecution.params,
        ...formData,
      };

      // For Apollo agents, make sure we pass the outputVariable
      if (
        message.blockExecution.blockType === "apolloagent" &&
        formData.outputVariable
      ) {
        executionParams.selectedVariableId = formData.outputVariable;
        // console.log(
        //   "ChatSidebar: Apollo outputVariable:",
        //   formData.outputVariable
        // );
      }

      //   console.log("ChatSidebar: Calling onBlockExecute with:", {
      //     blockName: message.blockExecution.blockName,
      //     params: executionParams,
      //   });

      // Execute the block
      await onBlockExecute(message.blockExecution.blockName, executionParams);

      console.log("ChatSidebar: Block execution completed successfully");

      // Remove from executing blocks
      setExecutingBlocks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });

      // Update status to completed
      updateMessage(messageId, {
        content: `✅ Successfully executed "${message.blockExecution.blockName}"`,
        blockExecution: { ...message.blockExecution, status: "completed" },
      });
    } catch (error) {
      console.error("ChatSidebar: Error during block execution:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Remove from executing blocks
      setExecutingBlocks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(messageId);
        return newSet;
      });

      // Update status to failed
      updateMessage(messageId, {
        content: `❌ Failed to execute "${message.blockExecution.blockName}"`,
        blockExecution: {
          ...message.blockExecution,
          status: "failed",
          error: errorMessage,
        },
      });
    }
  };

  const handleReject = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.blockExecution) return;

    updateMessage(messageId, {
      content: `Execution of "${message.blockExecution.blockName}" was cancelled.`,
      blockExecution: { ...message.blockExecution, status: "rejected" },
    });
  };

  const handleStop = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.blockExecution) return;

    // Remove from executing blocks
    setExecutingBlocks((prev) => {
      const newSet = new Set(prev);
      newSet.delete(messageId);
      return newSet;
    });

    updateMessage(messageId, {
      content: `⏹️ Execution of "${message.blockExecution.blockName}" was stopped.`,
      blockExecution: { ...message.blockExecution, status: "stopped" },
    });
  };

  const handleRetry = (messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message?.blockExecution) return;

    // Reset to form pending for retry
    updateMessage(messageId, {
      content: `Please provide parameters for "${message.blockExecution.blockName}":`,
      type: "form_request",
      blockExecution: {
        ...message.blockExecution,
        status: "form_pending",
        error: undefined,
      },
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleBlockClick = (block: Block) => {
    const blockName = block.name || `${block.type}_${block.blockNumber}`;
    setInputValue(`run @${blockName}`);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-gray-900 border-l border-gray-700",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Chat Assistant</h3>
        <p className="text-sm text-gray-400">
          Execute blocks by name: "run @block_name" or "run @block_name
          @selection in @preview"
        </p>
      </div>

      {/* Available Blocks Accordion */}
      <div className="border-b border-gray-700">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="available-blocks" className="border-none">
            <AccordionTrigger className="px-4 py-3 text-white hover:text-gray-300 hover:no-underline">
              Available Blocks
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="flex gap-3 overflow-x-auto pb-2">
                {blocks.map((block) => {
                  const blockName =
                    block.name || `${block.type}_${block.blockNumber}`;
                  return (
                    <div
                      key={block.blockNumber}
                      onClick={() => handleBlockClick(block)}
                      className="flex-shrink-0 cursor-pointer bg-gray-800 hover:bg-gray-700 rounded-lg p-3 min-w-[120px] border border-gray-600 hover:border-gray-500 transition-colors"
                    >
                      <div className="text-sm font-medium text-white">
                        {blockName}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {block.type}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div ref={viewportRef}>
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              selectedData={selectedData}
              selectedColumn={selectedColumn}
              onReject={handleReject}
              onFormSubmit={handleFormSubmit}
              onStop={handleStop}
              onRetry={handleRetry}
            />
          ))}
          {isProcessing && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
              Processing...
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type: run @block_name or run @block_name @selection in @preview"
            className="flex-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            disabled={isProcessing}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {selectedData.length > 0 && (
          <div className="mt-2 text-xs text-gray-400">
            {selectedData.length} items selected - add "@selection" to use them
          </div>
        )}

        {executingBlocks.size > 0 && (
          <div className="mt-2 text-xs text-yellow-400">
            {executingBlocks.size} block(s) executing...
          </div>
        )}
      </div>

      <SearchPreviewDialog
        open={isPreviewDialogOpen}
        onOpenChange={setIsPreviewDialogOpen}
        onConfirm={handlePreviewConfirm}
        previewData={previewData}
        agentId={useAgentStore.getState().currentAgent?.id}
      />
    </div>
  );
};

export default ChatSidebar;
