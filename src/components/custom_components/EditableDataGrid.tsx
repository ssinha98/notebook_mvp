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
import { Input } from "@/components/ui/input";
import { FaExpandAlt, FaSortAmountDown, FaSortAmountUp } from "react-icons/fa";
import {
  Plus,
  Download,
  Copy,
  ChevronLeft,
  ChevronRight,
  Edit,
  Filter,
  SortAsc,
  SortDesc,
  Trash, // Add Trash icon import
  MoreHorizontal, // Add MoreHorizontal icon import
} from "lucide-react";
import AddVariableDialog from "./AddVariableDialog";
import { Variable } from "@/types/types";
import { toast } from "sonner";
import { useVariableStore } from "@/lib/variableStore";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onSelectionChange?: (
    selectedCells: Set<string>,
    selectedData: any[],
    selectedColumn?: string
  ) => void;
  onColumnsChange?: (columns: string[]) => void;
  tableWidth?: string;
  tableHeight?: string;
  className?: string;
  // Add these new props
  currentTableId?: string;
  currentAgentId?: string;
  onAddVariable?: (variable: Variable) => void;
  // Add this prop
  lastChange?: {
    variableId: string;
    changedRowId?: string;
    changedColumn?: string;
    timestamp: number;
  } | null;
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
  lastChange,
}) => {
  const [rows, setRows] = useState(firebaseData.value || []);
  // Add local column state for real-time updates
  const [localColumns, setLocalColumns] = useState(firebaseData.columns || []);
  const [isUpdatingLocally, setIsUpdatingLocally] = useState(false); // Add this line
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

  // Column name editing dialog state
  const [isColumnNameDialogOpen, setIsColumnNameDialogOpen] = useState(false);
  const [editingColumnName, setEditingColumnName] = useState<{
    oldName: string;
    newName: string;
  } | null>(null);

  // Filter state
  const [columnFilters, setColumnFilters] = useState<
    Record<string, Set<string>>
  >({});
  const [filterDropdownOpen, setFilterDropdownOpen] = useState<string | null>(
    null
  );

  // Sort state
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [sortDropdownOpen, setSortDropdownOpen] = useState<string | null>(null);
  const [errorColumns, setErrorColumns] = useState<Set<string>>(new Set());
  // Track which column (if any) is being error-sorted
  const [errorSortColumn, setErrorSortColumn] = useState<string | null>(null);

  // Keep the original row update logic
  useEffect(() => {
    if (!isUpdatingLocally) {
      setRows(firebaseData.value || []);
    }
  }, [firebaseData.value, isUpdatingLocally]);

  // Update local columns when firebaseData changes
  useEffect(() => {
    // console.log("useEffect triggered - firebaseData.columns changed:", {
    //   isUpdatingLocally,
    //   firebaseDataColumns: firebaseData.columns,
    //   currentLocalColumns: localColumns,
    // });
    if (!isUpdatingLocally) {
      setLocalColumns(firebaseData.columns || []);
    }
  }, [firebaseData.columns, isUpdatingLocally]);

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
        onSelectionChange?.(new Set(), [], undefined); // Notify parent
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

  // Handle column name update with real-time updates
  const handleColumnNameUpdate = () => {
    if (!editingColumnName || !currentTableId || !currentAgentId) {
      console.error("Missing required data:", {
        editingColumnName,
        currentTableId,
        currentAgentId,
      });
      return;
    }

    // console.log("Renaming column:", {
    //   tableId: currentTableId,
    //   agentId: currentAgentId,
    //   oldName: editingColumnName.oldName,
    //   newName: editingColumnName.newName,
    //   isUpdatingLocally: isUpdatingLocally,
    // });

    // Set flag to prevent useEffect from overwriting
    setIsUpdatingLocally(true);
    // console.log("Set isUpdatingLocally to true");

    const newColumns = localColumns.map((col) =>
      col === editingColumnName.oldName ? editingColumnName.newName : col
    );

    // Update data rows to use new column name
    const updatedRows = rows.map((row) => {
      const newRow = { ...row };
      if (newRow[editingColumnName.oldName] !== undefined) {
        newRow[editingColumnName.newName] = newRow[editingColumnName.oldName];
        delete newRow[editingColumnName.oldName];
      }
      return newRow;
    });

    // console.log("Updated local state:", {
    //   newColumns,
    //   updatedRowsCount: updatedRows.length,
    // });

    // Update immediately for real-time feedback
    setRows(updatedRows);
    setLocalColumns(newColumns);

    // Update the variable store directly
    // console.log("About to call renameColumnInTable...");
    const variableStore = useVariableStore.getState();
    // console.log("Variable store state:", {
    //   variables: Object.keys(variableStore.variables),
    //   currentTable: variableStore.variables[currentTableId],
    // });

    try {
      const promise = variableStore.renameColumnInTable(
        currentTableId,
        editingColumnName.oldName,
        editingColumnName.newName
      );

      //   console.log("renameColumnInTable promise created:", promise);

      promise
        .then(() => {
          console.log("Column renamed successfully in Firebase");
          // Reset the flag after successful Firebase update
          setTimeout(() => {
            // console.log("Resetting isUpdatingLocally to false");
            setIsUpdatingLocally(false);
          }, 1000); // Wait longer for Firebase to propagate
        })
        .catch((error) => {
          console.error("Error renaming column in Firebase:", error);
          // Reset the flag even on error
          setTimeout(() => {
            // console.log("Resetting isUpdatingLocally to false (error case)");
            setIsUpdatingLocally(false);
          }, 1000);
        });
    } catch (error) {
      console.error("Error calling renameColumnInTable:", error);
      // Reset the flag even on error
      setTimeout(() => {
        // console.log("Resetting isUpdatingLocally to false (catch case)");
        setIsUpdatingLocally(false);
      }, 1000);
    }

    // Also call parent callbacks for consistency
    onDataChange?.(updatedRows);
    onColumnsChange?.(newColumns);
    setIsColumnNameDialogOpen(false);
    setEditingColumnName(null);
  };

  // Handle column name edit dialog open
  const handleColumnNameEdit = (columnName: string) => {
    setEditingColumnName({
      oldName: columnName,
      newName: columnName,
    });
    setIsColumnNameDialogOpen(true);
  };

  // Handle copy column name to clipboard
  const handleCopyColumnName = (columnName: string) => {
    if (!currentTableId) {
      toast("No table selected");
      return;
    }

    // Get the table variable from the store to get its name
    const variables = useVariableStore.getState().variables;
    const tableVariable = variables[currentTableId];

    if (!tableVariable || tableVariable.type !== "table") {
      toast("Table not found");
      return;
    }

    const copyText = `{{${tableVariable.name}.${columnName}}}`;
    navigator.clipboard.writeText(copyText);
    toast(`${copyText} copied to clipboard`, {
      action: {
        label: "Close",
        onClick: () => toast.dismiss(),
      },
    });
  };

  // Get unique values for a column (including empty/null)
  const getUniqueValues = (columnName: string) => {
    const values = rows.map((row) => {
      const value = row[columnName];
      return value === null || value === undefined ? "" : String(value);
    });
    return [...new Set(values)];
  };

  // Apply filters to rows (OR logic)
  const getFilteredRows = () => {
    let filteredRows = rows;

    Object.entries(columnFilters).forEach(([columnName, selectedValues]) => {
      if (selectedValues.size > 0) {
        filteredRows = filteredRows.filter((row) => {
          const cellValue = row[columnName];
          const stringValue =
            cellValue === null || cellValue === undefined
              ? ""
              : String(cellValue);
          return selectedValues.has(stringValue);
        });
      }
    });

    return filteredRows;
  };

  // Handle filter change
  const handleFilterChange = (
    columnName: string,
    selectedValues: Set<string>
  ) => {
    setColumnFilters((prev) => ({
      ...prev,
      [columnName]: selectedValues,
    }));
  };

  // Handle filter dropdown toggle
  const handleFilterToggle = (columnName: string) => {
    if (filterDropdownOpen === columnName) {
      // Close dropdown
      setFilterDropdownOpen(null);
    } else {
      // Open dropdown and initialize with all values selected
      setFilterDropdownOpen(columnName);
      const uniqueValues = getUniqueValues(columnName);
      if (!columnFilters[columnName] || columnFilters[columnName].size === 0) {
        handleFilterChange(columnName, new Set(uniqueValues));
      }
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters({});
    setFilterDropdownOpen(null);
  };

  // Handle sort change
  const handleSortChange = (columnName: string, direction: "asc" | "desc") => {
    setSortColumn(columnName);
    setSortDirection(direction);
    setSortDropdownOpen(null);
  };

  // Clear sort
  const clearSort = () => {
    setSortColumn(null);
    setSortDirection("asc");
  };

  // Detect if a column has any "Error: " value (starts with "Error: ")
  const detectErrorsInColumn = (columnName: string): boolean => {
    return rows.some((row) => {
      const value = row[columnName];
      if (value === null || value === undefined) return false;
      return String(value).startsWith("Error: ");
    });
  };

  // Update error columns when rows or columns change
  useEffect(() => {
    const newErrorColumns = new Set<string>();
    localColumns.forEach((columnName) => {
      if (columnName !== "id" && detectErrorsInColumn(columnName)) {
        newErrorColumns.add(columnName);
      }
    });
    setErrorColumns(newErrorColumns);
    // If the column being error-sorted no longer has errors, clear error sort
    if (errorSortColumn && !newErrorColumns.has(errorSortColumn)) {
      setErrorSortColumn(null);
    }
  }, [rows, localColumns]);

  // Enhanced sorting: if errorSortColumn is set, sort errors to top for that column
  const getSortedAndFilteredRows = () => {
    let filteredRows = getFilteredRows();

    if (errorSortColumn && errorColumns.has(errorSortColumn)) {
      console.log("Error sorting by:", errorSortColumn); // Debug log
      filteredRows = [...filteredRows].sort((a, b) => {
        const aHasError =
          a[errorSortColumn] &&
          String(a[errorSortColumn]).startsWith("Error: ");
        const bHasError =
          b[errorSortColumn] &&
          String(b[errorSortColumn]).startsWith("Error: ");
        if (aHasError === bHasError) return 0;
        return aHasError ? -1 : 1;
      });
      console.log("First 5 rows after error sort:", filteredRows.slice(0, 5)); // Debug log
    } else if (sortColumn) {
      filteredRows = [...filteredRows].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        const aStr =
          aValue === null || aValue === undefined ? "" : String(aValue);
        const bStr =
          bValue === null || bValue === undefined ? "" : String(bValue);
        const comparison = aStr.localeCompare(bStr);
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filteredRows;
  };

  // Generate column definitions from local columns array
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
      renderHeaderCell: () => (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            padding: "0 4px",
            height: "100%",
          }}
        >
          <span
            style={{
              color: "#f3f4f6",
              fontSize: "14px",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <button
              onClick={() => handleCopyColumnName("id")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#d1d5db",
                padding: "2px",
                display: "flex",
                alignItems: "center",
                opacity: 0.7,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
              title="Copy column reference"
            >
              <Copy size={12} />
            </button>
            ID
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCellMenuClick(e, "id");
            }}
            style={{
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
            title="Column options"
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      ),
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
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
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
          </div>
        );
      },
    });

    // Add columns from local columns array
    columnNames.forEach((columnName, columnIndex) => {
      if (columnName !== "id") {
        const hasFilters = columnFilters[columnName]?.size > 0;
        const isSorted = sortColumn === columnName;
        const canMoveLeft = columnIndex > 0;
        const canMoveRight = columnIndex < localColumns.length - 1;

        columns.push({
          key: columnName,
          name: columnName,
          width: 200,
          resizable: true,
          sortable: true,
          editable: true,
          renderHeaderCell: () => (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                padding: "0 4px",
                height: "100%",
              }}
            >
              <span
                style={{
                  color: "#f3f4f6",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <button
                  onClick={() => handleCopyColumnName(columnName)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#d1d5db",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                    opacity: 0.7,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.7")}
                  title="Copy column reference"
                >
                  <Copy size={12} />
                </button>
                {columnName}
                {errorColumns.has(columnName) && (
                  <Badge
                    variant="destructive"
                    className="ml-2 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setErrorSortColumn((prev) => {
                        const newValue =
                          prev === columnName ? null : columnName;
                        console.log("Error sort column changed to:", newValue);
                        return newValue;
                      });
                    }}
                    title={
                      errorSortColumn === columnName
                        ? "Remove error sort"
                        : "Sort errors to top"
                    }
                    style={{
                      userSelect: "none",
                      pointerEvents: "auto",
                    }}
                  >
                    error
                  </Badge>
                )}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    style={{
                      padding: "2px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#666",
                      display: "flex",
                      alignItems: "center",
                      opacity: 0.7,
                    }}
                    title="Column options"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-gray-900 border-gray-700"
                >
                  <DropdownMenuLabel className="text-white">
                    {columnName} Options
                  </DropdownMenuLabel>
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      onClick={() => handleMoveColumn(columnName, "left")}
                      className="text-white hover:bg-gray-800"
                    >
                      <ChevronLeft size={14} className="mr-2" />
                      Move Left
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleMoveColumn(columnName, "right")}
                      className="text-white hover:bg-gray-800"
                    >
                      <ChevronRight size={14} className="mr-2" />
                      Move Right
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteColumn(columnName)}
                      className="text-red-400 hover:bg-red-900 hover:text-red-300"
                    >
                      <Trash size={14} className="mr-2" />
                      Delete Column
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-gray-700" />
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="text-white hover:bg-gray-800">
                      <Filter size={14} className="mr-2" />
                      Filter
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="bg-gray-900 border-gray-700 w-64">
                        {/* Scrollable filter items */}
                        <div className="max-h-48 overflow-y-auto">
                          {getUniqueValues(columnName).map((value) => {
                            const selectedValues =
                              columnFilters[columnName] || new Set();
                            const isSelected = selectedValues.has(value);
                            return (
                              <DropdownMenuItem
                                key={value}
                                onClick={() => {
                                  const newSet = new Set(selectedValues);
                                  if (isSelected) {
                                    newSet.delete(value);
                                  } else {
                                    newSet.add(value);
                                  }
                                  handleFilterChange(columnName, newSet);
                                }}
                                className="text-white hover:bg-gray-800"
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  readOnly
                                  className="mr-2"
                                />
                                {value === "" ? "(empty)" : value}
                              </DropdownMenuItem>
                            );
                          })}
                        </div>

                        {/* Fixed bottom section with divider */}
                        <DropdownMenuSeparator className="bg-gray-700" />
                        <div className="p-1">
                          <DropdownMenuItem
                            onClick={() =>
                              handleFilterChange(
                                columnName,
                                new Set(getUniqueValues(columnName))
                              )
                            }
                            className="text-white hover:bg-gray-800"
                          >
                            Select All
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleFilterChange(columnName, new Set())
                            }
                            className="text-white hover:bg-gray-800"
                          >
                            Clear All
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ),
          renderCell: ({ row, rowIdx }: any) => {
            const cellKey = `${rowIdx}:${columnName}`;
            const isSelected = selectedCells.has(cellKey);
            const cellValue = row[columnName] || "";
            const isErrorCell = String(cellValue).startsWith("Error: ");

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
                    color: isErrorCell
                      ? "#ef4444"
                      : isValidUrl(cellValue)
                        ? "#60a5fa"
                        : undefined,
                    textDecoration: isValidUrl(cellValue)
                      ? "underline"
                      : undefined,
                    cursor: isValidUrl(cellValue) ? "pointer" : undefined,
                    fontWeight: isErrorCell ? "600" : undefined,
                  }}
                >
                  {isValidUrl(cellValue) ? (
                    <a
                      href={cellValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#60a5fa", textDecoration: "underline" }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {cellValue}
                    </a>
                  ) : (
                    cellValue
                  )}
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "4px" }}
                >
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
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.opacity = "0.7")
                    }
                  >
                    <FaExpandAlt size={12} />
                  </button>
                </div>
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

    // Add "Add Column" button as a column header
    if (currentTableId && currentAgentId) {
      columns.push({
        key: "add-column",
        name: "Add Column",
        width: 120,
        resizable: false,
        sortable: false,
        editable: false,
        renderHeaderCell: () => (
          <div style={{ padding: "4px", fontSize: "12px", color: "#9ca3af" }}>
            Add Column
          </div>
        ),
        renderCell: () => (
          <div style={{ padding: "8px" }}>{/* Empty cell content */}</div>
        ),
      });
    }

    return columns;
  };

  // Add new state for cell menu
  const [cellMenuOpen, setCellMenuOpen] = useState<{
    columnName: string;
    x: number;
    y: number;
  } | null>(null);

  // Handle cell menu click
  const handleCellMenuClick = (event: React.MouseEvent, columnName: string) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setCellMenuOpen({
      columnName,
      x: rect.left,
      y: rect.bottom + 4,
    });
  };

  // Handle menu item click
  const handleMenuItemClick = (action: string, columnName: string) => {
    console.log("Menu item clicked:", action, columnName); // Debug log
    setCellMenuOpen(null);

    switch (action) {
      case "filter":
        console.log("Opening filter for:", columnName); // Debug log
        handleFilterToggle(columnName);
        break;
      case "sort-asc":
        console.log("Sorting ascending:", columnName); // Debug log
        handleSortChange(columnName, "asc");
        break;
      case "sort-desc":
        console.log("Sorting descending:", columnName); // Debug log
        handleSortChange(columnName, "desc");
        break;
      case "move-left":
        console.log("Moving left:", columnName); // Debug log
        handleMoveColumn(columnName, "left");
        break;
      case "move-right":
        console.log("Moving right:", columnName); // Debug log
        handleMoveColumn(columnName, "right");
        break;
      case "delete":
        console.log("Deleting column:", columnName); // Debug log
        handleDeleteColumn(columnName);
        break;
    }
  };

  // Handle click outside to close menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cellMenuOpen) {
        setCellMenuOpen(null);
      }
      if (filterDropdownOpen) {
        setFilterDropdownOpen(null);
      }
      if (sortDropdownOpen) {
        setSortDropdownOpen(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [cellMenuOpen, filterDropdownOpen, sortDropdownOpen]);

  // Create a custom header row for the filter/sort controls
  const createFilterRow = () => {
    const filterRow: { [key: string]: any } = {
      id: "filter-row",
      isFilterRow: true,
    };

    // Add empty values for all columns to ensure proper rendering
    localColumns.forEach((col) => {
      filterRow[col] = "";
    });

    return filterRow;
  };

  // Use local columns for generating the DataGrid columns
  const columns = generateColumns(localColumns);

  // Create rows with footer row
  const rowsWithFooter = [
    ...rows,
    {
      id: "footer-row",
      isFooter: true,
      // Add empty values for all columns to ensure proper rendering
      ...Object.fromEntries(localColumns.map((col) => [col, ""])),
    },
  ];

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
      onSelectionChange?.(newSelection, selectedData, colKey);
    } else {
      // Single cell select
      const cellKey = `${rowIdx}:${colKey}`;
      const newSelection = new Set<string>([cellKey]);
      setSelectedCells(newSelection);
      setLastSelectedCell({ rowIdx, colKey });
      // Optionally, call onSelectionChange with selected data
      const selectedData = [rows[rowIdx]];
      onSelectionChange?.(newSelection, selectedData, colKey);
    }
  }

  // Function to add a new column
  const addColumn = (columnName: string) => {
    const newColumns = [...localColumns, columnName];
    setLocalColumns(newColumns);
    onColumnsChange?.(newColumns);
  };

  // Function to delete a column
  const handleDeleteColumn = (columnName: string) => {
    // Remove the column from the data
    const newRows = rows.map((row) => {
      const newRow = { ...row };
      delete newRow[columnName];
      return newRow;
    });

    // Update the columns
    const newColumns = localColumns.filter((col) => col !== columnName);

    // Update the data
    setRows(newRows);
    setLocalColumns(newColumns);
    onDataChange?.(newRows);
    onColumnsChange?.(newColumns);

    // Show success toast
    toast(`Column "${columnName}" deleted successfully`);
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
    onSelectionChange?.(new Set(), [], undefined);
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
      const csvContent = convertToCSV(rows, localColumns || []);
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

  // Enhanced moveColumn with real-time updates
  const moveColumn = (columnKey: string, direction: -1 | 1) => {
    const colIndex = localColumns.indexOf(columnKey);
    if (colIndex === -1) return;
    const newIndex = colIndex + direction;
    if (newIndex < 0 || newIndex >= localColumns.length) return;
    const newColumns = [...localColumns];
    // Swap columns
    [newColumns[colIndex], newColumns[newIndex]] = [
      newColumns[newIndex],
      newColumns[colIndex],
    ];
    onColumnsChange?.(newColumns);
  };

  // Handle column reordering with local state
  const handleMoveColumn = (
    columnName: string,
    direction: "left" | "right"
  ) => {
    const currentIndex = localColumns.indexOf(columnName);
    if (currentIndex === -1) return;

    const newIndex = direction === "left" ? currentIndex - 1 : currentIndex + 1;

    // Check bounds
    if (newIndex < 0 || newIndex >= localColumns.length) return;

    // Create new columns array with reordered columns
    const newColumns = [...localColumns];
    [newColumns[currentIndex], newColumns[newIndex]] = [
      newColumns[newIndex],
      newColumns[currentIndex],
    ];

    // Update local state immediately for real-time feedback
    setLocalColumns(newColumns);

    // Update parent component
    onColumnsChange?.(newColumns);
  };

  function isValidUrl(text: string): boolean {
    try {
      // Only accept http/https links
      const url = new URL(text);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }

  // Add function to check if a row should be highlighted
  const checkIfRecentlyChanged = (row: any) => {
    if (!lastChange || !currentTableId) return false;

    // Check if this is the table that was recently changed
    if (lastChange.variableId !== currentTableId) return false;

    // Check if this specific row was changed
    if (lastChange.changedRowId && row.id === lastChange.changedRowId) {
      return true;
    }

    return false;
  };

  // Get sorted and filtered rows for display
  const displayRows = getSortedAndFilteredRows();
  const totalRows = rows.length;
  const filteredRows = displayRows.length;

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
              backgroundColor: "#141414",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <DataGrid
              columns={columns}
              rows={displayRows}
              onRowsChange={(updatedRows) => {
                // Map filtered rows back to original indices
                const originalIndices = updatedRows.map((_, index) => {
                  const filteredRow = displayRows[index];
                  return rows.findIndex((row) => row.id === filteredRow.id);
                });

                // Update original rows
                const newRows = [...rows];
                originalIndices.forEach((originalIndex, filteredIndex) => {
                  if (originalIndex !== -1) {
                    newRows[originalIndex] = updatedRows[filteredIndex];
                  }
                });

                onRowsChange(newRows);
              }}
              rowKeyGetter={(row) => row.id}
              className="rdg"
              style={{
                minWidth: "max-content",
                height: "100%",
                backgroundColor: "#141414",
                flex: 1,
                overflowY: "auto",
              }}
            />

            {/* Filter and sort status */}
            {(Object.keys(columnFilters).some(
              (col) => columnFilters[col]?.size > 0
            ) ||
              sortColumn) && (
              <div
                style={{
                  padding: "8px 12px",
                  backgroundColor: "#1f2937",
                  borderTop: "1px solid #374151",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "12px",
                  color: "#d1d5db",
                }}
              >
                <span>
                  Showing {filteredRows} of {totalRows} rows
                  {sortColumn && (
                    <span style={{ color: "#60a5fa", marginLeft: "8px" }}>
                      • Sorted by {sortColumn} (
                      {sortDirection === "asc" ? "ascending" : "descending"})
                    </span>
                  )}
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  {sortColumn && (
                    <button
                      onClick={clearSort}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#dc2626")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      Clear sort
                    </button>
                  )}
                  {Object.keys(columnFilters).some(
                    (col) => columnFilters[col]?.size > 0
                  ) && (
                    <button
                      onClick={clearAllFilters}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        color: "#ef4444",
                        fontSize: "12px",
                        padding: "4px 8px",
                        borderRadius: "4px",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = "#dc2626")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = "transparent")
                      }
                    >
                      Clear all filters
                    </button>
                  )}
                </div>
              </div>
            )}

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
            disabled={selectedCells.size === 0}
            onClick={() => {
              // Delete cells: set selected cells to empty string
              const updatedRows = [...rows];
              selectedCells.forEach((cellKey) => {
                const [rowIdx, colKey] = cellKey.split(":");
                const rowIndex = Number(rowIdx);
                if (updatedRows[rowIndex] && colKey !== "id") {
                  updatedRows[rowIndex][colKey] = "";
                }
              });
              setRows(updatedRows);
              onDataChange?.(updatedRows);
              onSelectionChange?.(new Set(), [], undefined);
            }}
          >
            Delete cells
          </ContextMenuItem>
          <ContextMenuItem
            disabled={getSelectedRowIndices().length === 0}
            onClick={handleDeleteRows}
          >
            Delete rows
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Cell Menu Dropdown */}
      {cellMenuOpen && (
        <div
          style={{
            position: "fixed",
            zIndex: 1000,
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            minWidth: "180px",
            left: cellMenuOpen.x,
            top: cellMenuOpen.y,
          }}
        >
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #374151",
              fontSize: "14px",
              fontWeight: "600",
              color: "#f3f4f6",
            }}
          >
            {cellMenuOpen.columnName} Options
          </div>

          <div>
            {/* Filter option */}
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                backgroundColor:
                  columnFilters[cellMenuOpen.columnName]?.size > 0
                    ? "#374151"
                    : "transparent",
              }}
              onClick={() =>
                handleMenuItemClick("filter", cellMenuOpen.columnName)
              }
              onMouseEnter={(e) => {
                if (columnFilters[cellMenuOpen.columnName]?.size === 0) {
                  e.currentTarget.style.backgroundColor = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (columnFilters[cellMenuOpen.columnName]?.size === 0) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <Filter size={14} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                Filter {cellMenuOpen.columnName}
                {columnFilters[cellMenuOpen.columnName]?.size > 0 && (
                  <span style={{ color: "#60a5fa", marginLeft: "4px" }}>
                    ({columnFilters[cellMenuOpen.columnName]?.size})
                  </span>
                )}
              </span>
            </div>

            {/* Sort ascending */}
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                backgroundColor:
                  sortColumn === cellMenuOpen.columnName &&
                  sortDirection === "asc"
                    ? "#374151"
                    : "transparent",
              }}
              onClick={() =>
                handleMenuItemClick("sort-asc", cellMenuOpen.columnName)
              }
              onMouseEnter={(e) => {
                if (
                  !(
                    sortColumn === cellMenuOpen.columnName &&
                    sortDirection === "asc"
                  )
                ) {
                  e.currentTarget.style.backgroundColor = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !(
                    sortColumn === cellMenuOpen.columnName &&
                    sortDirection === "asc"
                  )
                ) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <FaSortAmountUp size={14} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                Sort Ascending
              </span>
            </div>

            {/* Sort descending */}
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                backgroundColor:
                  sortColumn === cellMenuOpen.columnName &&
                  sortDirection === "desc"
                    ? "#374151"
                    : "transparent",
              }}
              onClick={() =>
                handleMenuItemClick("sort-desc", cellMenuOpen.columnName)
              }
              onMouseEnter={(e) => {
                if (
                  !(
                    sortColumn === cellMenuOpen.columnName &&
                    sortDirection === "desc"
                  )
                ) {
                  e.currentTarget.style.backgroundColor = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !(
                    sortColumn === cellMenuOpen.columnName &&
                    sortDirection === "desc"
                  )
                ) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <FaSortAmountDown size={14} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                Sort Descending
              </span>
            </div>

            {/* Move left */}
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
              onClick={() =>
                handleMenuItemClick("move-left", cellMenuOpen.columnName)
              }
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#374151")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <ChevronLeft size={14} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                Move Left
              </span>
            </div>

            {/* Move right */}
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
              }}
              onClick={() =>
                handleMenuItemClick("move-right", cellMenuOpen.columnName)
              }
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#374151")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <ChevronRight size={14} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                Move Right
              </span>
            </div>

            {/* Delete column */}
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                borderTop: "1px solid #374151",
              }}
              onClick={() =>
                handleMenuItemClick("delete", cellMenuOpen.columnName)
              }
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#dc2626")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Trash size={14} style={{ color: "#ef4444" }} />
              <span style={{ color: "#ef4444", fontSize: "14px" }}>
                Delete Column
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Sort Dropdown */}
      {sortDropdownOpen && (
        <div
          style={{
            position: "absolute",
            zIndex: 1000,
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            minWidth: "180px",
          }}
        >
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #374151",
              fontSize: "14px",
              fontWeight: "600",
              color: "#f3f4f6",
            }}
          >
            Sort {sortDropdownOpen}
          </div>

          <div>
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                backgroundColor:
                  sortColumn === sortDropdownOpen && sortDirection === "asc"
                    ? "#374151"
                    : "transparent",
              }}
              onClick={() => handleSortChange(sortDropdownOpen, "asc")}
              onMouseEnter={(e) => {
                if (
                  !(sortColumn === sortDropdownOpen && sortDirection === "asc")
                ) {
                  e.currentTarget.style.backgroundColor = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !(sortColumn === sortDropdownOpen && sortDirection === "asc")
                ) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <FaSortAmountUp size={14} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                Sort Ascending
              </span>
            </div>

            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                cursor: "pointer",
                backgroundColor:
                  sortColumn === sortDropdownOpen && sortDirection === "desc"
                    ? "#374151"
                    : "transparent",
              }}
              onClick={() => handleSortChange(sortDropdownOpen, "desc")}
              onMouseEnter={(e) => {
                if (
                  !(sortColumn === sortDropdownOpen && sortDirection === "desc")
                ) {
                  e.currentTarget.style.backgroundColor = "#374151";
                }
              }}
              onMouseLeave={(e) => {
                if (
                  !(sortColumn === sortDropdownOpen && sortDirection === "desc")
                ) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <FaSortAmountDown size={14} style={{ color: "#60a5fa" }} />
              <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                Sort Descending
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter Dropdown */}
      {filterDropdownOpen && (
        <div
          style={{
            position: "absolute",
            zIndex: 1000,
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "8px",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
            maxHeight: "300px",
            overflowY: "auto",
            minWidth: "200px",
          }}
        >
          <div
            style={{
              padding: "12px",
              borderBottom: "1px solid #374151",
              fontSize: "14px",
              fontWeight: "600",
              color: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span>
              Filter {filterDropdownOpen}
              {columnFilters[filterDropdownOpen]?.size > 0 && (
                <span style={{ color: "#60a5fa", marginLeft: "8px" }}>
                  ({columnFilters[filterDropdownOpen]?.size} selected)
                </span>
              )}
            </span>
            <button
              onClick={() => {
                const uniqueValues = getUniqueValues(filterDropdownOpen);
                const selectedValues =
                  columnFilters[filterDropdownOpen] || new Set();
                const allSelected = uniqueValues.every((value) =>
                  selectedValues.has(value)
                );

                if (allSelected) {
                  // Clear all selections
                  handleFilterChange(filterDropdownOpen, new Set());
                } else {
                  // Select all
                  handleFilterChange(filterDropdownOpen, new Set(uniqueValues));
                }
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#60a5fa",
                fontSize: "12px",
                padding: "4px 8px",
                borderRadius: "4px",
                textDecoration: "underline",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#374151")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              {(() => {
                const uniqueValues = getUniqueValues(filterDropdownOpen);
                const selectedValues =
                  columnFilters[filterDropdownOpen] || new Set();
                const allSelected = uniqueValues.every((value) =>
                  selectedValues.has(value)
                );
                return allSelected ? "Clear All" : "Select All";
              })()}
            </button>
          </div>

          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {getUniqueValues(filterDropdownOpen).map((value) => {
              const selectedValues =
                columnFilters[filterDropdownOpen] || new Set();
              const isSelected = selectedValues.has(value);

              return (
                <div
                  key={value}
                  style={{
                    padding: "8px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    backgroundColor: isSelected ? "#374151" : "transparent",
                  }}
                  onClick={() => {
                    const newSet = new Set(selectedValues);
                    if (isSelected) {
                      newSet.delete(value);
                    } else {
                      newSet.add(value);
                    }
                    handleFilterChange(filterDropdownOpen, newSet);
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "#374151";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #6b7280",
                      borderRadius: "3px",
                      backgroundColor: isSelected ? "#60a5fa" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          width: "8px",
                          height: "8px",
                          backgroundColor: "white",
                          borderRadius: "1px",
                        }}
                      />
                    )}
                  </div>
                  <span style={{ color: "#f3f4f6", fontSize: "14px" }}>
                    {value === "" ? "(empty)" : value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Column Name Edit Dialog */}
      <AlertDialog
        open={isColumnNameDialogOpen}
        onOpenChange={setIsColumnNameDialogOpen}
      >
        <AlertDialogContent className="max-w-md bg-black border-gray-600">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Edit Column Name
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              {editingColumnName && (
                <>
                  Renaming column "<strong>{editingColumnName.oldName}</strong>"
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="my-4">
            <Input
              value={editingColumnName?.newName || ""}
              onChange={(e) =>
                setEditingColumnName((prev) =>
                  prev ? { ...prev, newName: e.target.value } : null
                )
              }
              placeholder="Enter new column name..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setIsColumnNameDialogOpen(false);
                setEditingColumnName(null);
              }}
              className="bg-gray-700 text-white hover:bg-gray-600 border-gray-600"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleColumnNameUpdate}
              disabled={!editingColumnName?.newName?.trim()}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Update
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
