import React, {
  useState,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import { Variable } from "@/types/types";
import { Button } from "@/components/ui/button";
import AddVariableDialog from "@/components/custom_components/AddVariableDialog";
import { api } from "@/tools/api";
import { useSourceStore } from "@/lib/store";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { processDynamicVariables } from "@/tools/dynamicVariables";

interface AgentBlockProps {
  blockNumber: number;
  variables: Array<Variable>;
  onAddVariable: (variable: Variable) => void;
  onOpenTools?: () => void;
  onSavePrompts: (
    blockNumber: number,
    systemPrompt: string,
    userPrompt: string,
    saveAsCsv: boolean,
    sourceInfo?: {
      nickname: string;
      downloadUrl: string;
    }
  ) => void;
  onProcessedPrompts?: (processedSystem: string, processedUser: string) => void;
  isProcessing: boolean;
  onProcessingChange: (isProcessing: boolean) => void;
  onDeleteBlock: (blockNumber: number) => void;
  initialSystemPrompt?: string;
  initialUserPrompt?: string;
  initialSaveAsCsv?: boolean;
  initialSource?: {
    nickname: string;
    downloadUrl: string;
  };
}

// Add this interface to define the ref methods
export interface AgentBlockRef {
  processBlock: () => Promise<boolean>;
}

// Convert component to use forwardRef
const AgentBlock = forwardRef<AgentBlockRef, AgentBlockProps>((props, ref) => {
  const [isSystemPromptOpen, setIsSystemPromptOpen] = useState(false);
  const [isUserPromptOpen, setIsUserPromptOpen] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    props.initialSystemPrompt || "You are a helpful assistant"
  );
  const [userPrompt, setUserPrompt] = useState(props.initialUserPrompt || "");
  // const [showOutput, setShowOutput] = useState(false);
  const [showOutput] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [modelResponse, setModelResponse] = useState<string | null>(null);
  const [selectedVariableId, setSelectedVariableId] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string>(
    props.initialSource?.nickname || "none"
  );
  const [user] = useAuthState(getAuth());
  const fileNicknames = useSourceStore((state) => state.fileNicknames);
  const addFileNickname = useSourceStore((state) => state.addFileNickname);
  const [saveAsCsv, setSaveAsCsv] = useState(props.initialSaveAsCsv || false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const { variables: storeVariables } = useSourceStore();
  const syncWithFirestore = useSourceStore((state) => state.syncWithFirestore);

  // Add null check for variables prop
  const variables = props.variables || [];

  // Add useEffect to update prompts when they change
  useEffect(() => {
    if (props.initialSystemPrompt !== undefined) {
      setSystemPrompt(props.initialSystemPrompt);
    }
    if (props.initialUserPrompt !== undefined) {
      setUserPrompt(props.initialUserPrompt);
    }
  }, [props.initialSystemPrompt, props.initialUserPrompt]);

  // Add useEffect to update saveAsCsv when it changes
  useEffect(() => {
    if (props.initialSaveAsCsv !== undefined) {
      setSaveAsCsv(props.initialSaveAsCsv);
    }
  }, [props.initialSaveAsCsv]);

  // Update useEffect to re-run when fileNicknames changes
  useEffect(() => {
    const fetchFiles = async () => {
      const db = getFirestore();
      const filesSnapshot = await getDocs(collection(db, "files"));
      filesSnapshot.forEach((doc) => {
        const data = doc.data();
        addFileNickname(data.nickname, data.full_name, data.download_link);
      });
    };

    fetchFiles();
  }, [addFileNickname, fileNicknames]); // Add fileNicknames as dependency

  useEffect(() => {
    if (user) {
      syncWithFirestore(user.uid);
    }
  }, [user, syncWithFirestore]);

  // Update useEffect to handle initial source
  useEffect(() => {
    if (props.initialSource?.nickname) {
      setSelectedSource(props.initialSource.nickname);
    }
  }, [props.initialSource]);

  // Update handler to work with shadcn Select
  const handleVariableSelect = (value: string) => {
    if (value === "add_new" && props.onOpenTools) {
      props.onOpenTools();
    } else {
      setSelectedVariableId(value);
    }
  };

  // Add this helper function to format dynamic variables
  const formatDynamicVariables = (text: string) => {
    const regex = /@{(.*?)}/g;
    const parts = [];
    let lastIndex = 0;

    for (const match of text.matchAll(regex)) {
      const [fullMatch, varContent] = match;
      const startIndex = match.index!;

      // Add text before the variable
      if (startIndex > lastIndex) {
        parts.push(text.slice(lastIndex, startIndex));
      }

      // Add the variable part with styling
      parts.push(
        <span
          key={startIndex}
          className="inline-flex items-center rounded-md bg-blue-400/10 px-2 py-1 text-sm font-medium text-blue-400 ring-1 ring-inset ring-blue-400/30"
        >
          @{varContent}
        </span>
      );

      lastIndex = startIndex + fullMatch.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length ? parts : text;
  };

  // Update the existing formatTextWithVariables function
  const formatTextWithVariables = (text: string) => {
    // First format regular variables
    const parts: React.ReactNode[] = [];
    let formattedText = text;

    // Handle {{variables}}
    const varRegex = /{{(.*?)}}/g;
    formattedText = formattedText.replace(varRegex, (match, varName) => {
      const varExists = variables.some((v) => v.name === varName.trim());
      return `<var class="${varExists ? "valid" : "invalid"}">${match}</var>`;
    });

    // Handle @sources
    const sourceRegex = /@([a-zA-Z_]+(?:\.[a-zA-Z]+)?)/g;
    formattedText = formattedText.replace(sourceRegex, (match, sourceName) => {
      // Trim the sourceName and check if it exists in fileNicknames
      const trimmedSourceName = sourceName.trim();
      const sourceExists = fileNicknames[trimmedSourceName];
      // console.log("Source check:", {
      //   trimmedSourceName,
      //   exists: !!sourceExists,
      //   fileNicknames,
      // });
      return `<source class="${sourceExists ? "valid" : "invalid"}">${match}</source>`;
    });

    // Split by variable and source markers and create elements
    const segments = formattedText.split(
      /(<(?:var|source).*?<\/(?:var|source)>)/
    );
    segments.forEach((segment, index) => {
      if (segment.startsWith("<var")) {
        const className = segment.includes("valid")
          ? "font-bold text-blue-400"
          : "text-red-400";
        const content = segment.match(/>(.+?)<\/var>/)?.[1] || "";
        parts.push(
          <span key={index} className={className}>
            {content}
          </span>
        );
      } else if (segment.startsWith("<source")) {
        const isValid = segment.includes('class="valid"');
        const content = segment.match(/>(.+?)<\/source>/)?.[1] || "";
        // console.log("Rendering source:", { content, isValid, segment });
        parts.push(
          <span
            key={index}
            className={`inline-flex items-center rounded-md px-2 py-1 text-sm font-medium ${
              isValid
                ? "bg-gray-800 text-blue-400 ring-1 ring-inset ring-black border border-black"
                : "bg-red-950 text-red-400 ring-1 ring-inset ring-red-900 border border-red-900"
            }`}
          >
            {content}
          </span>
        );
      } else {
        parts.push(segment);
      }
    });

    return parts;
  };

  // Update the processVariablesInText function to use store values
  const processVariablesInText = (text: string): string => {
    const regex = /{{(.*?)}}/g;
    return text.replace(regex, (match, varName) => {
      // Get the latest value from the store
      const storeVars = useSourceStore.getState().variables;
      const value = storeVars[varName.trim()];
      return value || `no value saved to ${varName.trim()}`;
    });
  };

  // Add effect to handle dynamic variables
  useEffect(() => {
    const { variables } = processDynamicVariables(userPrompt);
    variables.forEach((variable) => {
      if (variable.type === "source" && variable.action) {
        variable.action(setSelectedSource);
      }
    });
  }, [userPrompt]);

  // Update useEffect to reset selected source when @ is removed
  useEffect(() => {
    const sourceMatch = userPrompt.match(/@([a-zA-Z_]+(?:\.[a-zA-Z]+)?)/);
    if (sourceMatch && fileNicknames[sourceMatch[1]]) {
      setSelectedSource(sourceMatch[1]);
    } else {
      // Reset to 'none' if no valid source is found in the text
      setSelectedSource("none");
    }
  }, [userPrompt, fileNicknames]);

  // Update handleProcessBlock to handle single source
  const handleProcessBlock = async () => {
    try {
      props.onProcessingChange(true);
      const processedSystemPrompt = processVariablesInText(systemPrompt);
      const processedUserPrompt = processVariablesInText(userPrompt);

      // Check for source with improved regex pattern
      const sourceMatch = userPrompt.match(/@([a-zA-Z_]+(?:\.[a-zA-Z]+)?)/);
      const sourceNickname = sourceMatch
        ? sourceMatch[1].trim()
        : selectedSource;

      // Add debugging logs
      console.log("Source Nickname:", sourceNickname);
      console.log("File Nicknames:", fileNicknames);
      console.log("Selected Source:", selectedSource);

      let response;
      if (
        sourceNickname &&
        sourceNickname !== "none" &&
        fileNicknames[sourceNickname]
      ) {
        const sourceData = fileNicknames[sourceNickname];
        console.log("Source Data being sent:", sourceData); // Additional debug log

        response = await api.post("/api/call-model-with-source", {
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt,
          download_url: sourceData.downloadLink,
          save_as_csv: saveAsCsv,
        });
      } else {
        response = await api.post("/api/call-model", {
          system_prompt: processedSystemPrompt,
          user_prompt: processedUserPrompt,
          save_as_csv: saveAsCsv,
        });
      }

      if (response.success) {
        // Handle CSV download if present
        if (saveAsCsv && response.csv_content) {
          const blob = new Blob([response.csv_content], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = response.filename || "response.csv";
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          a.remove();
        }

        setModelResponse(response.response);

        if (selectedVariableId) {
          const selectedVariable = variables.find(
            (v) => v.id === selectedVariableId
          );
          if (selectedVariable) {
            selectedVariable.value = response.response;
            useSourceStore
              .getState()
              .updateVariable(selectedVariable.name, response.response);
            props.onAddVariable(selectedVariable);
          }
        }

        if (props.onProcessedPrompts) {
          props.onProcessedPrompts(processedSystemPrompt, processedUserPrompt);
        }

        return true;
      } else {
        if (response.needs_api_key) {
          alert("Please add your own API key to continue using the service.");
        } else {
          console.error("Error from model:", response.response);
        }
        return false;
      }
    } catch (error) {
      console.error("Error processing block:", error);
      return false;
    } finally {
      props.onProcessingChange(false);
    }
  };

  const handleDeleteBlock = () => {
    if (typeof props.onDeleteBlock === "function") {
      props.onDeleteBlock(props.blockNumber);
    } else {
      console.error("onDeleteBlock is not properly defined");
    }
  };

  useImperativeHandle(ref, () => ({
    processBlock: handleProcessBlock,
  }));

  // Update the save function to include source information
  const handleSavePrompts = () => {
    const sourceInfo =
      selectedSource !== "none" && fileNicknames[selectedSource]
        ? {
            nickname: selectedSource,
            downloadUrl: fileNicknames[selectedSource].downloadLink,
          }
        : undefined;

    props.onSavePrompts(
      props.blockNumber,
      systemPrompt,
      userPrompt,
      saveAsCsv,
      sourceInfo // Add source info to the save function
    );
  };

  return (
    <>
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold text-white">
              Block #{props.blockNumber}
            </h3>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
              </SelectContent>
            </Select>
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

        {/* System Prompt Section */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer text-gray-300"
            onClick={() => setIsSystemPromptOpen(!isSystemPromptOpen)}
          >
            <span>System Prompt</span>
            <span className="transition-transform">
              {isSystemPromptOpen ? "▼" : "▶"}
            </span>
          </div>
          {isSystemPromptOpen && (
            <div className="mt-2">
              <textarea
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-gray-200"
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
              />
              <div className="preview mt-2 text-gray-300">
                {formatTextWithVariables(systemPrompt)}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setSystemPrompt("")}>
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    setIsSystemPromptOpen(false);
                    handleSavePrompts();
                    console.log(
                      `Saved Block ${props.blockNumber} System Prompt:`,
                      systemPrompt
                    );
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* User Prompt Section */}
        <div className="mb-4">
          <div
            className="flex items-center justify-between cursor-pointer text-gray-300"
            onClick={() => setIsUserPromptOpen(!isUserPromptOpen)}
          >
            <span>User Prompt</span>
            <span className="transition-transform">
              {isUserPromptOpen ? "▼" : "▶"}
            </span>
          </div>
          {isUserPromptOpen && (
            <div className="mt-2">
              <textarea
                className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-2 text-gray-200"
                value={userPrompt}
                onChange={(e) => setUserPrompt(e.target.value)}
              />
              <div className="preview mt-2 text-gray-300">
                {formatTextWithVariables(userPrompt)}
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="secondary" onClick={() => setUserPrompt("")}>
                  Clear
                </Button>
                <Button
                  onClick={() => {
                    setIsUserPromptOpen(false);
                    handleSavePrompts();
                    console.log(
                      `Saved Block ${props.blockNumber} User Prompt:`,
                      userPrompt
                    );
                  }}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-700 my-4" />

        <div className="flex items-center gap-2 text-gray-300 mb-4">
          <span>Source:</span>
          <Select value={selectedSource} onValueChange={setSelectedSource}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {Object.entries(fileNicknames).map(([nickname, details]) => (
                <SelectItem key={nickname} value={nickname}>
                  {nickname} ({details.originalName})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-gray-300">
          <span>Set output as:</span>
          <Select
            value={selectedVariableId}
            onValueChange={handleVariableSelect}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Variables" />
            </SelectTrigger>
            <SelectContent>
              {variables
                .filter((v) => v.type === "intermediate")
                .map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              <SelectItem value="add_new" className="text-blue-400">
                + Add new variable
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <hr className="border-gray-700 my-4" />

        <div className="mb-4">
          <h4 className="text-gray-300 mb-2">Save Output as</h4>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={saveAsCsv}
                onChange={(e) => {
                  setSaveAsCsv(e.target.checked);
                  // Save the preference immediately when changed
                  props.onSavePrompts(
                    props.blockNumber,
                    systemPrompt,
                    userPrompt,
                    e.target.checked,
                    selectedSource !== "none" && fileNicknames[selectedSource]
                      ? {
                          nickname: selectedSource,
                          downloadUrl:
                            fileNicknames[selectedSource].downloadLink,
                        }
                      : undefined
                  );
                }}
                className="form-checkbox bg-gray-700 border-gray-600"
              />
              CSV
            </label>
          </div>
        </div>

        <div className="mt-4 flex justify-start">
          <Button
            className="flex items-center gap-2"
            onClick={handleProcessBlock}
            disabled={props.isProcessing}
          >
            {props.isProcessing ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Running...
              </>
            ) : (
              "Run Block"
            )}
          </Button>
        </div>
      </div>

      {/* Output Section */}
      {showOutput && (
        <div className="mt-2 pl-4 font-mono text-white text-sm opacity-75">
          <div>Block #{props.blockNumber} output:</div>
          <div className="mt-2 whitespace-pre-wrap">
            {processVariablesInText(systemPrompt)}
            {"\n\n"}
            {processVariablesInText(userPrompt)}
          </div>
        </div>
      )}
      {/* <AddVariableDialog
      open={isDialogOpen}
      onOpenChange={setIsDialogOpen}
      onAddVariable={onAddVariable}
      defaultType="input"
    /> */}
      <AddVariableDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            // Reset the select value when dialog closes
            const select = document.querySelector(
              "select"
            ) as HTMLSelectElement;
            if (select) select.value = "";
          }
        }}
        onAddVariable={(variable) => {
          props.onAddVariable(variable);
          setIsDialogOpen(false);
        }}
        defaultType="intermediate"
      />

      {modelResponse && !props.isProcessing && (
        <div className="mt-4 p-4 bg-gray-800 rounded">
          <h4 className="text-sm font-medium mb-2 text-gray-300">
            Model Response:
          </h4>
          <div className="text-sm text-gray-300 whitespace-pre-wrap">
            {modelResponse}
          </div>
          {selectedVariableId && (
            <div className="mt-2 text-sm text-green-400">
              Saved as{" "}
              {variables.find((v) => v.id === selectedVariableId)?.name}
            </div>
          )}
        </div>
      )}
    </>
  );
});

AgentBlock.displayName = "AgentBlock";

export default AgentBlock;
