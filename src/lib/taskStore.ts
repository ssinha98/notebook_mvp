import { create } from "zustand";
import {
  collection,
  doc,
  setDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db, auth } from "@/tools/firebase";
import { AgentTask } from "@/types/types";
import { useAgentStore } from "./agentStore";

interface TaskStore {
  tasks: AgentTask[];
  loadTasks: () => Promise<void>;
  createTask: (task: Omit<AgentTask, "id">) => Promise<AgentTask>;
  updateTask: (id: string, updates: Partial<AgentTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  createReviewTask: (agentId: string) => Promise<void>; // Add this new method
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],

  loadTasks: async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const tasksRef = collection(db, `users/${userId}/tasks`);
      const snapshot = await getDocs(tasksRef);

      const tasks: AgentTask[] = [];
      snapshot.docs.forEach((doc) => {
        tasks.push({
          id: doc.id,
          ...doc.data(),
        } as AgentTask);
      });

      set({ tasks });
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  },

  createTask: async (task) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      const taskRef = doc(collection(db, `users/${userId}/tasks`));
      const newTask: AgentTask = {
        id: taskRef.id,
        ...task,
      };

      await setDoc(taskRef, newTask);
      set((state) => ({ tasks: [...state.tasks, newTask] }));

      return newTask;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  updateTask: async (id, updates) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      await updateDoc(doc(db, `users/${userId}/tasks`, id), updates);

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === id ? { ...task, ...updates } : task
        ),
      }));
    } catch (error) {
      console.error("Error updating task:", error);
      throw error;
    }
  },

  deleteTask: async (id) => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error("No user logged in");

      await deleteDoc(doc(db, `users/${userId}/tasks`, id));
      set((state) => ({
        tasks: state.tasks.filter((task) => task.id !== id),
      }));
    } catch (error) {
      console.error("Error deleting task:", error);
      throw error;
    }
  },

  //  Add the new helper function
  createReviewTask: async (agentId: string) => {
    try {
      // Get the current agent to get its name
      const { currentAgent, agents } = useAgentStore.getState();
      const agent = currentAgent;

      // Get agent name, fallback to "Agent #{id}" if not available
      let agentName = agent?.name;
      if (!agentName) {
        // Try to get agent name from the agents list
        const foundAgent = agents.find((a) => a.id === agentId);
        agentName = foundAgent?.name || `Agent #${agentId}`;
      }

      // Check if there's already an uncompleted review task for this agent
      const { tasks } = get();
      const existingTask = tasks.find(
        (task) =>
          task.agentId === agentId &&
          task.title.includes("Review") &&
          !task.completed
      );

      if (existingTask) {
        console.log(`Review task already exists for agent: ${agentName}`);
        return;
      }

      // Create the review task
      await get().createTask({
        title: `Review ${agentName} output`,
        agentId: agentId,
        date: new Date().toLocaleDateString(),
        completed: false,
      });

      console.log(`Review task created for agent: ${agentName}`);
    } catch (error) {
      console.error("Error creating review task:", error);
    }
  },
}));
