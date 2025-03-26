import AgentsList from "@/components/custom_components/AgentList";
import { useRouter } from "next/router";
import { useAgentStore } from "@/lib/agentStore";
import { Button } from "@/components/ui/button";
import { ArrowLeftOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { SessionHandler } from "@/components/custom_components/SessionHandler";
import Layout from "@/components/Layout";

export default function AgentsPage() {
  const router = useRouter();
  const { loadAgent } = useAgentStore();

  const handleAgentSelect = async (agentId: string) => {
    // Navigate to notebook with agent ID
    router.push(`/?agentId=${agentId}`);
  };

  return (
    <Layout>
      <SessionHandler />
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <ArrowLeftOutlined />
              Back to Notebook
            </Button> */}
            <h1 className="text-2xl font-bold text-white">Agents</h1>
          </div>
        </div>

        <div
          className="w-full p-4 mb-6 bg-blue-600/80 hover:bg-blue-700/90 rounded-lg cursor-pointer transition-colors flex justify-between items-center"
          onClick={() => router.push("/agentStore")}
        >
          💡 Need inspiration? Check out our Agent Store for a set of pre-built agents.
          <ArrowRightOutlined />
        </div>

        <AgentsList onAgentSelect={handleAgentSelect} />

        {/* Debug section */}
        {/* <div className="mt-8 p-4 bg-gray-900 rounded-lg">
          <h2 className="text-xl font-bold mb-4 text-white">Debug View</h2>
          <div className="space-y-6">
            {agents.map((agent) => (
              <div
                key={agent.id}
                className="border border-gray-700 p-4 rounded-lg"
              >
                <h3 className="text-lg font-semibold text-blue-400 mb-2">
                  Agent: {agent.name}{" "}
                  {agent.id === currentAgent?.id && "(Current)"}
                </h3>
                <p className="text-gray-400">ID: {agent.id}</p>
                <p className="text-gray-400">Created: {agent.createdAt}</p>

                <div className="mt-4">
                  <h4 className="text-md font-semibold text-green-400 mb-2">
                    Blocks:
                  </h4>
                  {agent.blocks.map((block, index) => (
                    <div
                      key={index}
                      className="ml-4 mb-4 p-3 bg-gray-800 rounded"
                    >
                      <p className="text-yellow-400">
                        Block #{block.blockNumber}
                      </p>
                      <p className="text-gray-300">Type: {block.type}</p>
                      <div className="mt-2 space-y-2">
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-blue-300">System Prompt:</p>
                          <pre className="text-gray-300 whitespace-pre-wrap">
                            {block.systemPrompt || "undefined"}
                          </pre>
                        </div>
                        <div className="bg-gray-700 p-2 rounded">
                          <p className="text-blue-300">User Prompt:</p>
                          <pre className="text-gray-300 whitespace-pre-wrap">
                            {block.userPrompt || "undefined"}
                          </pre>
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-gray-400">Raw block data:</p>
                        <pre className="text-xs text-gray-500 bg-gray-900 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(block, null, 2)}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </Layout>
  );
}
