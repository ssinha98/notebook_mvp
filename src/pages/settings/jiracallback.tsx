import Layout from "@/components/Layout";
import { auth } from "@/tools/firebase";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/router";
import { doc, getDoc, setDoc, getFirestore } from "firebase/firestore";
import { api } from "@/tools/api";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";

interface JiraWorkspace {
  cloudId: string;
  name: string;
  scopes: string[];
  url: string;
}

interface WorkspacesResponse {
  status: string;
  workspaces: JiraWorkspace[];
}

export default function JiraCallback() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<JiraWorkspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(
    null
  );
  const [clientId, setClientId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkspacesAndUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const currentUser = auth.currentUser;
        if (!currentUser) {
          setError("No user logged in");
          return;
        }

        // Fetch user's current Jira selection from Firebase
        const db = getFirestore();
        const userDoc = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDoc);

        let currentJiraCloudId = null;
        let currentClientId = "";
        let currentClientSecret = "";
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          currentJiraCloudId = userData.jira_cloud_id;
          currentClientId = userData.jira_client_id || "";
          currentClientSecret = userData.jira_client_secret || "";
        }

        // Fetch workspaces from API
        const response = await api.get(
          `/jira/workspaces?user_id=${currentUser.uid}`
        );

        if (response.status === "success" && response.workspaces) {
          setWorkspaces(response.workspaces);
          setSelectedWorkspace(currentJiraCloudId);
          setClientId(currentClientId);
          setClientSecret(currentClientSecret);
        } else {
          setError("Failed to load workspaces from API");
        }
      } catch (error) {
        console.error("Error fetching workspaces:", error);
        setError("Failed to load Jira workspaces. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkspacesAndUserData();
  }, []);

  const handleWorkspaceSelect = async (workspace: JiraWorkspace) => {
    try {
      setIsSaving(true);
      setSelectedWorkspace(workspace.cloudId);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("No user logged in");
        return;
      }

      // Save to Firebase
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(
        userDoc,
        {
          jira_cloud_id: workspace.cloudId,
          jira_site_url: workspace.url,
        },
        { merge: true }
      );

      toast.success(`Selected workspace: ${workspace.name}`);
    } catch (error) {
      console.error("Error saving workspace:", error);
      toast.error("Failed to save workspace selection");
      setSelectedWorkspace(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClientCredentials = async () => {
    try {
      setIsSaving(true);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("No user logged in");
        return;
      }

      // Save client credentials to Firebase
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(
        userDoc,
        {
          jira_client_id: clientId,
          jira_client_secret: clientSecret,
        },
        { merge: true }
      );

      toast.success("Client credentials saved successfully");
    } catch (error) {
      console.error("Error saving client credentials:", error);
      toast.error("Failed to save client credentials");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDisconnectJira = async () => {
    try {
      setIsSaving(true);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error("No user logged in");
        return;
      }

      // Clear the jira_access_token field in Firebase
      const db = getFirestore();
      const userDoc = doc(db, "users", currentUser.uid);
      await setDoc(
        userDoc,
        {
          jira_access_token: null,
        },
        { merge: true }
      );

      // Also clear the selected workspace state
      setSelectedWorkspace(null);

      toast.success("Disconnected from Jira successfully");
    } catch (error) {
      console.error("Error disconnecting from Jira:", error);
      toast.error("Failed to disconnect from Jira");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackToSettings = () => {
    router.push("/settings");
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToSettings}
              className="text-gray-400 hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </div>

          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">Loading Jira workspaces...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToSettings}
              className="text-gray-400 hover:text-gray-100"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Settings
            </Button>
          </div>

          <Card className="bg-red-900/20 border-red-500">
            <CardContent className="p-6 text-center">
              <p className="text-red-400 font-medium mb-2">
                Error Loading Workspaces
              </p>
              <p className="text-red-300 text-sm">{error}</p>
              <Button
                onClick={() => window.location.reload()}
                className="mt-4"
                variant="outline"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToSettings}
            className="text-gray-400 hover:text-gray-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Settings
          </Button>

          <Button
            variant="destructive"
            onClick={handleDisconnectJira}
            disabled={isSaving}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSaving ? "Disconnecting..." : "Disconnect from Jira"}
          </Button>
        </div>

        <h1 className="text-2xl font-bold text-white">
          Configure Jira Integration
        </h1>

        <div className="max-w-2xl">
          {/* Client Credentials Section */}
          <Card className="bg-zinc-900 border-zinc-800 mb-6">
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                Client Credentials
              </h2>
              <p className="text-gray-400 text-sm mb-4">
                Enter your Jira app's Client ID and Client Secret to enable API
                access.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="client-id"
                    className="text-sm font-medium text-gray-300"
                  >
                    Client ID
                  </Label>
                  <Input
                    id="client-id"
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="Enter your Jira app Client ID"
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="client-secret"
                    className="text-sm font-medium text-gray-300"
                  >
                    Client Secret
                  </Label>
                  <Input
                    id="client-secret"
                    type="password"
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter your Jira app Client Secret"
                    className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <Button
                  onClick={handleSaveClientCredentials}
                  disabled={
                    isSaving || !clientId.trim() || !clientSecret.trim()
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Credentials"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Selection Section */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-2">
              Select Jira Workspace
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Choose the Jira workspace you want to connect to your account.
            </p>
          </div>

          <div className="space-y-4">
            {workspaces.map((workspace) => (
              <Card
                key={workspace.cloudId}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedWorkspace === workspace.cloudId
                    ? "bg-blue-900/20 border-blue-500 ring-2 ring-blue-500/20"
                    : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700"
                } ${isSaving ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => handleWorkspaceSelect(workspace)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">
                          {workspace.name}
                        </h3>
                        {selectedWorkspace === workspace.cloudId && (
                          <div className="flex items-center gap-1 text-blue-400">
                            <Check className="h-4 w-4" />
                            <span className="text-sm">Selected</span>
                          </div>
                        )}
                      </div>

                      <p className="text-gray-400 text-sm mb-2">
                        {workspace.url}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {workspace.scopes.map((scope, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-md"
                          >
                            {scope}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {workspaces.length === 0 && !isLoading && (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">No Jira workspaces found.</p>
                <p className="text-gray-500 text-sm mt-2">
                  Make sure you have access to at least one Jira workspace.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
