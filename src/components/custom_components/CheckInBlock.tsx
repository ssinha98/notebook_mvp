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
import { useSourceStore } from "@/lib/store";
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

interface CheckInBlockProps {
  blockNumber: number;
  onDeleteBlock?: (blockNumber: number) => void;
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
    // Log when the component mounts
    useEffect(() => {
      console.log(`CheckInBlock ${props.blockNumber} mounted`);
    }, [props.blockNumber]);

    useImperativeHandle(
      ref,
      () => ({
        processBlock: async () => {
          console.log(`CheckInBlock ${props.blockNumber} processBlock called`);
          return new Promise<boolean>((resolve) => {
            // Create modal or use existing UI to get user input
            const handleContinue = () => {
              console.log("Continue clicked");
              props.onProcessingChange?.(false);
              resolve(true);
            };

            const handleStop = () => {
              console.log("Stop clicked");
              props.onProcessingChange?.(false);
              resolve(false);
            };

            // Store these handlers for the buttons to use
            // window[`checkInBlock${props.blockNumber}Handlers`] = {
            //   handleContinue,
            //   handleStop,
            // };
          });
        },
      }),
      [props.blockNumber, props.onProcessingChange]
    );

    const [isVariablesDialogOpen, setIsVariablesDialogOpen] = useState(false);
    const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
    const [editedVariables, setEditedVariables] = useState<Variable[]>([]);
    const [localEditedNames, setLocalEditedNames] = useState<string[]>(
      props.editedVariableNames
    );

    const { updateVariable, variables: storeVariables } = useSourceStore();

    const handleDeleteBlock = () => {
      if (typeof props.onDeleteBlock === "function") {
        props.onDeleteBlock(props.blockNumber);
      } else {
        console.error("onDeleteBlock is not properly defined");
      }
    };

    const handleOpenDialog = () => {
      const initialVariables = props.variables.map((variable) => ({
        ...variable,
        value: storeVariables[variable.name] || "",
      }));
      setEditedVariables(initialVariables);
      setIsVariablesDialogOpen(true);
    };

    const handleSaveAndClose = () => {
      console.log("Saving variables:", editedVariables);

      // Save to store
      editedVariables.forEach((variable) => {
        console.log(
          "Updating variable:",
          variable.name,
          "to value:",
          variable.value
        );
        if (variable.value !== undefined) {
          // Changed condition
          updateVariable(variable.name, variable.value);
        }
      });

      // Verify store update
      const storeVariables = useSourceStore.getState().variables;
      console.log("Store variables after update:", storeVariables);

      if (props.onSaveVariables) {
        props.onSaveVariables(editedVariables, localEditedNames);
      }

      setIsVariablesDialogOpen(false);
    };

    const handleVariableChange = (
      variable: Variable,
      newValue: string,
      index: number
    ) => {
      const newVariables = [...editedVariables];
      newVariables[index] = {
        ...newVariables[index],
        value: newValue,
      };
      setEditedVariables(newVariables);

      if (!localEditedNames.includes(variable.name)) {
        setLocalEditedNames([...localEditedNames, variable.name]);
      }
    };

    const onContinueClick = () => {
      console.log(`Continuing from block ${props.blockNumber}`);
      props.onResume?.();
    };

    const onStopClick = () => {
      console.log("Stop clicked");
    };

    return (
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Check-In Block #{props.blockNumber}
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
                onClick={handleDeleteBlock}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-4">
          {/* Clickable text sections */}
          <div
            onClick={handleOpenDialog}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 cursor-pointer"
          >
            {/* <ChevronRight className="h-4 w-4" /> */}
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
            After checking all your variables are right, run the next blocks!
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
                  {editedVariables.map((variable, index) => (
                    <TableRow key={variable.id}>
                      <TableCell className="font-medium text-gray-300">
                        {variable.name}
                      </TableCell>
                      <TableCell>
                        <Input
                          className="bg-gray-700 text-gray-200 border-gray-600"
                          value={variable.value || ""}
                          onChange={(e) =>
                            handleVariableChange(
                              variable,
                              e.target.value,
                              index
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsVariablesDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveAndClose}>Save and Close</Button>
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
