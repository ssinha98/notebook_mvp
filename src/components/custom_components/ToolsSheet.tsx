import React, { useState, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Wrench,
  FileText,
  Settings,
  Check,
  X,
  Plus,
  Trash2,
  Database,
  Trash, // Add the Trash icon import
} from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
// import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner";

// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import { Variable } from "@/types/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import AddVariableDialog from "@/components/custom_components/AddVariableDialog";
import AddSourceDialog from "./AddSourceDialog";
import { useSourceStore } from "@/lib/store";
import SourcesList from "./SourcesList";
import CheckInBlock from "./CheckInBlock";
import { useBlockManager } from "@/hooks/useBlockManager";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";

interface ToolsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddVariable: (variable: Variable) => void;
}

const ToolsSheet: React.FC<ToolsSheetProps> = ({
  open,
  onOpenChange,
  onAddVariable,
}) => {
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const fileNicknames = useSourceStore((state) => state.fileNicknames);
  const removeFileNickname = useSourceStore(
    (state) => state.removeFileNickname
  );
  const { deleteBlock } = useAgentStore();
  const { addBlock } = useBlockManager();
  const variables = useVariableStore((state) => state.variables);
  const currentAgent = useAgentStore((state) => state.currentAgent);

  useEffect(() => {
    const currentAgentId = useAgentStore.getState().currentAgent?.id;
    useVariableStore.getState().loadVariables(currentAgentId!);
  }, []);

  const handleAddVariable = () => {
    setIsVariableDialogOpen(true);
  };

  const handleSourceDelete = (nickname: string) => {
    removeFileNickname(nickname);

    // Get blocks from current agent instead of SourceStore
    const blocks = currentAgent?.blocks || [];

    blocks
      .filter(
        (block) =>
          block.type === "transform" &&
          (block.sourceName === nickname ||
            block.originalFilePath?.includes(nickname))
      )
      .forEach((block) => {
        deleteBlock(block.blockNumber);
      });

    // toast({
    //   title: "Source removed",
    //   description: `Source "${nickname}" and its transformations have been removed`,
    // });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[50vh] bg-[#1e1e1e] border-t border-[#333] rounded-t-2xl flex flex-col"
        >
          <SheetHeader className="mb-6 flex-shrink-0">
            <SheetTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Tools
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto mb-[60px]">
            {/* Main content grid */}
            <div className="grid grid-cols-2 gap-6 h-full">
              {/* Sources Section */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <h3 className="font-semibold">Sources</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsSourceDialogOpen(true)}
                  >
                    Add new
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mb-4 flex-shrink-0">
                  To delete a source, right click and select delete
                </p>

                {/* Scrollable sources container */}
                <div className="flex-1 overflow-y-auto border border-[#333] rounded-lg">
                  <Table>
                    <TableHeader className="sticky top-0 bg-[#1e1e1e] z-10">
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(fileNicknames).map(
                        ([nickname, details]) => (
                          <TableRow
                            key={nickname}
                            className="cursor-pointer hover:bg-secondary/80 group"
                          >
                            <td className="px-4 py-2">{nickname}</td>
                            <td className="px-4 py-2 text-right">
                              <ContextMenu>
                                <ContextMenuTrigger asChild>
                                  <div className="w-full h-full">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleSourceDelete(nickname);
                                      }}
                                      className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                  <ContextMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => {
                                      addBlock("transform", {
                                        sourceName: nickname,
                                        originalFilePath: details.originalName,
                                        fileType: "csv",
                                        transformations: {
                                          filterCriteria: [],
                                          columns: [],
                                          previewData: [],
                                        },
                                      });
                                      onOpenChange(false);
                                    }}
                                  >
                                    <Plus className="h-4 w-4" />
                                    Add to notebook
                                  </ContextMenuItem>
                                  <ContextMenuItem
                                    className="text-destructive focus:text-destructive flex items-center gap-2"
                                    onClick={() => handleSourceDelete(nickname)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Delete
                                  </ContextMenuItem>
                                </ContextMenuContent>
                              </ContextMenu>
                            </td>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Variables Section */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-2 mb-4 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    <h3 className="font-semibold">Variables</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariable}
                  >
                    Add Variable
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  {/* Input Variables */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Input Variables
                    </h4>
                    <div className="border border-[#333] rounded-lg max-h-32 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-[#1e1e1e] z-10">
                          <TableRow>
                            <TableHead>Variable Name</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(variables)
                            .filter((v) => v.type === "input")
                            .map((variable) => (
                              <TableRow
                                key={variable.id}
                                className="cursor-pointer hover:bg-secondary/80 group"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `{{${variable.name}}}`
                                  );
                                  toast(
                                    `{{${variable.name}}} copied to clipboard`,
                                    {
                                      action: {
                                        label: "Close",
                                        onClick: () => toast.dismiss(),
                                      },
                                    }
                                  );
                                }}
                              >
                                <td className="px-4 py-2">{variable.name}</td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      useVariableStore
                                        .getState()
                                        .deleteVariable(variable.id);
                                      toast(
                                        `Variable "${variable.name}" deleted`
                                      );
                                    }}
                                    className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-red-500 transition-colors"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </td>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Intermediate Variables */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      Intermediate Variables
                    </h4>
                    <div className="border border-[#333] rounded-lg max-h-32 overflow-y-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-[#1e1e1e] z-10">
                          <TableRow>
                            <TableHead>Variable Name</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.values(variables)
                            .filter((v) => v.type === "intermediate")
                            .map((variable) => (
                              <TableRow
                                key={variable.id}
                                className="cursor-pointer hover:bg-secondary/80 group"
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    `{{${variable.name}}}`
                                  );
                                  toast(
                                    `{{${variable.name}}} copied to clipboard`,
                                    {
                                      action: {
                                        label: "Close",
                                        onClick: () => toast.dismiss(),
                                      },
                                    }
                                  );
                                }}
                              >
                                <td className="px-4 py-2">{variable.name}</td>
                                <td className="px-4 py-2 text-right">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      useVariableStore
                                        .getState()
                                        .deleteVariable(variable.id);
                                      toast(
                                        `Variable "${variable.name}" deleted`
                                      );
                                    }}
                                    className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-red-500 transition-colors"
                                  >
                                    <Trash className="h-4 w-4" />
                                  </button>
                                </td>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  {/* Table Variables */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Database className="w-4 h-4" />
                      Table Variables
                    </h4>
                    <div className="border border-[#333] rounded-lg">
                      <Accordion type="single" collapsible className="w-full">
                        {Object.values(variables)
                          .filter((v) => v.type === "table")
                          .map((variable) => (
                            <AccordionItem
                              key={variable.id}
                              value={variable.id}
                            >
                              <AccordionTrigger className="text-left hover:no-underline px-4 group">
                                <div className="flex items-center gap-2 flex-1">
                                  <Database className="w-4 h-4" />
                                  <span>{variable.name}</span>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    useVariableStore
                                      .getState()
                                      .deleteVariable(variable.id);
                                    toast(`Table "${variable.name}" deleted`);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-red-500 transition-colors mr-2"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4 px-4">
                                <div className="space-y-2">
                                  <p className="text-sm text-gray-500 mb-2">
                                    Columns:
                                  </p>
                                  <div className="space-y-1">
                                    {variable.columns?.map((column, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center justify-between p-2 bg-secondary/20 rounded text-sm cursor-pointer hover:bg-secondary/40 group"
                                        onClick={() => {
                                          navigator.clipboard.writeText(
                                            `{{${variable.name}.${column}}}`
                                          );
                                          toast(
                                            `{{${variable.name}.${column}}} copied to clipboard`,
                                            {
                                              action: {
                                                label: "Close",
                                                onClick: () => toast.dismiss(),
                                              },
                                            }
                                          );
                                        }}
                                      >
                                        <span>{column}</span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500">
                                            Click to copy
                                          </span>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              useVariableStore
                                                .getState()
                                                .removeColumnFromTable(
                                                  variable.id,
                                                  column
                                                );
                                              toast(
                                                `Column "${column}" deleted from table "${variable.name}"`
                                              );
                                            }}
                                            className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-red-500 transition-colors"
                                          >
                                            <Trash className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                    )) || (
                                      <p className="text-sm text-gray-500">
                                        No columns defined
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                      </Accordion>

                      {Object.values(variables).filter(
                        (v) => v.type === "table"
                      ).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-8">
                          No table variables defined
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-6 left-6 flex gap-2 flex-shrink-0">
            <Button variant="default" onClick={() => onOpenChange(false)}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ... existing dialogs ... */}
      <AddVariableDialog
        open={isVariableDialogOpen}
        onOpenChange={setIsVariableDialogOpen}
        onAddVariable={onAddVariable}
        defaultType="input"
        currentAgentId={currentAgent?.id || ""}
      />
      <AddSourceDialog
        open={isSourceDialogOpen}
        onOpenChange={setIsSourceDialogOpen}
        onAddSource={(source) => console.log(source)}
      />
    </>
  );
};

export default ToolsSheet;
