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
import { useAgentStore } from "@/lib/agentStore";

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
  
  // Add new API key state variables
  const [gongApiKey, setGongApiKey] = useState<string>("");
  const [hasCustomGongKey, setHasCustomGongKey] = useState<boolean>(false);
  const [savedGongKey, setSavedGongKey] = useState<string>("");
  
  const [salesforceApiKey, setSalesforceApiKey] = useState<string>("");
  const [hasCustomSalesforceKey, setHasCustomSalesforceKey] = useState<boolean>(false);
  const [savedSalesforceKey, setSavedSalesforceKey] = useState<string>("");
  
  const [jiraApiKey, setJiraApiKey] = useState<string>("");
  const [hasCustomJiraKey, setHasCustomJiraKey] = useState<boolean>(false);
  const [savedJiraKey, setSavedJiraKey] = useState<string>("");
  
  // Add team admin state
  const [isTeamAdmin, setIsTeamAdmin] = useState<boolean>(false);
  const [isLoadingTeamAdmin, setIsLoadingTeamAdmin] = useState<boolean>(true);
  
  const { isCurrentUserTeamAdmin } = useAgentStore();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Check team admin status
  useEffect(() => {
    const checkTeamAdminStatus = async () => {
      try {
        const teamAdminStatus = await isCurrentUserTeamAdmin();
        setIsTeamAdmin(teamAdminStatus);
      } catch (error) {
        console.error("Error checking team admin status:", error);
        setIsTeamAdmin(false);
      } finally {
        setIsLoadingTeamAdmin(false);
      }
    };
    checkTeamAdminStatus();
  }, [isCurrentUserTeamAdmin]);

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

  // Add new useEffect for Gong API key
  useEffect(() => {
    const fetchGongKeyFromFirebase = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);

      try {
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists() && docSnap.data().Gong_API_Key) {
          const firebaseKey = docSnap.data().Gong_API_Key;
          setHasCustomGongKey(true);
          setSavedGongKey(firebaseKey);
        }
      } catch (error) {
        console.error("Error fetching Gong API key from Firebase:", error);
      }
    };

    fetchGongKeyFromFirebase();
  }, []);

  // Add new useEffect for Salesforce API key
  useEffect(() => {
    const fetchSalesforceKeyFromFirebase = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);

      try {
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists() && docSnap.data().Salesforce_API_Key) {
          const firebaseKey = docSnap.data().Salesforce_API_Key;
          setHasCustomSalesforceKey(true);
          setSavedSalesforceKey(firebaseKey);
        }
      } catch (error) {
        console.error("Error fetching Salesforce API key from Firebase:", error);
      }
    };

    fetchSalesforceKeyFromFirebase();
  }, []);

  // Add new useEffect for Jira API key
  useEffect(() => {
    const fetchJiraKeyFromFirebase = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);

      try {
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists() && docSnap.data().Jira_API_Key) {
          const firebaseKey = docSnap.data().Jira_API_Key;
          setHasCustomJiraKey(true);
          setSavedJiraKey(firebaseKey);
        }
      } catch (error) {
        console.error("Error fetching Jira API key from Firebase:", error);
      }
    };

    fetchJiraKeyFromFirebase();
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

  // Add Gong API key handlers
  const handleSubmitGongKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to save your Gong API key");
      return;
    }

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Gong_API_Key: gongApiKey }, { merge: true });

      setHasCustomGongKey(true);
      setSavedGongKey(gongApiKey);
      setGongApiKey("");
      alert("Gong API key saved successfully!");
    } catch (error) {
      console.error("Error saving Gong API key:", error);
      alert("Failed to save Gong API key");
    }
  };

  const handleRemoveGongKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Gong_API_Key: null }, { merge: true });

      setHasCustomGongKey(false);
      setSavedGongKey("");
      alert("Gong API key removed successfully!");
    } catch (error) {
      console.error("Error removing Gong API key:", error);
      alert("Failed to remove Gong API key");
    }
  };

  // Add Salesforce API key handlers
  const handleSubmitSalesforceKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to save your Salesforce API key");
      return;
    }

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Salesforce_API_Key: salesforceApiKey }, { merge: true });

      setHasCustomSalesforceKey(true);
      setSavedSalesforceKey(salesforceApiKey);
      setSalesforceApiKey("");
      alert("Salesforce API key saved successfully!");
    } catch (error) {
      console.error("Error saving Salesforce API key:", error);
      alert("Failed to save Salesforce API key");
    }
  };

  const handleRemoveSalesforceKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Salesforce_API_Key: null }, { merge: true });

      setHasCustomSalesforceKey(false);
      setSavedSalesforceKey("");
      alert("Salesforce API key removed successfully!");
    } catch (error) {
      console.error("Error removing Salesforce API key:", error);
      alert("Failed to remove Salesforce API key");
    }
  };

  // Add Jira API key handlers
  const handleSubmitJiraKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("Please log in to save your Jira API key");
      return;
    }

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Jira_API_Key: jiraApiKey }, { merge: true });

      setHasCustomJiraKey(true);
      setSavedJiraKey(jiraApiKey);
      setJiraApiKey("");
      alert("Jira API key saved successfully!");
    } catch (error) {
      console.error("Error saving Jira API key:", error);
      alert("Failed to save Jira API key");
    }
  };

  const handleRemoveJiraKey = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    try {
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(userDoc, { Jira_API_Key: null }, { merge: true });

      setHasCustomJiraKey(false);
      setSavedJiraKey("");
      alert("Jira API key removed successfully!");
    } catch (error) {
      console.error("Error removing Jira API key:", error);
      alert("Failed to remove Jira API key");
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

  const renderApiKeySection = (title: string, keyName: string, hasKey: boolean, savedKey: string, inputValue: string, setInputValue: (value: string) => void, onSubmit: () => void, onRemove: () => void, helpUrl: string, helpText: string) => (
    <div className="border-t border-zinc-800 pt-4 mt-4">
      <div className="text-white mb-2">{title}</div>
      {hasKey ? (
        <div className="flex items-center justify-between bg-zinc-800 p-3 rounded">
          <span className="text-white">
            Custom API Key: {savedKey.slice(0, 8)}...
          </span>
          <Button variant="destructive" onClick={onRemove}>
            Remove Key
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <Input
            type="password"
            placeholder={`Enter your ${keyName} API key`}
            className="w-full bg-zinc-800 border-zinc-700 text-white"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Button onClick={onSubmit}>Save API Key</Button>
          <a
            href={helpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-zinc-700 rounded-lg p-3 text-gray-400 hover:text-gray-300 text-sm transition-colors"
          >
            {helpText} →
          </a>
        </div>
      )}
    </div>
  );

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
          <CardContent>
            {isLoadingTeamAdmin ? (
              <div className="text-gray-400">Loading...</div>
            ) : isTeamAdmin ? (
              <div className="max-h-96 overflow-y-auto space-y-4 pr-2">
                {renderApiKeySection(
                  "OpenAI API Key",
                  "OpenAI",
                  hasCustomKey,
                  savedKey,
                  apiKey,
                  setApiKey,
                  handleSubmitApiKey,
                  handleRemoveKey,
                  "https://platform.openai.com/api-keys",
                  "How to grab an OpenAI key"
                )}

                {renderApiKeySection(
                  "FireCrawl API Key",
                  "FireCrawl",
                  hasCustomFirecrawlKey,
                  savedFirecrawlKey,
                  firecrawlApiKey,
                  setFirecrawlApiKey,
                  handleSubmitFirecrawlKey,
                  handleRemoveFirecrawlKey,
                  "https://www.firecrawl.dev/signin/signup",
                  "How to grab a FireCrawl key"
                )}

                {renderApiKeySection(
                  "Apollo API Key",
                  "Apollo",
                  hasCustomApolloKey,
                  savedApolloKey,
                  apolloApiKey,
                  setApolloApiKey,
                  handleSubmitApolloKey,
                  handleRemoveApolloKey,
                  "https://developer.apollo.io/keys/",
                  "How to grab an Apollo key"
                )}

                {renderApiKeySection(
                  "Gong API Key",
                  "Gong",
                  hasCustomGongKey,
                  savedGongKey,
                  gongApiKey,
                  setGongApiKey,
                  handleSubmitGongKey,
                  handleRemoveGongKey,
                  "https://developers.gong.io/",
                  "How to grab a Gong key"
                )}

                {renderApiKeySection(
                  "Salesforce API Key",
                  "Salesforce",
                  hasCustomSalesforceKey,
                  savedSalesforceKey,
                  salesforceApiKey,
                  setSalesforceApiKey,
                  handleSubmitSalesforceKey,
                  handleRemoveSalesforceKey,
                  "https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/",
                  "How to grab a Salesforce key"
                )}

                {renderApiKeySection(
                  "Jira API Key",
                  "Jira",
                  hasCustomJiraKey,
                  savedJiraKey,
                  jiraApiKey,
                  setJiraApiKey,
                  handleSubmitJiraKey,
                  handleRemoveJiraKey,
                  "https://developer.atlassian.com/cloud/jira/platform/basic-auth-for-rest-apis/",
                  "How to grab a Jira key"
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                Admin hasn't given you access to API keys
              </div>
            )}
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
