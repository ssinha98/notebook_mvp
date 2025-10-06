import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  // SheetTrigger,
} from "@/components/ui/sheet";
// import {
//   Table,
//   TableHeader,
//   TableRow,
//   TableHead,
//   TableBody,
// } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { KeyRound, X } from "lucide-react";
import { api } from "@/tools/api";
import { auth } from "@/tools/firebase";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";

interface ApiKeySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ApiKeySheet: React.FC<ApiKeySheetProps> = ({ open, onOpenChange }) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);
  const [savedKey, setSavedKey] = useState<string>("");

  useEffect(() => {
    const fetchApiKeyFromFirebase = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);

      try {
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists() && docSnap.data().OAI_API_Key) {
          const firebaseKey = docSnap.data().OAI_API_Key;
          setHasCustomKey(true);
          setSavedKey(firebaseKey);

          // Also update the backend with the Firebase key
          await api.post("/api/set-api-key", {
            api_key: firebaseKey,
          });
        }
      } catch (error) {
        console.error("Error fetching API key from Firebase:", error);
      }
    };

    fetchApiKeyFromFirebase();
  }, []);

  const handleSubmit = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to save your API key");
      return;
    }

    try {
      // First save to backend
      const response = await api.post("/api/set-api-key", {
        api_key: apiKey,
      });

      if (response.success) {
        // Then save to Firebase
        const db = getFirestore();
        const userDoc = doc(db, "users", currentUser.uid);
        await setDoc(userDoc, { OAI_API_Key: apiKey }, { merge: true });

        setHasCustomKey(true);
        setSavedKey(apiKey);
        setApiKey("");
        alert("API key saved successfully!");
      }
    } catch (error) {
      console.error("Error saving API key:", error);
      alert("Failed to save API key");
    }
  };

  const handleRemoveKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      // Remove from backend
      const response = await api.post("/api/remove-api-key", {});

      if (response.success) {
        // Remove from Firebase
        const db = getFirestore();
        const userDoc = doc(db, "users", currentUser.uid);
        await setDoc(userDoc, { OAI_API_Key: null }, { merge: true });

        setHasCustomKey(false);
        setSavedKey("");
        await handleReset();
        alert("API key removed successfully!");
      }
    } catch (error) {
      console.error("Error removing API key:", error);
      alert("Failed to remove API key");
    }
  };

  const handleReset = async () => {
    try {
      const response = await api.post("/api/reset-count", {});
      if (response.success) {
        alert("API call count reset successfully!");
      }
    } catch (error) {
      console.error("Error resetting count:", error);
      alert("Failed to reset count");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[50vh] bg-[#1e1e1e]">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Your API Keys
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4">
          {hasCustomKey ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <span className="text-white">
                  Custom API Key: {savedKey.slice(0, 8)}...
                </span>
                <Button variant="destructive" onClick={handleRemoveKey}>
                  Remove Key
                </Button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="password"
                placeholder="Enter your OpenAI API key"
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <Button onClick={handleSubmit}>Save API Key</Button>
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-gray-600 rounded-lg p-3 text-gray-400 hover:text-gray-300 text-sm transition-colors"
              >
                How to grab an OpenAI key →
              </a>
            </>
          )}
        </div>

        <div className="absolute bottom-6 left-6 flex flex-col gap-2 w-full pr-12">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ApiKeySheet;
