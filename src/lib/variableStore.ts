import { create } from "zustand";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/tools/firebase";
import { TableRow } from "@/types/types";

interface Variable {
  id: string;
  name: string;
  type: "input" | "intermediate" | "table";
  value: string | TableRow[];
  updatedAt: string;
  agentId?: string;
  columns?: string[];
}

interface VariableStore {
  variables: Record<string, Variable>;
  loadVariables: (agentId?: string) => Promise<void>;
  createVariable: (
    name: string,
    type: "input" | "intermediate" | "table",
    agentId: string,
    initialValue?: string | TableRow[]
  ) => Promise<Variable>;
  updateVariable: (id: string, value: string | TableRow[]) => Promise<void>;
  deleteVariable: (id: string) => Promise<void>;
  getVariableByName: (name: string) => Variable | undefined;
  getTableColumn: (tableId: string, columnName: string) => any[];
  updateTableColumn: (
    tableId: string,
    columnName: string,
    value: any
  ) => Promise<void>;
  addTableRow: (
    tableId: string,
    rowData: Omit<TableRow, "id">
  ) => Promise<string>;
  updateTableRow: (
    tableId: string,
    rowId: string,
    rowData: Partial<TableRow>
  ) => Promise<void>;
  deleteTableRow: (tableId: string, rowId: string) => Promise<void>;
  addColumnToTable: (tableId: string, columnName: string) => Promise<void>;
  removeColumnFromTable: (tableId: string, columnName: string) => Promise<void>;
  renameColumnInTable: (
    tableId: string,
    oldColumnName: string,
    newColumnName: string
  ) => Promise<void>;
  updateTableVariable: (tableId: string, updatedRows: any[]) => Promise<void>;
}

export const useVariableStore = create<VariableStore>((set, get) => ({
  variables: {},

  loadVariables: async (agentId?: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const variablesRef = collection(db, `users/${userId}/variables`);

      // Only apply the filter if we have an agentId
      const q = agentId
        ? query(variablesRef, where("agentId", "==", agentId))
        : query(variablesRef);

      const snapshot = await getDocs(q);

      const variablesRecord: Record<string, Variable> = {};
      snapshot.docs.forEach((doc) => {
        variablesRecord[doc.id] = {
          id: doc.id,
          ...doc.data(),
        } as Variable;
      });

      set({ variables: variablesRecord });
    } catch (error) {
      console.error("Error loading variables:", error);
    }
  },

  createVariable: async (
    name: string,
    type: "input" | "intermediate" | "table",
    agentId: string,
    initialValue = type === "table" ? [] : ""
  ) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");
      if (!agentId) throw new Error("Agent ID is required");

      const variableRef = doc(collection(db, `users/${userId}/variables`));
      const newVariable: Variable = {
        id: variableRef.id,
        name,
        type,
        value: initialValue,
        updatedAt: new Date().toISOString(),
        agentId,
      };

      await setDoc(variableRef, newVariable);

      set((state) => ({
        variables: { ...state.variables, [newVariable.id]: newVariable },
      }));

      return newVariable;
    } catch (error) {
      console.error("Error creating variable:", error);
      throw error;
    }
  },

  updateVariable: async (id, value) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      await updateDoc(doc(db, `users/${userId}/variables`, id), {
        value,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        variables: {
          ...state.variables,
          [id]: {
            ...state.variables[id],
            value,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    } catch (error) {
      console.error("Error updating variable:", error);
      throw error;
    }
  },

  deleteVariable: async (id) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      await deleteDoc(doc(db, `users/${userId}/variables`, id));
      set((state) => {
        const { [id]: _, ...rest } = state.variables;
        return { variables: rest };
      });
    } catch (error) {
      console.error("Error deleting variable:", error);
      throw error;
    }
  },

  getVariableByName: (name) => {
    const { variables } = get();
    return Object.values(variables).find((v) => v.name === name);
  },

  getTableColumn: (tableId: string, columnName: string) => {
    const variable = get().variables[tableId];
    if (!variable || variable.type !== "table") {
      throw new Error("Invalid table variable");
    }
    const rows = Array.isArray(variable.value) ? variable.value : [];
    return rows.map((row) => row[columnName]);
  },

  updateTableColumn: async (
    tableId: string,
    columnName: string,
    value: any
  ) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const variable = get().variables[tableId];
      if (!variable || variable.type !== "table") {
        throw new Error("Invalid table variable");
      }

      const currentRows = Array.isArray(variable.value) ? variable.value : [];
      let updatedRows = [...currentRows];

      // Convert value to string and clean it up
      const stringValue = String(value).trim();

      // If value is a string and contains commas, treat it as a list
      if (stringValue.includes(",")) {
        // Split by comma, clean up each item, and remove empty/duplicate entries
        const items = [
          ...new Set(
            stringValue
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean) // Remove empty strings
          ),
        ];

        // Create a new row for each item
        const newRows = items.map((item) => ({
          id: crypto.randomUUID(),
          [columnName]: item,
        }));

        updatedRows = [...currentRows, ...newRows];
      } else if (stringValue) {
        // Only add non-empty values
        // Single value case
        const newRow = {
          id: crypto.randomUUID(),
          [columnName]: stringValue,
        };
        updatedRows = [...currentRows, newRow];
      }

      // Update Firebase
      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        value: updatedRows,
        updatedAt: new Date().toISOString(),
        columns: Array.from(new Set([...(variable.columns || []), columnName])),
      });

      // Update local state
      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...state.variables[tableId],
            value: updatedRows,
            updatedAt: new Date().toISOString(),
            columns: Array.from(
              new Set([...(variable.columns || []), columnName])
            ),
          },
        },
      }));
    } catch (error) {
      console.error("Error updating table column:", error);
      throw error;
    }
  },

  addTableRow: async (tableId: string, rowData: Omit<TableRow, "id">) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const variable = get().variables[tableId];
      if (!variable || variable.type !== "table") {
        console.warn("Invalid table variable:", tableId, "Variable:", variable);
        return ""; // Return early instead of throwing
      }

      const newRow = {
        id: crypto.randomUUID(),
        ...rowData,
      };

      const currentRows = Array.isArray(variable.value) ? variable.value : [];
      const updatedRows = [...currentRows, newRow];

      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        value: updatedRows,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...state.variables[tableId],
            value: updatedRows,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      return newRow.id;
    } catch (error) {
      console.error("Error adding table row:", error);
      throw error;
    }
  },

  updateTableRow: async (
    tableId: string,
    rowId: string,
    rowData: Partial<TableRow>
  ) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const variable = get().variables[tableId];
      if (!variable || variable.type !== "table") {
        throw new Error("Invalid table variable");
      }

      const currentRows = Array.isArray(variable.value) ? variable.value : [];
      const updatedRows = currentRows.map((row) =>
        row.id === rowId ? { ...row, ...rowData } : row
      );

      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        value: updatedRows,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...state.variables[tableId],
            value: updatedRows,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    } catch (error) {
      console.error("Error updating table row:", error);
      throw error;
    }
  },

  deleteTableRow: async (tableId: string, rowId: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const variable = get().variables[tableId];
      if (!variable || variable.type !== "table") {
        throw new Error("Invalid table variable");
      }

      const currentRows = Array.isArray(variable.value) ? variable.value : [];
      const updatedRows = currentRows.filter((row) => row.id !== rowId);

      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        value: updatedRows,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...state.variables[tableId],
            value: updatedRows,
            updatedAt: new Date().toISOString(),
          },
        },
      }));
    } catch (error) {
      console.error("Error deleting table row:", error);
      throw error;
    }
  },

  addColumnToTable: async (tableId: string, columnName: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) throw new Error("No user logged in");

    const table = get().variables[tableId];
    if (!table || table.type !== "table") return;

    const columns = table.columns || [];
    if (!columns.includes(columnName)) {
      const updatedColumns = [...columns, columnName];
      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        columns: updatedColumns,
      });

      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...table,
            columns: updatedColumns,
          },
        },
      }));
    }
  },

  removeColumnFromTable: async (tableId: string, columnName: string) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const table = get().variables[tableId];
      if (!table || table.type !== "table") return;

      const columns = table.columns || [];
      const updatedColumns = columns.filter((col) => col !== columnName);

      // Remove the column from all rows while preserving TableRow structure
      const currentRows = Array.isArray(table.value) ? table.value : [];
      const updatedRows = currentRows.map((row) => {
        const newRow = { ...row };
        delete newRow[columnName];
        return newRow;
      });

      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        columns: updatedColumns,
        value: updatedRows,
      });

      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...table,
            columns: updatedColumns,
            value: updatedRows,
          },
        },
      }));
    } catch (error) {
      console.error("Error removing column:", error);
      throw error;
    }
  },

  renameColumnInTable: async (
    tableId: string,
    oldColumnName: string,
    newColumnName: string
  ) => {
    console.log("=== renameColumnInTable called ===", {
      tableId,
      oldColumnName,
      newColumnName,
    });

    try {
      console.log("Starting renameColumnInTable:", {
        tableId,
        oldColumnName,
        newColumnName,
      });

      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("No user logged in");
        throw new Error("No user logged in");
      }

      const table = get().variables[tableId];
      if (!table || table.type !== "table") {
        console.error("Invalid table variable:", { tableId, table });
        return;
      }

      console.log("Current table state:", {
        columns: table.columns,
        rowCount: Array.isArray(table.value) ? table.value.length : 0,
      });

      const columns = table.columns || [];
      const updatedColumns = columns.map((col) =>
        col === oldColumnName ? newColumnName : col
      );

      // Update the data rows to use the new column name
      const currentRows = Array.isArray(table.value) ? table.value : [];
      const updatedRows = currentRows.map((row) => {
        const newRow = { ...row };
        if (newRow[oldColumnName] !== undefined) {
          newRow[newColumnName] = newRow[oldColumnName];
          delete newRow[oldColumnName];
        }
        return newRow;
      });

      console.log("Updating Firebase with:", {
        columns: updatedColumns,
        rowCount: updatedRows.length,
      });

      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        columns: updatedColumns,
        value: updatedRows,
        updatedAt: new Date().toISOString(),
      });

      console.log("Firebase update completed successfully");

      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...table,
            columns: updatedColumns,
            value: updatedRows,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      console.log("Local state updated successfully");
    } catch (error) {
      console.error("Error renaming column:", error);
      throw error;
    }
  },

  updateTableVariable: async (tableId: string, updatedRows: any[]) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const variable = get().variables[tableId];
      if (!variable || variable.type !== "table") {
        throw new Error("Invalid table variable");
      }

      await updateDoc(doc(db, `users/${userId}/variables`, tableId), {
        value: updatedRows,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        variables: {
          ...state.variables,
          [tableId]: {
            ...state.variables[tableId],
            value: updatedRows,
            updatedAt: new Date().toISOString(),
          },
        },
      }));

      // Refresh the variables
      // await get().loadVariables(get().variables[tableId].agentId);
    } catch (error) {
      console.error("Error updating table variable:", error);
      throw error;
    }
  },
}));
