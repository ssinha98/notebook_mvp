import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDropzone } from "react-dropzone";
import { api } from "@/tools/api";
import TransformCSV from "./TransformCSV";
import ImportCSV from "./ImportCSV";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { useSourceStore } from "@/lib/store";
import { fileManager } from "@/tools/fileManager";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { useVariableStore } from "@/lib/variableStore";
import { useAgentStore } from "@/lib/agentStore";
import { Check } from "lucide-react";
import VariableDropdown from "./VariableDropdown";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect } from "react";

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
  initialStep?:
    | "select"
    | "details"
    | "csv-configure"
    | "csv-preview"
    | "table-config";
  initialType?: Source["type"];
  openToTableVariable?: boolean; // Add this prop
}

interface ColumnData {
  headers: string[];
  data: any[];
  fileName: string;
}

interface TableConfig {
  tableName: string;
  columns: string[];
  previewData: any[];
  allData: any[];
  totalRows: number;
  selectedExistingTable?: string; // Add this field
}

// Update state definition to be simpler
interface ColumnMapping {
  csvColumn: string;
  existingColumn: string;
}

// // Initialize mappings when tableConfig is set
// useEffect(() => {
//   if (tableConfig && variables[selectedExistingTable]) {
//     const existingColumns = variables[selectedExistingTable].columns || [];
//     const initialMappings = tableConfig.columns.map((csvCol, index) => ({
//       csvColumn: csvCol,
//       existingColumn: existingColumns[index] || "",
//     }));
//     setColumnMappings(initialMappings);
//   }
// }, [tableConfig, selectedExistingTable]);

// Helper function to parse CSV
const parseCSV = (csvText: string): { headers: string[]; rows: any[] } => {
  const lines = csvText.split("\n").filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  // Parse headers (first row)
  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));

  // Parse data rows
  const rows = lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });
    return row;
  });

  return { headers, rows };
};

// Add this helper function to detect duplicates
const getDuplicateMappings = (mappings: ColumnMapping[]) => {
  const duplicates = new Map<string, string[]>();

  mappings.forEach((mapping, index) => {
    if (mapping.existingColumn !== "none") {
      if (!duplicates.has(mapping.existingColumn)) {
        duplicates.set(mapping.existingColumn, [mapping.csvColumn]);
      } else {
        duplicates.get(mapping.existingColumn)?.push(mapping.csvColumn);
      }
    }
  });

  return Array.from(duplicates.entries())
    .filter(([_, csvColumns]) => csvColumns.length > 1)
    .map(([existingColumn, csvColumns]) => ({
      existingColumn,
      csvColumns,
    }));
};

const AddSourceDialog: React.FC<AddSourceDialogProps> = ({
  open,
  onOpenChange,
  initialStep = "select",
  initialType = "pdf",
  openToTableVariable = false,
}) => {
  const addFileNickname = useSourceStore((state) => state.addFileNickname);
  const [step, setStep] = useState<
    | "select"
    | "details"
    | "csv-configure"
    | "csv-preview"
    | "table-config"
    | "table-update-config"
  >(initialStep);
  const [selectedType, setSelectedType] = useState<Source["type"]>(initialType);
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

  // New state for table variable functionality
  const [tableConfig, setTableConfig] = useState<TableConfig | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [selectedExistingTable, setSelectedExistingTable] =
    useState<string>("");

  // New state for column mapping
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);

  const currentAgent = useAgentStore((state) => state.currentAgent);
  const variables = useVariableStore((state) => state.variables);
  const {
    createVariable,
    loadVariables,
    addColumnToTable,
    updateTableColumn,
    addTableRow,
    updateTableVariable,
  } = useVariableStore();

  // Update step when dialog opens
  React.useEffect(() => {
    if (open) {
      if (openToTableVariable) {
        setStep("details");
        setSelectedType("csv");
      } else {
        setStep(initialStep);
        setSelectedType(initialType);
      }
    }
  }, [open, initialStep, initialType, openToTableVariable]);

  // Initialize mappings when tableConfig is set
  useEffect(() => {
    if (tableConfig && variables[selectedExistingTable]) {
      const existingColumns = variables[selectedExistingTable].columns || [];
      const initialMappings = tableConfig.columns.map((csvCol, index) => ({
        csvColumn: csvCol,
        // Match by index if the column exists, otherwise use "none"
        existingColumn: existingColumns[index] || "none",
      }));
      setColumnMappings(initialMappings);
    }
  }, [tableConfig, selectedExistingTable]);

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

    setProcessedData(data);
    setStep("csv-preview");
  };

  const handleImport = () => {
    onOpenChange(false);
  };

  const handleTypeSelect = (type: Source["type"]) => {
    setSelectedType(type);
    setStep("details");
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
    } else if (step === "table-config") {
      setStep("details");
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

  const handleConfigureTable = async () => {
    if (!csvFile) {
      toast.error("Please select a CSV file");
      return;
    }

    console.log("Configure Table Flow:", {
      selectedExistingTable,
      isUpdatingExisting: Boolean(
        selectedExistingTable && selectedExistingTable.trim() !== ""
      ),
      currentStep: step,
    });

    setIsProcessing(true);
    try {
      // Upload file to Firebase Storage first
      console.log("📤 Uploading CSV to Firebase Storage...");
      const uploadResult = await fileManager.handleFile({
        file: csvFile,
        userId: user?.uid || "",
        nickname: csvFile.name,
        type: "csv",
      });

      console.log("📤 Upload result:", uploadResult);

      if (!uploadResult.success || !uploadResult.data?.download_link) {
        throw new Error("Failed to upload file");
      }

      console.log(
        "🔗 File uploaded successfully, download link:",
        uploadResult.data.download_link
      );

      // Prepare request payload
      const requestPayload: any = {
        file_url: uploadResult.data.download_link,
        request_id: crypto.randomUUID(),
      };

      // If an existing table is selected, include its data
      if (selectedExistingTable) {
        const existingTable =
          useVariableStore.getState().variables[selectedExistingTable];
        if (existingTable && existingTable.type === "table") {
          const rows = Array.isArray(existingTable.value)
            ? existingTable.value
            : [];
          requestPayload.existing_table = {
            columns: existingTable.columns || [],
            rows: rows.map((row) => {
              const cleanRow: any = {};
              // Remove the 'id' field and clean up the data
              Object.keys(row).forEach((key) => {
                if (key !== "id") {
                  cleanRow[key] = row[key];
                }
              });
              return cleanRow;
            }),
          };
        }
      }

      // Use the new Python backend endpoint to parse CSV
      console.log("🤖 Calling new CSV parsing endpoint...", requestPayload);
      const response = await api.post(
        "/api/parse-csv-for-table",
        requestPayload
      );

      console.log("🤖 Backend response:", response);

      // Check if response has the expected structure
      if (!response.success) {
        console.error("❌ Backend returned error:", response);
        throw new Error(`Backend error: ${response.error || "Unknown error"}`);
      }

      // Handle case where response.data might be null or undefined
      if (!response.data) {
        console.error("❌ Backend returned no data:", response);
        throw new Error("Backend returned no data");
      }

      const { columns, rows, total_rows, file_name } = response.data;

      console.log("✅ Parsed CSV data:", {
        rowCount: rows?.length || 0,
        columnCount: columns?.length || 0,
        columns: columns,
        sampleRow: rows?.[0],
        fileName: file_name,
      });

      if (!rows || rows.length === 0) {
        throw new Error("CSV file is empty or invalid");
      }

      setTableConfig({
        tableName: csvFile.name.replace(".csv", ""), // Use the original filename
        columns: columns,
        previewData: rows.slice(0, 5),
        allData: rows,
        totalRows: total_rows,
        selectedExistingTable: selectedExistingTable,
      });

      const isUpdatingExistingTable =
        selectedExistingTable && selectedExistingTable.trim() !== "";
      console.log("Routing Decision:", {
        isUpdatingExistingTable,
        routingTo: isUpdatingExistingTable
          ? "table-update-config"
          : "table-config",
      });

      setStep(isUpdatingExistingTable ? "table-update-config" : "table-config");
    } catch (error) {
      console.error("❌ Error configuring table:", error);
      toast.error("Failed to parse CSV file");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTableVariable = async () => {
    if (!tableConfig || !currentAgent?.id) {
      toast.error("Missing table configuration or agent");
      return;
    }

    setIsProcessing(true);
    try {
      // First, create an empty table variable
      const tableVariable = await createVariable(
        tableConfig.tableName,
        "table",
        currentAgent.id,
        []
      );

      // Add each column to the table
      for (let i = 0; i < tableConfig.columns.length; i++) {
        const newColumnName = tableConfig.columns[i];
        await addColumnToTable(tableVariable.id, newColumnName);
      }

      // Add all rows with their data
      for (
        let rowIndex = 0;
        rowIndex < tableConfig.allData.length;
        rowIndex++
      ) {
        const row = tableConfig.allData[rowIndex];
        const newRow: any = {};

        // Map each column directly using the user-edited column names
        tableConfig.columns.forEach((columnName, index) => {
          // Get the value from the original data using the same column name
          const value = row[columnName];
          newRow[columnName] =
            value === null ||
            value === undefined ||
            value === "NaN" ||
            value === "null"
              ? ""
              : String(value);
        });

        // Add the row to the table
        await addTableRow(tableVariable.id, newRow);
      }

      // Reload variables to update the UI
      await loadVariables(currentAgent.id);

      toast.success(
        `Table variable "${tableConfig.tableName}" created successfully with ${tableConfig.allData.length} rows`
      );
      onOpenChange(false);

      // Reset form
      setNewSource({
        id: crypto.randomUUID(),
        name: "",
        type: "pdf",
        file: null,
      });
      setCsvFile(null);
      setTableConfig(null);
      setStep("select");
    } catch (error) {
      console.error("Error creating table variable:", error);
      toast.error("Failed to create table variable");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTableVariable = async () => {
    if (!tableConfig || !selectedExistingTable) return;

    setIsProcessing(true);
    try {
      const existingTable = variables[selectedExistingTable];
      const existingRows = Array.isArray(existingTable.value)
        ? existingTable.value
        : [];

      // First add any new columns
      const newColumns = columnMappings
        .filter((mapping) => mapping.existingColumn.startsWith("new_column:"))
        .map((mapping) => mapping.csvColumn);

      for (const newColumn of newColumns) {
        await addColumnToTable(selectedExistingTable, newColumn);
      }

      // Map new data according to column mappings
      const newRows = tableConfig.allData.map((row) => {
        const mappedRow: any = {};
        columnMappings.forEach((mapping) => {
          if (mapping.existingColumn === "none") return;

          if (mapping.existingColumn.startsWith("new_column:")) {
            // For new columns, use the original column name
            mappedRow[mapping.csvColumn] = row[mapping.csvColumn];
          } else {
            // For existing columns, use the mapped name
            mappedRow[mapping.existingColumn] = row[mapping.csvColumn];
          }
        });
        return mappedRow;
      });

      // Append new rows to existing ones
      const updatedRows = [...existingRows, ...newRows];

      // Update the table
      await updateTableVariable(selectedExistingTable, updatedRows);

      toast.success(`Successfully added ${newRows.length} rows to table`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating table:", error);
      toast.error("Failed to update table");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset form
    setNewSource({
      id: crypto.randomUUID(),
      name: "",
      type: "pdf",
      file: null,
    });
    setCsvFile(null);
    setTableConfig(null);
  };

  // Drag & Drop for CSV table variable
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file && file.type === "text/csv") {
        setCsvFile(file);
      } else {
        toast.error("Please select a valid CSV file");
      }
    },
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  // Get only table variables for the current agent
  const tableVariables = Object.values(variables).filter(
    (v) => v.type === "table" && v.agentId === currentAgent?.id
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="z-[2000] bg-gray-800 max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select" && "Add New Source"}
            {step === "details" &&
              `Add New ${selectedType.toUpperCase()} Source`}
            {step === "table-config" && "Configure New Table Variable"}
            {step === "table-update-config" && "Update Existing Table Variable"}
          </DialogTitle>
        </DialogHeader>

        {step === "table-update-config" ? (
          <div className="space-y-6 py-4">
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => setStep("details")}
            >
              ← Back
            </Button>

            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-4">
                    Column Mapping Configuration
                  </h3>

                  {/* Add a scrollable container around the Table */}
                  <div className="max-h-[500px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-1/2 sticky top-0 bg-gray-800">
                            Uploaded CSV Columns
                          </TableHead>
                          <TableHead className="w-1/2 sticky top-0 bg-gray-800">
                            Existing Table Variable Columns
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {columnMappings.map((mapping, index) => {
                          const existingTable =
                            variables[selectedExistingTable];
                          const existingColumns = existingTable?.columns || [];

                          // Get preview data for both columns
                          const csvPreviewData = tableConfig?.previewData
                            .map((row) => row[mapping.csvColumn])
                            .slice(0, 3);
                          const existingPreviewData = Array.isArray(
                            existingTable?.value
                          )
                            ? existingTable.value
                                .slice(0, 3)
                                .map((row) => row[mapping.existingColumn])
                            : [];

                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <div className="space-y-2">
                                  <div className="font-medium truncate">
                                    {mapping.csvColumn}
                                  </div>
                                  {csvPreviewData && (
                                    <div className="text-xs text-gray-400 max-w-[200px]">
                                      Preview:{" "}
                                      {csvPreviewData.slice(0, 3).map((val) => (
                                        <div key={val} className="truncate">
                                          {val}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-2">
                                  <Select
                                    value={mapping.existingColumn}
                                    onValueChange={(selectedColumn) => {
                                      const newMappings = [...columnMappings];
                                      newMappings[index] = {
                                        ...mapping,
                                        existingColumn: selectedColumn,
                                      };
                                      setColumnMappings(newMappings);
                                    }}
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue placeholder="Select a column" />
                                    </SelectTrigger>
                                    <SelectContent
                                      side="bottom"
                                      position="popper"
                                      className="z-[9999]"
                                    >
                                      <SelectItem value="none">
                                        Don't upload this column
                                      </SelectItem>
                                      <SelectItem
                                        value={`new_column:${mapping.csvColumn}`}
                                      >
                                        Add as new column "{mapping.csvColumn}"
                                      </SelectItem>
                                      <SelectItem value="divider" disabled>
                                        ─────────────
                                      </SelectItem>
                                      {existingColumns.map((existingColumn) => {
                                        const mappedTo = columnMappings.find(
                                          (m) =>
                                            m.existingColumn ===
                                              existingColumn &&
                                            m.csvColumn !== mapping.csvColumn
                                        )?.csvColumn;

                                        return (
                                          <SelectItem
                                            key={existingColumn}
                                            value={existingColumn}
                                          >
                                            <div className="flex items-center justify-between w-full">
                                              <div className="truncate max-w-[200px]">
                                                {existingColumn}
                                              </div>
                                              {mappedTo && (
                                                <span className="ml-2 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                                  Mapped to {mappedTo}
                                                </span>
                                              )}
                                            </div>
                                          </SelectItem>
                                        );
                                      })}
                                    </SelectContent>
                                  </Select>
                                  {mapping.existingColumn &&
                                    existingPreviewData && (
                                      <div className="text-xs text-gray-400 max-w-[200px]">
                                        Preview:{" "}
                                        {existingPreviewData.map((val) => (
                                          <div key={val} className="truncate">
                                            {val}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {getDuplicateMappings(columnMappings).length > 0 && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded">
                  <h4 className="text-red-400 font-semibold mb-2">
                    Duplicate Mappings Found:
                  </h4>
                  <ul className="space-y-1 text-sm">
                    {getDuplicateMappings(columnMappings).map(
                      ({ existingColumn, csvColumns }) => (
                        <li key={existingColumn}>
                          Column "{existingColumn}" is mapped to multiple CSV
                          columns: {csvColumns.join(", ")}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  onClick={handleUpdateTableVariable}
                  disabled={
                    isProcessing ||
                    getDuplicateMappings(columnMappings).length > 0
                  }
                >
                  {isProcessing ? "Processing..." : "Update Table"}
                </Button>
              </div>
            </div>
          </div>
        ) : step === "select" ? (
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
        ) : step === "table-config" ? (
          <div className="space-y-6 py-4">
            <Button
              variant="ghost"
              className="w-fit"
              onClick={() => setStep("details")}
            >
              ← Back
            </Button>

            {tableConfig && (
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="table-name">Table Variable Name</Label>
                  <Input
                    id="table-name"
                    value={tableConfig.tableName}
                    onChange={(e) =>
                      setTableConfig({
                        ...tableConfig,
                        tableName: e.target.value,
                      })
                    }
                    placeholder="Enter table variable name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Column Names</Label>
                  <div className="max-h-32 overflow-y-auto border border-gray-600 rounded bg-gray-900 p-2 space-y-2">
                    {tableConfig.columns.map((column, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Label className="text-sm w-16 text-gray-300">
                          Col {index + 1}:
                        </Label>
                        <Input
                          value={column}
                          onChange={(e) => {
                            const newColumns = [...tableConfig.columns];
                            newColumns[index] = e.target.value;
                            setTableConfig({
                              ...tableConfig,
                              columns: newColumns,
                            });
                          }}
                          placeholder="Column name"
                          className="flex-1 text-sm"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-green-500 hover:text-green-400"
                          onClick={() => {
                            // Column header is confirmed - could add visual feedback here
                            toast.success(
                              `Column ${index + 1} header confirmed`
                            );
                          }}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-medium text-white">
                          Preview
                        </Label>
                        <span className="text-sm text-gray-400">
                          {tableConfig.totalRows} total rows
                        </span>
                      </div>

                      <div className="overflow-x-auto max-h-48 border border-gray-600 rounded bg-gray-900">
                        <Table className="text-xs">
                          <TableHeader>
                            <TableRow className="border-gray-700">
                              {tableConfig.columns.map((column, index) => (
                                <TableHead
                                  key={index}
                                  className="px-2 py-1 text-xs text-gray-300 bg-gray-800 border-gray-700"
                                >
                                  {column}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tableConfig.previewData.map((row, rowIndex) => (
                              <TableRow
                                key={rowIndex}
                                className="border-gray-700 hover:bg-gray-800"
                              >
                                {tableConfig.columns.map(
                                  (columnName, colIndex) => (
                                    <TableCell
                                      key={colIndex}
                                      className="px-2 py-1 text-xs max-w-24 truncate text-gray-300 border-gray-700"
                                    >
                                      {row[columnName] || ""}
                                    </TableCell>
                                  )
                                )}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {tableConfig.totalRows >
                        tableConfig.previewData.length && (
                        <p className="text-xs text-gray-400">
                          Showing first {tableConfig.previewData.length} rows of{" "}
                          {tableConfig.totalRows}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                  <Button
                    onClick={handleCreateTableVariable}
                    disabled={isProcessing || !tableConfig.tableName.trim()}
                  >
                    {isProcessing ? "Creating Table..." : "Upload Table"}
                  </Button>
                </div>
              </div>
            )}
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

            {selectedType === "csv" ? (
              <Tabs
                defaultValue={openToTableVariable ? "table" : "source"}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-700">
                  <TabsTrigger
                    value="source"
                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black"
                  >
                    Upload CSV as Source
                  </TabsTrigger>
                  <TabsTrigger
                    value="table"
                    className="data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:border-black"
                  >
                    Upload CSV as Table Variable
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="source" className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Source Name</Label>
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
                    <Label htmlFor="file">Upload File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".csv"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button onClick={handleSaveSource} disabled={isProcessing}>
                      {isProcessing ? "Processing..." : "Add Source"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="table" className="space-y-4">
                  <div className="space-y-4">
                    {/* Simple table selection dropdown */}
                    <div className="grid gap-2">
                      <Label>Update Existing Table Variable (Optional)</Label>
                      <Select
                        value={selectedExistingTable}
                        onValueChange={setSelectedExistingTable}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an existing table to update" />
                        </SelectTrigger>
                        <SelectContent className="z-[9999]">
                          {tableVariables.map((table) => (
                            <SelectItem key={table.id} value={table.id}>
                              {table.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-sm text-gray-400">
                        Select an existing table to update, or leave empty to
                        create a new table
                      </p>
                    </div>

                    <div
                      {...getRootProps()}
                      className="border-2 border-dashed border-gray-300 p-6 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
                    >
                      <input {...getInputProps()} />
                      <p className="text-gray-600">
                        Drag & drop CSV file here, or click to select file
                      </p>
                      {csvFile && (
                        <p className="text-sm text-green-600 mt-2">
                          Selected: {csvFile.name}
                        </p>
                      )}
                    </div>

                    <div className="text-center">
                      <input
                        type="file"
                        className="hidden"
                        id="csv-file-input"
                        accept=".csv"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setCsvFile(file);
                          }
                        }}
                      />
                      <Button
                        onClick={() =>
                          document.getElementById("csv-file-input")?.click()
                        }
                        variant="outline"
                      >
                        Select CSV File
                      </Button>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={handleConfigureTable}
                        disabled={isProcessing || !csvFile}
                      >
                        {isProcessing ? "Processing..." : "Configure Table"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              // Non-CSV file types (existing behavior)
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Source Name</Label>
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
                  <Label htmlFor="file">Upload File</Label>
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    accept={
                      selectedType === "pdf"
                        ? ".pdf"
                        : selectedType === "image"
                          ? ".jpg,.jpeg,.png"
                          : ""
                    }
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button onClick={handleSaveSource} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : "Add Source"}
                  </Button>
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
