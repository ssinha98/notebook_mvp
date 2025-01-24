import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Wrench, FileText, Settings, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Variable } from "@/types/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import AddVariableDialog from "@/pages/components/AddVariableDialog";
import AddSourceDialog from "./AddSourceDialog";
import { useSourceStore } from "@/lib/store";

interface ToolsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variables: Variable[];
  onAddVariable: (variable: Variable) => void;
}

const ToolsSheet: React.FC<ToolsSheetProps> = ({
  open,
  onOpenChange,
  variables,
  onAddVariable,
}) => {
  const [isVariableDialogOpen, setIsVariableDialogOpen] = useState(false);
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false);
  const sources = useSourceStore((state) => state.sources);

  const handleAddVariable = () => {
    setIsVariableDialogOpen(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[50vh] bg-[#1e1e1e] border-t border-[#333] rounded-t-2xl"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Tools
            </SheetTitle>
          </SheetHeader>

          {/* Scrollable content area */}
          <div className="overflow-y-auto flex-1 mb-[60px]">
            {/* Main content grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Sources Section */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
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
                <AddSourceDialog
                  open={isSourceDialogOpen}
                  onOpenChange={setIsSourceDialogOpen}
                  onAddSource={(source) => console.log(source)}
                  // onClose={() => setIsDialogOpen(false)}
                />
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(sources).map(([name, source]) => (
                      <TableRow key={name}>
                        <td className="px-4 py-2">{name}</td>
                        <td className="px-4 py-2">{source.type}</td>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Variables Section */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
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

                {/* Input Variables */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Input Variables</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variables
                        .filter((v) => v.type === "input")
                        .map((variable, index) => (
                          <TableRow key={index}>
                            <td className="px-4 py-2">{variable.name}</td>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Intermediate Variables */}
                <div>
                  <h4 className="text-sm font-medium mb-2">
                    Intermediate Variables
                  </h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variable Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {variables
                        .filter((v) => v.type === "intermediate")
                        .map((variable, index) => (
                          <TableRow key={index}>
                            <td className="px-4 py-2">{variable.name}</td>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="absolute bottom-6 left-6 flex gap-2">
            <Button variant="default" onClick={() => onOpenChange(false)}>
              <Check className="w-4 h-4 mr-2" />
              Done
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <AddVariableDialog
        open={isVariableDialogOpen}
        onOpenChange={setIsVariableDialogOpen}
        onAddVariable={onAddVariable}
        defaultType="input"
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
