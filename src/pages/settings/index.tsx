import Layout from "@/components/Layout";
import { auth } from "@/tools/firebase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/router";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { api } from "@/tools/api";
import { Input } from "@/components/ui/input";

export default function Settings() {
  const [user, setUser] = useState(auth.currentUser);
  const router = useRouter();
  const [apiKey, setApiKey] = useState<string>("");
  const [hasCustomKey, setHasCustomKey] = useState<boolean>(false);
  const [savedKey, setSavedKey] = useState<string>("");
  const [firecrawlApiKey, setFirecrawlApiKey] = useState<string>("");
  const [hasCustomFirecrawlKey, setHasCustomFirecrawlKey] =
    useState<boolean>(false);
  const [savedFirecrawlKey, setSavedFirecrawlKey] = useState<string>("");
  // Add Apollo API key state variables
  const [apolloApiKey, setApolloApiKey] = useState<string>("");
  const [hasCustomApolloKey, setHasCustomApolloKey] = useState<boolean>(false);
  const [savedApolloKey, setSavedApolloKey] = useState<string>("");

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch API key on component mount
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

  // Add new useEffect for FireCrawl API key
  useEffect(() => {
    const fetchFirecrawlKeyFromFirebase = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);

      try {
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists() && docSnap.data().FireCrawl_API_Key) {
          const firebaseKey = docSnap.data().FireCrawl_API_Key;
          setHasCustomFirecrawlKey(true);
          setSavedFirecrawlKey(firebaseKey);
        }
      } catch (error) {
        console.error("Error fetching FireCrawl API key from Firebase:", error);
      }
    };

    fetchFirecrawlKeyFromFirebase();
  }, []);

  // Add new useEffect for Apollo API key
  useEffect(() => {
    const fetchApolloKeyFromFirebase = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);

      try {
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists() && docSnap.data().Apollo_API_Key) {
          const firebaseKey = docSnap.data().Apollo_API_Key;
          setHasCustomApolloKey(true);
          setSavedApolloKey(firebaseKey);
        }
      } catch (error) {
        console.error("Error fetching Apollo API key from Firebase:", error);
      }
    };

    fetchApolloKeyFromFirebase();
  }, []);

  const handleSubmitApiKey = async () => {
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
        alert("API key removed successfully!");
      }
    } catch (error) {
      console.error("Error removing API key:", error);
      alert("Failed to remove API key");
    }
  };

  const handleSubmitFirecrawlKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to save your FireCrawl API key");
      return;
    }

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(
        userDoc,
        { FireCrawl_API_Key: firecrawlApiKey },
        { merge: true }
      );

      setHasCustomFirecrawlKey(true);
      setSavedFirecrawlKey(firecrawlApiKey);
      setFirecrawlApiKey("");
      alert("FireCrawl API key saved successfully!");
    } catch (error) {
      console.error("Error saving FireCrawl API key:", error);
      alert("Failed to save FireCrawl API key");
    }
  };

  const handleRemoveFirecrawlKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { FireCrawl_API_Key: null }, { merge: true });

      setHasCustomFirecrawlKey(false);
      setSavedFirecrawlKey("");
      alert("FireCrawl API key removed successfully!");
    } catch (error) {
      console.error("Error removing FireCrawl API key:", error);
      alert("Failed to remove FireCrawl API key");
    }
  };

  // Add Apollo API key handlers
  const handleSubmitApolloKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to save your Apollo API key");
      return;
    }

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Apollo_API_Key: apolloApiKey }, { merge: true });

      setHasCustomApolloKey(true);
      setSavedApolloKey(apolloApiKey);
      setApolloApiKey("");
      alert("Apollo API key saved successfully!");
    } catch (error) {
      console.error("Error saving Apollo API key:", error);
      alert("Failed to save Apollo API key");
    }
  };

  const handleRemoveApolloKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Apollo_API_Key: null }, { merge: true });

      setHasCustomApolloKey(false);
      setSavedApolloKey("");
      alert("Apollo API key removed successfully!");
    } catch (error) {
      console.error("Error removing Apollo API key:", error);
      alert("Failed to remove Apollo API key");
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-white">Settings</h1>

        <Card className="mb-6 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Profile</h2>
          </CardHeader>
          <CardContent className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.photoURL || ""} />
              <AvatarFallback>
                {user?.displayName?.[0]?.toUpperCase() || "👤"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-lg text-white">
                {user?.displayName || "User"}
              </p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">API Keys</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-white mb-2">OpenAI API Key</div>
            {hasCustomKey ? (
              <div className="flex items-center justify-between bg-zinc-800 p-3 rounded">
                <span className="text-white">
                  Custom API Key: {savedKey.slice(0, 8)}...
                </span>
                <Button variant="destructive" onClick={handleRemoveKey}>
                  Remove Key
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter your OpenAI API key"
                  className="w-full bg-zinc-800 border-zinc-700 text-white"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <Button onClick={handleSubmitApiKey}>Save API Key</Button>
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border border-zinc-700 rounded-lg p-3 text-gray-400 hover:text-gray-300 text-sm transition-colors"
                >
                  How to grab an OpenAI key →
                </a>
              </div>
            )}

            <div className="border-t border-zinc-800 pt-4 mt-4">
              <div className="text-white mb-2">FireCrawl API Key</div>
              {hasCustomFirecrawlKey ? (
                <div className="flex items-center justify-between bg-zinc-800 p-3 rounded">
                  <span className="text-white">
                    Custom API Key: {savedFirecrawlKey.slice(0, 8)}...
                  </span>
                  <Button
                    variant="destructive"
                    onClick={handleRemoveFirecrawlKey}
                  >
                    Remove Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter your FireCrawl API key"
                    className="w-full bg-zinc-800 border-zinc-700 text-white"
                    value={firecrawlApiKey}
                    onChange={(e) => setFirecrawlApiKey(e.target.value)}
                  />
                  <Button onClick={handleSubmitFirecrawlKey}>
                    Save API Key
                  </Button>
                  <a
                    href="https://www.firecrawl.dev/signin/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-zinc-700 rounded-lg p-3 text-gray-400 hover:text-gray-300 text-sm transition-colors"
                  >
                    How to grab a FireCrawl key →
                  </a>
                </div>
              )}
            </div>

            <div className="border-t border-zinc-800 pt-4 mt-4">
              <div className="text-white mb-2">Apollo API Key</div>
              {hasCustomApolloKey ? (
                <div className="flex items-center justify-between bg-zinc-800 p-3 rounded">
                  <span className="text-white">
                    Custom API Key: {savedApolloKey.slice(0, 8)}...
                  </span>
                  <Button variant="destructive" onClick={handleRemoveApolloKey}>
                    Remove Key
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    type="password"
                    placeholder="Enter your Apollo API key"
                    className="w-full bg-zinc-800 border-zinc-700 text-white"
                    value={apolloApiKey}
                    onChange={(e) => setApolloApiKey(e.target.value)}
                  />
                  <Button onClick={handleSubmitApolloKey}>Save API Key</Button>
                  <a
                    href="https://developer.apollo.io/keys/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block border border-zinc-700 rounded-lg p-3 text-gray-400 hover:text-gray-300 text-sm transition-colors"
                  >
                    How to grab an Apollo key →
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <h2 className="text-xl font-semibold text-white">Account</h2>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
