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
  const addSource = useSourceStore((state) => state.addSource); // Add this line
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File change event triggered");

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      console.log("File selected:", file.name);

      // Create FormData and upload file first
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "csv");

      try {
        // Upload the file first
        const response = await fetch(
          "https://test-render-q8l2.onrender.com/api/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        const uploadData = await response.json();
        console.log("File upload response:", uploadData);

        if (uploadData.success) {
          // Store the full filepath from the backend
          setNewSource({
            ...newSource,
            file,
            // Add a new property to store the server filepath
            serverFilePath: uploadData.filepath,
          });

          // Read CSV file for preview
          const reader = new FileReader();
          reader.onload = (event) => {
            console.log("File read successfully");
            const data = event.target?.result;
            try {
              const workbook = XLSX.read(data, { type: "binary" });
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              const headers = XLSX.utils.sheet_to_json(worksheet, {
                header: 1,
              })[0] as string[];
              const jsonData = XLSX.utils.sheet_to_json(worksheet);

              setColumnData({
                headers,
                data: jsonData,
                fileName: file.name,
              });
            } catch (error) {
              console.error("Error processing file:", error);
            }
          };

          reader.readAsBinaryString(file);

          if (selectedType === "csv") {
            setStep("csv-configure");
          }
        } else {
          toast.error("Failed to upload file");
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error("Failed to upload file");
      }
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
    // Add the source to the store before closing
    if (processedData) {
      const sourceName = columnData.fileName; // or however you want to name it
      addSource(sourceName, {
        originalName: columnData.fileName,
        type: "csv",
        processedData: processedData.processedData,
        rawData: processedData.rawData,
        metadata: processedData.metadata,
      });
      toast.success(`Added source: ${sourceName}`);
    }
    onOpenChange(false);
  };

  const handleTypeSelect = (type: Source["type"]) => {
    setSelectedType(type);
    if (type === "pdf") {
      setStep("details");
    } else if (type === "csv") {
      setStep("details");
    } else {
      alert("Coming soon!");
    }
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
    if (!newSource.name || !newSource.file) {
      toast.error("Please provide both name and file");
      return;
    }

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append("file", newSource.file);
      formData.append("type", newSource.type);

      // Upload to backend
      const response = await fetch(
        "https://test-render-q8l2.onrender.com/api/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.success) {
        // Add to source store
        addSource(newSource.name, {
          type: newSource.type,
          processedData: data.processed_data, // Text content from PDF
          originalName: newSource.file.name,
        });

        toast.success("Source added successfully");
        onOpenChange(false);
      } else {
        throw new Error(data.error || "Failed to upload file");
      }
    } catch (error) {
      console.error("Error saving source:", error);
      toast.error("Failed to add source");
    }
  };

  // Add console log in render to see what's being passed to TransformCSV
  console.log("Current columnData:", columnData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[2000] bg-gray-800 min-w-[800px] max-w-[1000px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Add New Source"}
            {step === "details" &&
              `Add New ${selectedType.toUpperCase()} Source`}
            {step === "csv-configure" && "Configure CSV Import"}
            {step === "csv-preview" && "Preview CSV Data"}
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
        ) : step === "csv-configure" ? (
          <TransformCSV
            onNext={handleConfigureNext}
            onBack={handleBack}
            columns={columnData.headers}
            fileName={columnData.fileName}
            previewData={columnData.data.slice(0, 5)}
            filePath={newSource.serverFilePath || ""}
          />
        ) : step === "csv-preview" ? (
          <ImportCSV
            onBack={handleBack}
            onImport={handleImport}
            processedData={processedData}
          />
        ) : (
          <div className="grid gap-4 py-4">
            <Button variant="ghost" className="w-fit" onClick={handleBack}>
              ← Back
            </Button>

            {selectedType === "website" ? (
              <div className="grid gap-2">
                <label htmlFor="name">Website Name</label>
                <Input
                  id="name"
                  value={newSource.name}
                  onChange={(e) =>
                    setNewSource({ ...newSource, name: e.target.value })
                  }
                  placeholder="Enter website name"
                />
                <label htmlFor="url">Website URL</label>
                <Input
                  id="url"
                  value={newSource.url || ""}
                  onChange={(e) =>
                    setNewSource({ ...newSource, url: e.target.value })
                  }
                  placeholder="Enter website URL"
                />
              </div>
            ) : (
              <>
                {selectedType !== "csv" && (
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
                )}

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
                  {selectedType === "csv" ? (
                    <Button onClick={handleNext}>Next</Button>
                  ) : (
                    <Button onClick={handleSaveSource}>Add Source</Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSourceDialog;
