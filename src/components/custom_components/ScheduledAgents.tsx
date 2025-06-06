import { useEffect } from "react";
import { useRouter } from "next/router";
import { Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAgentStore } from "@/lib/agentStore";

export default function ScheduledAgents() {
  const router = useRouter();
  const { agents } = useAgentStore();

  const scheduledAgents = agents.filter(
    (agent) => agent.start_method === "schedule"
  );

  const handleAgentClick = (agentId: string) => {
    router.push(`/?agentId=${agentId}`);
  };

  if (scheduledAgents.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          Upcoming agent runs
        </h2>
        <div
          className="border rounded-lg overflow-hidden relative"
          style={{ backgroundColor: "#131722" }}
        >
          <div className="py-8 text-center text-gray-400">
            <div>No scheduled agent runs yet!</div>
            <a
              href="https://usesolari.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
            >
              What are scheduled agent runs? →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Upcoming agent runs</h2>
      <div
        className="border rounded-lg overflow-hidden"
        style={{ backgroundColor: "#131722" }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Agent name</TableHead>
              <TableHead>Next run</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scheduledAgents.map((agent) => (
              <TableRow
                key={agent.id}
                className="cursor-pointer hover:bg-gray-800"
                onClick={() => handleAgentClick(agent.id)}
              >
                <TableCell className="flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </TableCell>
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>
                  {/* {agent.start_date} @ {agent.start_time} */}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
