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

interface Variable {
  id: string;
  name: string;
  type: "input" | "intermediate";
  value: string;
  updatedAt: string;
  agentId?: string;
}

interface VariableStore {
  variables: Record<string, Variable>;
  loadVariables: (agentId?: string) => Promise<void>;
  createVariable: (
    name: string,
    type: "input" | "intermediate",
    agentId: string,
    initialValue?: string
  ) => Promise<Variable>;
  updateVariable: (id: string, value: string) => Promise<void>;
  deleteVariable: (id: string) => Promise<void>;
  getVariableByName: (name: string) => Variable | undefined;
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
    type: "input" | "intermediate",
    agentId: string,
    initialValue = ""
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

      console.log("Saving variable to path:", variableRef.path);
      await setDoc(variableRef, newVariable);

      const savedDoc = await getDoc(variableRef);
      console.log("Save verification:", savedDoc.exists(), savedDoc.data());

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
}));
