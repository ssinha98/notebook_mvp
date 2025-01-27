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

interface Source {
  id: string;
  name: string;
  type: "image" | "csv" | "pdf" | "website";
  file: File | null;
  url?: string;
}

interface AddSourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // onAddSource: (source: Source) => void;
}

const AddSourceDialog: React.FC<AddSourceDialogProps> = ({
  open,
  onOpenChange,
  // onAddSource,
}) => {
  const [step, setStep] = useState<"select" | "details">("select");
  const [selectedType, setSelectedType] = useState<Source["type"]>("pdf");
  const [newSource, setNewSource] = useState<Source>({
    id: crypto.randomUUID(),
    name: "",
    type: "pdf",
    file: null,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewSource({ ...newSource, file: e.target.files[0] });
    }
  };

  const handleSaveSource = async () => {
    if (!newSource.name.trim() || !newSource.file) return;

    try {
      const result = await api.uploadFile(
        newSource.file,
        selectedType,
        newSource.name
      );

      if (result.success) {
        onOpenChange(false);
        setNewSource({
          id: crypto.randomUUID(),
          name: "",
          type: "pdf",
          file: null,
        });
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleTypeSelect = (type: Source["type"]) => {
    if (type === "pdf") {
      setSelectedType(type);
      setStep("details");
    } else {
      alert("Coming soon!");
    }
  };

  const handleBack = () => {
    setStep("select");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[2000] bg-gray-800">
        <DialogHeader>
          <DialogTitle>
            {step === "select"
              ? "Add New Source"
              : `Add New ${selectedType.toUpperCase()} Source`}
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
              </>
            )}

            <Button onClick={handleSaveSource} className="mt-2">
              Add Source
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddSourceDialog;
