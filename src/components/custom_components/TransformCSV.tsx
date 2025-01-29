import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Check, Plus, FileSpreadsheet, Expand, X, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import {
  SelectItem,
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSourceStore } from "@/lib/store";
import { toast } from "sonner";

interface TransformCSVProps {
  onNext: (data: any) => void;
  onBack: () => void;
  columns: string[];
  fileName: string;
  filePath: string; // This will now be the full server filepath
  previewData: any[];
}

// Define types for our filter criteria
interface FilterCriteria {
  id: string; // unique identifier for each row
  column: string;
  operator: string;
  value: string;
}

const OPERATORS = [
  "equals",
  "not equals",
  "contains",
  "starts with",
  "ends with",
  "greater than",
  "less than",
];

const TransformCSV: React.FC<TransformCSVProps> = ({
  onNext,
  onBack,
  columns,
  fileName,
  filePath,
  previewData,
}) => {
  const [savedTabs, setSavedTabs] = useState({
    filters: false,
    joins: false,
    missingData: false,
    types: false,
    code: false,
  });

  const [selectedColumn, setSelectedColumn] = useState<string>("");

  // Track all filter criteria
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria[]>([
    { id: "1", column: "", operator: "", value: "" },
  ]);

  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const addSource = useSourceStore((state) => state.addSource);

  // Log columns when component mounts or columns change
  console.log("Available columns:", columns);

  const handleColumnSelect = (value: string) => {
    console.log("Selected column:", value);
    setSelectedColumn(value);
  };

  const handleSaveToggle = (tab: keyof typeof savedTabs) => {
    setSavedTabs((prev) => ({
      ...prev,
      [tab]: !prev[tab],
    }));
  };

  const addNewRow = () => {
    setFilterCriteria([
      ...filterCriteria,
      {
        id: Math.random().toString(36).substr(2, 9),
        column: "",
        operator: "",
        value: "",
      },
    ]);
  };

  const updateFilter = (
    id: string,
    field: keyof FilterCriteria,
    value: string
  ) => {
    setFilterCriteria((prevCriteria) =>
      prevCriteria.map((criteria) =>
        criteria.id === id ? { ...criteria, [field]: value } : criteria
      )
    );
  };

  // Log current filter criteria whenever it changes
  useEffect(() => {
    console.log("Current filter criteria:", filterCriteria);
  }, [filterCriteria]);

  const processAndSaveFilters = async () => {
    console.log("Starting processAndSaveFilters");
    setIsProcessing(true);

    try {
      // Log what we're sending to the backend
      const requestBody = {
        filePath: filePath,
        filterCriteria: filterCriteria.filter(
          (f) => f.column && f.operator && f.value
        ),
      };
      console.log("Sending to backend:", requestBody);

      const response = await fetch(
        "https://test-render-q8l2.onrender.com/api/process-csv",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Backend response:", data);

      if (data.success) {
        onNext({
          processedData: data.processedData,
          rawData: data.rawData,
          originalName: fileName,
          filterCriteria: filterCriteria,
          metadata: data.metadata,
        });
        toast.success("CSV processed successfully");
      } else {
        console.error("Processing failed:", data.error);
        toast.error(`Failed to process CSV: ${data.error}`);
      }
    } catch (error) {
      console.error("Error making request:", error);
      toast.error("Error processing CSV file");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Preview Alert */}
      {showPreview && (
        <Alert className="fixed top-4 left-1/2 -translate-x-1/2 w-[800px] bg-gray-800 border-gray-700 z-[2002]">
          <div className="flex justify-between items-start mb-2">
            <AlertTitle className="text-lg font-semibold text-white">
              Preview: {fileName}
            </AlertTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowPreview(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <AlertDescription>
            <div className="overflow-x-auto max-h-[300px]">
              <table className="w-full text-sm text-white">
                <thead>
                  <tr className="bg-gray-700">
                    {columns.map((header) => (
                      <th
                        key={header}
                        className="p-2 text-left border-b border-gray-600"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr
                      key={index}
                      className="border-b border-gray-700 hover:bg-gray-700/50"
                    >
                      {columns.map((header) => (
                        <td key={header} className="p-2">
                          {row[header]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <div className="grid gap-4">
        <Button variant="ghost" className="w-fit" onClick={onBack}>
          ← Back
        </Button>

        <Alert className="bg-gray-800 border-gray-700">
          <AlertDescription>
            <div className="flex items-center gap-2 text-gray-400">
              <FileSpreadsheet className="h-5 w-5" />
              <span className="flex-1">{fileName}</span>
              <button
                onClick={() => setShowPreview(true)}
                className="hover:text-white transition-colors"
              >
                <Expand className="h-5 w-5" />
              </button>
            </div>
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="filters" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-900">
            <TabsTrigger
              value="filters"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white relative"
            >
              Filters
              {savedTabs.filters && (
                <Check className="w-4 h-4 text-green-500 absolute -right-1 -top-1" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="joins"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white relative"
            >
              Joins
              {savedTabs.joins && (
                <Check className="w-4 h-4 text-green-500 absolute -right-1 -top-1" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="missing-data"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white relative"
            >
              Missing Data
              {savedTabs.missingData && (
                <Check className="w-4 h-4 text-green-500 absolute -right-1 -top-1" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="types"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white relative"
            >
              Types
              {savedTabs.types && (
                <Check className="w-4 h-4 text-green-500 absolute -right-1 -top-1" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white relative"
            >
              Code
              {savedTabs.code && (
                <Check className="w-4 h-4 text-green-500 absolute -right-1 -top-1" />
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="filters">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Filters</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure your data filters here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filterCriteria.map((criteria) => (
                  <div key={criteria.id} className="flex gap-4 items-center">
                    {/* Column Select */}
                    <Select
                      value={criteria.column}
                      onValueChange={(value) =>
                        updateFilter(criteria.id, "column", value)
                      }
                    >
                      <SelectTrigger className="w-[250px] bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 z-[2001]">
                        {columns.map((column) => (
                          <SelectItem
                            key={column}
                            value={column}
                            className="text-white hover:bg-gray-700"
                          >
                            {column}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Operator Select */}
                    <Select
                      value={criteria.operator}
                      onValueChange={(value) =>
                        updateFilter(criteria.id, "operator", value)
                      }
                    >
                      <SelectTrigger className="w-[200px] bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select operator" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 z-[2001]">
                        {OPERATORS.map((op) => (
                          <SelectItem
                            key={op}
                            value={op}
                            className="text-white hover:bg-gray-700"
                          >
                            {op}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Value Input */}
                    <Input
                      className="flex-1 bg-gray-700 border-gray-600 text-white"
                      placeholder="Enter value"
                      value={criteria.value}
                      onChange={(e) =>
                        updateFilter(criteria.id, "value", e.target.value)
                      }
                    />
                  </div>
                ))}

                {/* Add new row button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={addNewRow}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => {
                    handleSaveToggle("filters");
                    // You can access filterCriteria here to save/process it
                    console.log("Saving filters:", filterCriteria);
                  }}
                  variant={savedTabs.filters ? "destructive" : "default"}
                >
                  {savedTabs.filters ? "Unsave" : "Save"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="joins">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Joins</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure your data joins here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Joins content will go here */}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveToggle("joins")}
                  variant={savedTabs.joins ? "destructive" : "default"}
                >
                  {savedTabs.joins ? "Unsave" : "Save"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="missing-data">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Missing Data</CardTitle>
                <CardDescription className="text-gray-400">
                  Handle missing data options here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Missing Data content will go here */}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveToggle("missingData")}
                  variant={savedTabs.missingData ? "destructive" : "default"}
                >
                  {savedTabs.missingData ? "Unsave" : "Save"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="types">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Types</CardTitle>
                <CardDescription className="text-gray-400">
                  Configure column types here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Types content will go here */}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveToggle("types")}
                  variant={savedTabs.types ? "destructive" : "default"}
                >
                  {savedTabs.types ? "Unsave" : "Save"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="code">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Code</CardTitle>
                <CardDescription className="text-gray-400">
                  View and edit transformation code here.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Code content will go here */}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={() => handleSaveToggle("code")}
                  variant={savedTabs.code ? "destructive" : "default"}
                >
                  {savedTabs.code ? "Unsave" : "Save"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end mt-4">
          <Button onClick={processAndSaveFilters} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Next"
            )}
          </Button>
        </div>
      </div>

      {/* Optional loading overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-4 rounded-lg">
            <Loader2 className="animate-spin h-8 w-8 mb-2" />
            <p className="text-white">Processing CSV file...</p>
          </div>
        </div>
      )}
    </>
  );
};

export default TransformCSV;
