import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { useSourceStore } from "@/lib/store";
import { api } from "@/tools/api";
import TransformCSV from "./TransformCSV";
import ImportCSV from "./ImportCSV";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useSourceStore } from "@/lib/store";
import { fileManager } from "@/tools/fileManager";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";

interface Source {
  id: string;
  name: string;
  type: "image" | "csv" | "pdf" | "website";
  file: File | null;
  url?: string;
  serverFilePath?: string;
}

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddSource: (source: Source) => void;
}

interface ColumnData {
  headers: string[];
  data: any[];
  fileName: string;
}

const AddSourceDialog: React.FC<AddSourceDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const addFileNickname = useSourceStore((state) => state.addFileNickname);
  // Comment out old source store usage
  // const addSource = useSourceStore((state) => state.addSource);
  const [step, setStep] = useState<
    "select" | "details" | "csv-configure" | "csv-preview"
  >("select");
  const [selectedType, setSelectedType] = useState<Source["type"]>("pdf");
  const [newSource, setNewSource] = useState<Source>({
    id: crypto.randomUUID(),
    name: "",
    type: "pdf",
    file: null,
  });
  const [columnData, setColumnData] = useState<ColumnData>({
    headers: [],
    data: [],
    fileName: "",
  });
  const [processedData, setProcessedData] = useState<any>(null);
  const [user] = useAuthState(getAuth());

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name);

      setNewSource({
        ...newSource,
        file,
      });
    }
  };

  const handleConfigureNext = (data: any) => {
    console.log("Filter Data Received:", {
      filters:
        data.filterCriteria?.map((filter: any) => ({
          column: filter.column,
          operator: filter.operator,
          value: filter.value,
        })) || [],
      totalFilters: data.filterCriteria?.length || 0,
    });

    // Comment out the screen change for now
    setProcessedData(data);
    setStep("csv-preview");
  };

  const handleImport = () => {
    // Comment out old source store usage
    /*
    if (processedData) {
      const sourceName = columnData.fileName;
      addSource(sourceName, {
        originalName: columnData.fileName,
        type: "csv",
        processedData: processedData.processedData,
        rawData: processedData.rawData,
        metadata: processedData.metadata,
      });
      toast.success(`Added source: ${sourceName}`);
    }
    */
    onOpenChange(false);
  };

  const handleTypeSelect = (type: Source["type"]) => {
    setSelectedType(type);
    setStep("details"); // Always go to details, no special CSV handling
  };

  const handleNext = () => {
    if (step === "details" && selectedType === "csv") {
      setStep("csv-configure");
    } else if (step === "csv-configure") {
      setStep("csv-preview");
    }
  };

  const handleBack = () => {
    if (step === "csv-preview") {
      setStep("csv-configure");
    } else if (step === "csv-configure") {
      setStep("details");
    } else if (step === "details") {
      setStep("select");
    }
  };

  const handleSaveSource = async () => {
    if (!newSource.name || (!newSource.file && !newSource.url)) {
      toast.error("Please provide required fields");
      return;
    }

    try {
      const result = await fileManager.handleFile({
        file: newSource.file || undefined,
        userId: user?.uid || "",
        nickname: newSource.name,
        type: selectedType,
        url: newSource.url,
      });

      if (result.success && result.data) {
        addFileNickname(
          newSource.name,
          newSource.file?.name || newSource.url || "",
          result.data.download_link || ""
        );
        toast.success("Source added successfully");
        onOpenChange(false);
      } else {
        throw new Error("Failed to add source");
      }
    } catch (error) {
      console.error("Error saving source:", error);
      toast.error("Failed to add source");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[2000] bg-gray-800 min-w-[800px] max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Add New Source"}
            {step === "details" &&
              `Add New ${selectedType.toUpperCase()} Source`}
          </DialogTitle>
        </DialogHeader>

        {step === "select" ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {["image", "pdf", "csv", "website"].map((type) => (
              <Button
                key={type}
                onClick={() => handleTypeSelect(type as Source["type"])}
                className="h-24 flex flex-col items-center justify-center"
              >
                <span className="text-lg capitalize">{type}</span>
              </Button>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 py-4">
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => setStep("select")}
            >
              ← Back
            </Button>

            <div className="grid gap-2">
              <label htmlFor="name">Source Name</label>
              <Input
                id="name"
                value={newSource.name}
                onChange={(e) =>
                  setNewSource({ ...newSource, name: e.target.value })
                }
                placeholder="Enter source name"
              />
            </div>

            <div className="grid gap-2">
              <label htmlFor="file">Upload File</label>
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                accept={
                  selectedType === "pdf"
                    ? ".pdf"
                    : selectedType === "csv"
                      ? ".csv"
                      : ".jpg,.jpeg,.png"
                }
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button onClick={handleSaveSource}>Add Source</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSourceDialog;
