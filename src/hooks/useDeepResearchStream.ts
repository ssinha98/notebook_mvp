import { useEffect, useState, useCallback } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/tools/firebase";
import { api } from "@/tools/api";
import { toast } from "sonner";

interface DeepResearchDoc {
  status: "called" | "complete" | "error";
  thread_id?: string;
  value?: string;
  result_urls?: string[];
  created_at?: string;
  updated_at?: string;
  error?: string;
}

interface UseDeepResearchStreamResult {
  status: DeepResearchDoc["status"] | null;
  threadId?: string;
  value?: string;
  resultUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  error?: string;
  loading: boolean;
  finalize: () => Promise<void>;
}

/**
 * Streams the Firestore doc for deep research and exposes a finalize function.
 * Does NOT auto-finalize; the component must call finalize when ready.
 */
export function useDeepResearchStream(
  userId: string | undefined,
  blockId: string | undefined
): UseDeepResearchStreamResult {
  const [docData, setDocData] = useState<DeepResearchDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);
  const [hasShownCompleteToast, setHasShownCompleteToast] = useState(false);

  useEffect(() => {
    if (!userId || !blockId) {
      setDocData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const docRef = doc(db, "users", userId, "deep_research_calls", blockId);
    const unsub = onSnapshot(
      docRef,
      (docSnap) => {
        const data = docSnap.exists()
          ? (docSnap.data() as DeepResearchDoc)
          : null;
        setDocData(data);
        setLoading(false);

        // Show toast when status becomes complete and we haven't shown it yet
        if (
          data?.status === "complete" &&
          !data.value &&
          !hasShownCompleteToast
        ) {
          toast.success(
            "🔎 Research complete! Your deep research agent results are ready to view."
          );
          setHasShownCompleteToast(true);
        }
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId, blockId, hasShownCompleteToast]);

  // Finalize function: calls /api/finalize_deep_result
  const finalize = useCallback(async () => {
    if (!userId || !blockId) return;
    setLoading(true);
    setError(undefined);
    try {
      await api.post("/api/finalize_deep_result", {
        user_id: userId,
        block_id: blockId,
      });
      // No need to update state here; Firestore stream will update automatically
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [userId, blockId]);

  return {
    status: docData?.status ?? null,
    threadId: docData?.thread_id,
    value: docData?.value,
    resultUrls: docData?.result_urls,
    createdAt: docData?.created_at,
    updatedAt: docData?.updated_at,
    error: docData?.error || error,
    loading,
    finalize,
  };
}
