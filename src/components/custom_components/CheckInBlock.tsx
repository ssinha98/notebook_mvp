import React, {
  useState,
  forwardRef,
  useImperativeHandle,
  useEffect,
} from "react";
import { Button } from "@/components/ui/button";
import { PlayIcon, ChevronRight } from "lucide-react";
import { FaStop } from "react-icons/fa";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IoExpandSharp } from "react-icons/io5";
import { IoIosMail } from "react-icons/io";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useVariableStore } from "@/lib/variableStore";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Variable } from "@/types/types";
import { auth } from "@/tools/firebase";
import { api } from "@/tools/api";
import { useSourceStore } from "@/lib/store";
import BlockNameEditor from "./BlockNameEditor";

interface CheckInBlockProps {
  blockNumber: number;
  agentId: string;
  onDeleteBlock?: (blockNumber: number) => void;
  onCopyBlock?: (blockNumber: number) => void; // Add this line
  variables: Variable[];
  editedVariableNames: string[];
  onSaveVariables?: (
    updatedVariables: Variable[],
    editedNames: string[]
  ) => void;
  onContinue?: () => void;
  onStop?: () => void;
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  onResume?: () => void;
}

// Change this interface name from BlockRef to CheckInBlockRef to match the import
export interface CheckInBlockRef {
  processBlock: () => Promise<boolean>;
}

const CheckInBlock = forwardRef<CheckInBlockRef, CheckInBlockProps>(
  (props, ref) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);
    const [editedVariables, setEditedVariables] = useState<
      Record<string, string>
    >({});
    const { variables, loadVariables, updateVariable } = useVariableStore();

    // Add store hook for updating block names
    const { updateBlockName } = useSourceStore();

    // Get current block to display its name
    const currentBlock = useSourceStore((state) =>
      state.blocks.find((block) => block.blockNumber === props.blockNumber)
    );

    // Add debug logs
    useEffect(() => {
      // console.log("CheckInBlock mounted with agentId:", props.agentId);
      const loadData = async () => {
        try {
          setIsLoading(true);
          setError(null);
          await loadVariables(props.agentId);
          // console.log("Variables loaded:", variables);
          // console.log("Current agentId:", props.agentId);
        } catch (err) {
          setError("Failed to load variables");
          console.error("Error loading variables:", err);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }, [props.agentId]);

    // Filter variables for this agent
    const agentVariables = Object.values(variables).filter((variable) => {
      // console.log(
      //   "Checking variable:",
      //   variable,
      //   "against agentId:",
      //   props.agentId
      // );
      return variable.agentId === props.agentId;
    });

    // console.log("Filtered agent variables:", agentVariables);

    // Initialize edited variables only when dialog opens
    useEffect(() => {
      if (isVariablesDialogOpen) {
        const currentValues: Record<string, string> = {};
        Object.values(variables)
          .filter((variable) => variable.agentId === props.agentId)
          .forEach((variable) => {
            // Handle both string and table values
            let valueAsString = "";
            if (variable.value) {
              if (typeof variable.value === "string") {
                valueAsString = variable.value;
              } else if (Array.isArray(variable.value)) {
                // Convert table data to a readable string format
                valueAsString = `Table with ${variable.value.length} rows`;
              }
            }
            currentValues[variable.id] = valueAsString;
          });
        setEditedVariables(currentValues);
      }
    }, [isVariablesDialogOpen, props.agentId, variables]);

    useImperativeHandle(
      ref,
      () => ({
        processBlock: async () => {
          // console.log(`CheckInBlock ${props.blockNumber} processBlock called`);

          try {
            // Send email notification
            const currentUser = auth.currentUser;
            // console.log("Current user data:", {
                // email: currentUser?.email,
                // uid: currentUser?.uid,
                // displayName: currentUser?.displayName,
            // });

            if (currentUser?.email) {
              // console.log("Sending check-in email to:", currentUser.email);
              const response = await api.get(
                `/api/send-checkin-email?email=${encodeURIComponent(currentUser.email)}`
              );
              if (response.success) {
                // console.log(
                //   "Check-in email sent successfully to:",
                //   response.sent_to
                // );
              } else {
                // console.log("Email send failed:", response);
              }
            } else {
              // console.log("No user email available for check-in notification");
            }
          } catch (error) {
            // console.error("Error sending check-in email:", error);
            // Continue with block processing even if email fails
          }

          // Return a Promise that resolves when the user continues or stops
          return new Promise<boolean>((resolve) => {
            props.onProcessingChange?.(false);
            resolve(true);
          });
        },
      }),
      [props.blockNumber, props.onProcessingChange]
    );

    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [localEditedNames, setLocalEditedNames] = useState<string[]>(
      props.editedVariableNames
    );

    const handleDeleteBlock = () => {
      if (typeof props.onDeleteBlock === "function") {
        props.onDeleteBlock(props.blockNumber);
      } else {
        console.error("onDeleteBlock is not properly defined");
      }
    };

    const handleSaveAndClose = async () => {
      try {
        setError(null);
        // Save all edited variables
        await Promise.all(
          Object.entries(editedVariables).map(([id, value]) =>
            updateVariable(id, value)
          )
        );
        setIsVariablesDialogOpen(false);
      } catch (err) {
        setError("Failed to save variables");
        console.error("Error saving variables:", err);
      }
    };

    const handleVariableChange = (variableId: string, newValue: string) => {
      setEditedVariables((prev) => ({
        ...prev,
        [variableId]: newValue,
      }));
    };

    const onContinueClick = () => {
      // console.log(`Continuing from block ${props.blockNumber}`);
      props.onResume?.();
    };

    const onStopClick = () => {
      // console.log("Stop clicked");
    };

    const handleCopyBlock = () => {
      if (props.onCopyBlock) {
        props.onCopyBlock(props.blockNumber);
      }
    };

    return (
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">
              Check-In Block #{props.blockNumber}
            </h3>
            <BlockNameEditor
              blockName={
                currentBlock?.name || `Check-In Block ${props.blockNumber}`
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
                className="w-full px-4 py-2 text-blue-500 hover:bg-blue-950 text-left transition-colors"
                onClick={handleCopyBlock}
              >
                Copy Block
              </button>
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={handleDeleteBlock}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-900/50 border border-red-700 rounded text-red-200">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Clickable text sections */}
          <div
            onClick={() => setIsVariablesDialogOpen(true)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            <span className="underline">{">"} View and Edit Variables </span>
            <IoExpandSharp className="h-4 w-4" />
          </div>

          {localEditedNames.length > 0 && (
            <div className="mt-1 ml-6 text-sm text-gray-400">
              Edited variables: {localEditedNames.join(", ")}
            </div>
          )}

          <div
            onClick={() => setIsAlertDialogOpen(true)}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            {/* <ChevronRight className="h-4 w-4" /> */}
            {/* <span className="underline">{">"} Check in Alert</span> */}
            {/* <IoIosMail className="h-4 w-4" /> */}

            {/* <IoExpandSharp className="h-4 w-4" /> */}
          </div>

          {/* Buttons */}
          <div className="mt-4" />
          <div className="text-sm text-gray-400">
            After checking all your variables are right and making any necessary
            changes, run the next blocks!
          </div>
          {/* <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={onStopClick}
              disabled={!props.isProcessing}
            >
              <FaStop className="h-4 w-4" />
              Stop
            </Button>
            <Button
              className="flex items-center gap-2"
              onClick={onContinueClick}
            >
              <PlayIcon className="h-4 w-4" />
              Continue Run
            </Button>
          </div> */}
        </div>

        {/* Temporary placeholder dialogs */}
        <Dialog
          open={isVariablesDialogOpen}
          onOpenChange={setIsVariablesDialogOpen}
        >
          <DialogContent className="bg-gray-800">
            <DialogHeader>
              <DialogTitle>View and Edit Variables</DialogTitle>
            </DialogHeader>
            <div className="text-gray-300">
              {isLoading ? (
                <div className="text-center py-4">Loading variables...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-gray-300">
                        Variable Name
                      </TableHead>
                      <TableHead className="text-gray-300">Value</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agentVariables.map((variable) => (
                      <TableRow key={variable.id}>
                        <TableCell className="font-medium text-gray-300">
                          {variable.name}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="bg-gray-700 text-gray-200 border-gray-600"
                            value={editedVariables[variable.id] || ""}
                            onChange={(e) =>
                              handleVariableChange(variable.id, e.target.value)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsVariablesDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAndClose} disabled={isLoading}>
                  Save and Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
          <DialogContent className="bg-gray-800">
            <DialogHeader>
              <DialogTitle>Check-in Alert</DialogTitle>
            </DialogHeader>
            <div className="text-gray-300">
              Alert dialog content will go here
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
);

CheckInBlock.displayName = "CheckInBlock";

export default CheckInBlock;
