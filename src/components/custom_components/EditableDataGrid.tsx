import React, { useState, useEffect, useRef } from "react";
import { DataGrid } from "react-data-grid";
import "react-data-grid/lib/styles.css";
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { FaExpandAlt } from "react-icons/fa";
import { Plus, Download } from "lucide-react";
import AddVariableDialog from "./AddVariableDialog";
import { Variable } from "@/types/types";

// Add CSS for selection mode and dark theme
const selectionStyles = `
  .rdg-selection-mode {
    user-select: none !important;
    cursor: grabbing !important;
  }
  
  .rdg-selection-mode * {
    user-select: none !important;
    cursor: grabbing !important;
  }
  
  .rdg-cell-selected {
    background-color: rgba(59, 130, 246, 0.3) !important;
    border: 1px solid #3b82f6 !important;
  }

  /* Dark theme styles for DataGrid */
  .rdg {
    background-color: #141414 !important;
    color: #f3f4f6 !important;
    border: 1px solid #374151 !important;
  }

  .rdg-header-row {
    background-color: #000000 !important;
    color: #f3f4f6 !important;
    border-bottom: 1px solid #374151 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 100 !important;
    height: 35px !important;
  }

  .rdg-header-cell {
    background-color: #000000 !important;
    color: #f3f4f6 !important;
    border-right: 1px solid #374151 !important;
    font-weight: 600 !important;
    position: relative !important;
    z-index: 100 !important;
    opacity: 1 !important;
    height: 35px !important;
    line-height: 35px !important;
  }

  .rdg-header-cell * {
    background-color: #000000 !important;
  }

  .rdg-header-cell::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #000000 !important;
    z-index: -1;
  }

  .rdg-viewport {
    position: relative !important;
    overflow: auto !important;
  }

  .rdg-viewport-dragging {
    position: relative !important;
    overflow: auto !important;
  }

  .rdg-row {
    background-color: #141414 !important;
    color: #f3f4f6 !important;
    border-bottom: 1px solid #374151 !important;
    position: relative !important;
    z-index: 1 !important;
  }

  .rdg-row:hover {
    background-color: #1f2937 !important;
  }

  .rdg-cell {
    background-color: transparent !important;
    color: #f3f4f6 !important;
    border-right: 1px solid #374151 !important;
  }

  .rdg-cell:focus {
    outline: 2px solid #3b82f6 !important;
    outline-offset: -2px !important;
  }

  .rdg-cell-frozen {
    background-color: #1f2937 !important;
    position: relative !important;
    z-index: 10 !important;
  }

  .rdg-cell-frozen:hover {
    background-color: #374151 !important;
  }

  /* Ensure frozen header cells are solid black and positioned correctly */
  .rdg-header-cell.rdg-cell-frozen {
    background-color: #000000 !important;
    opacity: 1 !important;
    z-index: 101 !important;
    position: sticky !important;
    left: 0 !important;
  }

  .rdg-header-cell.rdg-cell-frozen * {
    background-color: #000000 !important;
  }

  /* Override any white backgrounds */
  .rdg * {
    scrollbar-width: thin;
    scrollbar-color: #4b5563 #141414;
  }

  .rdg *::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .rdg *::-webkit-scrollbar-track {
    background: #141414;
  }

  .rdg *::-webkit-scrollbar-thumb {
    background-color: #4b5563;
    border-radius: 4px;
  }

  .rdg *::-webkit-scrollbar-thumb:hover {
    background-color: #6b7280;
  }
`;

interface FirebaseTableData {
  columns: string[];
  value: any[];
}

interface EditableDataGridProps {
  firebaseData: FirebaseTableData;
  onDataChange?: (data: any[]) => void;
  onSelectionChange?: (selectedCells: Set<string>, selectedData: any[]) => void;
  onColumnsChange?: (columns: string[]) => void;
  tableWidth?: string;
  tableHeight?: string;
  className?: string;
  // Add these new props
  currentTableId?: string;
  currentAgentId?: string;
  onAddVariable?: (variable: Variable) => void;
}

const EditableDataGrid: React.FC<EditableDataGridProps> = ({
  firebaseData,
  onDataChange,
  onSelectionChange,
  onColumnsChange,
  tableWidth = "calc(100vw / 6)",
  tableHeight = "400px",
  className = "",
  currentTableId,
  currentAgentId,
  onAddVariable,
}) => {
  const [rows, setRows] = useState(firebaseData.value || []);
  // Set of 'rowIdx:colKey' for selected cells
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  // Last selected cell for shift+click
  const [lastSelectedCell, setLastSelectedCell] = useState<{
    rowIdx: number;
    colKey: string;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Dialog state for cell expansion
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCell, setEditingCell] = useState<{
    rowIdx: number;
    colKey: string;
    value: string;
  } | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Add Variable Dialog state
  const [isAddVariableDialogOpen, setIsAddVariableDialogOpen] = useState(false);

  // Update rows when firebaseData changes
  useEffect(() => {
    setRows(firebaseData.value || []);
  }, [firebaseData]);

  // Inject CSS styles
  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.textContent = selectionStyles;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  // Add Escape Key Handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedCells(new Set());
        setLastSelectedCell(null);
        onSelectionChange?.(new Set(), []); // Notify parent
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onSelectionChange]);

  // Handle opening the expand dialog
  const handleExpandCell = (
    rowIdx: number,
    colKey: string,
    value: string,
    e: React.MouseEvent
  ) => {
    e.stopPropagation(); // Prevent cell selection
    setEditingCell({ rowIdx, colKey, value });
    setEditingValue(value || "");
    setIsDialogOpen(true);
  };

  // Handle updating cell value from dialog
  const handleUpdateCellValue = () => {
    if (!editingCell) return;

    const updatedRows = rows.map((row, idx) => {
      if (idx === editingCell.rowIdx) {
        return { ...row, [editingCell.colKey]: editingValue };
      }
      return row;
    });

    setRows(updatedRows);
    onDataChange?.(updatedRows);
    setIsDialogOpen(false);
    setEditingCell(null);
    setEditingValue("");
  };

  // Handle closing dialog without changes
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCell(null);
    setEditingValue("");
  };

  // Handle opening the add column dialog
  const handleOpenAddColumnDialog = () => {
    if (currentTableId && currentAgentId) {
      setIsAddVariableDialogOpen(true);
    }
  };

  // Handle variable addition
  const handleAddVariableComplete = (variable: Variable) => {
    onAddVariable?.(variable);
    setIsAddVariableDialogOpen(false);
  };

  // Generate column definitions from Firebase columns array
  const generateColumns = (columnNames: string[]) => {
    const columns = [];

    // Always include ID column first (read-only)
    columns.push({
      key: "id",
      name: "ID",
      width: 120,
      resizable: true,
      sortable: true,
      frozen: true,
      renderCell: ({ row, rowIdx }: any) => {
        const cellKey = `${rowIdx}:id`;
        const isSelected = selectedCells.has(cellKey);
        const cellValue = row.id || "";

        return (
          <div
            style={{
              padding: "8px",
              color: "#666",
              fontFamily: "monospace",
              fontSize: "12px",
              background: isSelected ? "rgba(59,130,246,0.3)" : undefined,
              border: isSelected ? "1px solid #3b82f6" : undefined,
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
            onClick={(e) => handleCellClick(rowIdx, "id", e)}
          >
            <span
              style={{
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {cellValue}
            </span>
            <button
              onClick={(e) => handleExpandCell(rowIdx, "id", cellValue, e)}
              style={{
                marginLeft: "4px",
                padding: "2px",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#666",
                display: "flex",
                alignItems: "center",
                opacity: 0.7,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
            >
              <FaExpandAlt size={12} />
            </button>
          </div>
        );
      },
    });

    // Add columns from Firebase columns array
    columnNames.forEach((columnName) => {
      if (columnName !== "id") {
        columns.push({
          key: columnName,
          name: columnName,
          width: 200,
          resizable: true,
          sortable: true,
          editable: true,
          renderCell: ({ row, rowIdx }: any) => {
            const cellKey = `${rowIdx}:${columnName}`;
            const isSelected = selectedCells.has(cellKey);
            const cellValue = row[columnName] || "";

            return (
              <div
                style={{
                  padding: "8px",
                  wordBreak: "break-word",
                  background: isSelected ? "rgba(59,130,246,0.3)" : undefined,
                  border: isSelected ? "1px solid #3b82f6" : undefined,
                  cursor: "pointer",
                  userSelect: "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onClick={(e) => handleCellClick(rowIdx, columnName, e)}
              >
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {cellValue}
                </span>
                <button
                  onClick={(e) =>
                    handleExpandCell(rowIdx, columnName, cellValue, e)
                  }
                  style={{
                    marginLeft: "4px",
                    padding: "2px",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#666",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                >
                  <FaExpandAlt size={12} />
                </button>
              </div>
            );
          },
          renderEditCell: ({ row, onRowChange }: any) => (
            <input
              type="text"
              value={row[columnName] || ""}
              onChange={(e) =>
                onRowChange({ ...row, [columnName]: e.target.value })
              }
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                outline: "none",
                padding: "8px",
                fontSize: "14px",
              }}
            />
          ),
        });
      }
    });

    // Add "Add Column" button as a column header (only if we have table info)
    if (currentTableId && currentAgentId) {
      columns.push({
        key: "add-column",
        name: (
          <button
            onClick={handleOpenAddColumnDialog}
            style={{
              padding: "4px 8px",
              background: "#374151",
              border: "1px solid #4b5563",
              borderRadius: "4px",
              cursor: "pointer",
              color: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              fontWeight: "500",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#4b5563")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#374151")}
          >
            <Plus size={12} />
            Add Column
          </button>
        ),
        width: 120,
        resizable: false,
        sortable: false,
        editable: false,
        renderCell: () => (
          <div style={{ padding: "8px" }}>{/* Empty cell content */}</div>
        ),
      });
    }

    return columns;
  };

  const columns = generateColumns(firebaseData.columns || []);

  // Handle row changes (editing)
  function onRowsChange(updatedRows: any[]) {
    setRows(updatedRows);
    onDataChange?.(updatedRows);
  }

  // Handle cell click for column-only selection
  function handleCellClick(rowIdx: number, colKey: string, event: any): void {
    // Clear any text selection programmatically
    if (window.getSelection) {
      const sel = window.getSelection();
      if (sel && sel.removeAllRanges) sel.removeAllRanges();
    }
    if (
      event.shiftKey &&
      lastSelectedCell &&
      lastSelectedCell.colKey === colKey
    ) {
      // Select range in the same column
      const start = Math.min(lastSelectedCell.rowIdx, rowIdx);
      const end = Math.max(lastSelectedCell.rowIdx, rowIdx);
      const newSelection = new Set(selectedCells);
      for (let i = start; i <= end; i++) {
        newSelection.add(`${i}:${colKey}`);
      }
      setSelectedCells(newSelection);
      setLastSelectedCell({ rowIdx, colKey });
      // Optionally, call onSelectionChange with selected data
      const selectedData = rows.filter((_, idx) =>
        newSelection.has(`${idx}:${colKey}`)
      );
      onSelectionChange?.(newSelection, selectedData);
    } else {
      // Single cell select
      const cellKey = `${rowIdx}:${colKey}`;
      const newSelection = new Set<string>([cellKey]);
      setSelectedCells(newSelection);
      setLastSelectedCell({ rowIdx, colKey });
      // Optionally, call onSelectionChange with selected data
      const selectedData = [rows[rowIdx]];
      onSelectionChange?.(newSelection, selectedData);
    }
  }

  // Function to add a new column
  const addColumn = (columnName: string) => {
    const newColumns = [...firebaseData.columns, columnName];
    onColumnsChange?.(newColumns);
  };

  // Helper: get selected row indices from selectedCells
  const getSelectedRowIndices = () => {
    const rowIndices = new Set<number>();
    selectedCells.forEach((cellKey) => {
      const [rowIdx] = cellKey.split(":");
      rowIndices.add(Number(rowIdx));
    });
    return Array.from(rowIndices);
  };

  // Handler for deleting selected rows
  const handleDeleteRows = () => {
    const selectedRowIndices = getSelectedRowIndices();
    if (selectedRowIndices.length === 0) return;
    const newRows = rows.filter((_, idx) => !selectedRowIndices.includes(idx));
    setRows(newRows);
    setSelectedCells(new Set());
    setLastSelectedCell(null);
    onDataChange?.(newRows);
    onSelectionChange?.(new Set(), []);
  };

  // CSV conversion helper function
  const convertToCSV = (data: any[], columns: string[]): string => {
    // Escape CSV field if it contains comma, quote, or newline
    const escapeCSVField = (field: any): string => {
      if (field === null || field === undefined) return "";
      const stringField = String(field);
      if (
        stringField.includes(",") ||
        stringField.includes('"') ||
        stringField.includes("\n")
      ) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    // Create header row
    const header = columns.map(escapeCSVField).join(",");

    // Create data rows
    const dataRows = data.map((row) =>
      columns.map((column) => escapeCSVField(row[column] || "")).join(",")
    );

    return [header, ...dataRows].join("\n");
  };

  // Download CSV handler
  const handleDownloadCSV = () => {
    try {
      const csvContent = convertToCSV(rows, firebaseData.columns || []);
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");

      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "table_data.csv");
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={gridRef}
            className={`editable-data-grid ${className}`}
            style={{
              width: tableWidth,
              height: tableHeight,
              overflowX: "auto",
              border: "1px solid #374151",
              borderRadius: "8px",
              backgroundColor: "#141414", // Match the main background
            }}
          >
            <DataGrid
              columns={columns}
              rows={rows}
              onRowsChange={onRowsChange}
              rowKeyGetter={(row) => row.id}
              className="rdg" // Remove "rdg-light" and use just "rdg" for our custom dark theme
              style={{
                minWidth: "max-content",
                height: "100%",
                backgroundColor: "#141414",
              }}
            />

            {/* Selection info */}
            {selectedCells.size > 0 && (
              <div className="mt-2 text-sm text-gray-400">
                Selected {selectedCells.size} cell
                {selectedCells.size > 1 ? "s" : ""} - Use @selection to
                reference this data
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            disabled={getSelectedRowIndices().length === 0}
            onClick={handleDeleteRows}
          >
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Download CSV Button */}
      <div className="mt-3 flex justify-start">
        <Button
          onClick={handleDownloadCSV}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white"
          disabled={rows.length === 0}
        >
          <Download size={16} className="mr-2" />
          Download CSV
        </Button>
      </div>

      {/* Cell Expansion Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="max-w-2xl bg-black border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Edit Cell Content
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {editingCell && (
                <>
                  Editing cell in column "<strong>{editingCell.colKey}</strong>"
                  (Row {editingCell.rowIdx + 1})
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Textarea
              value={editingValue}
              onChange={(e) => setEditingValue(e.target.value)}
              placeholder="Enter cell content..."
              className="min-h-[200px] resize-y bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCloseDialog}
              className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
            >
              Close
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUpdateCellValue}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Update and Close
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Variable Dialog */}
      {currentTableId && currentAgentId && (
        <AddVariableDialog
          open={isAddVariableDialogOpen}
          onOpenChange={setIsAddVariableDialogOpen}
          onAddVariable={handleAddVariableComplete}
          currentAgentId={currentAgentId}
          defaultTab="add-column"
          preSelectedTableId={currentTableId}
        />
      )}
    </>
  );
};

export default EditableDataGrid;
