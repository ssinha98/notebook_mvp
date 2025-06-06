import { useEffect } from "react";
import { useRouter } from "next/router";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTaskStore } from "@/lib/taskStore";

interface AgentTasksProps {
  agentNames: Record<string, string>;
}

// const demoTask = {
//   id: "demo-task-2",
//   title: "Respond to incoming lead",
//   agentId: "email-lead-qualifier",
//   date: new Date().toLocaleDateString(),
//   completed: false, // checkbox is unchecked
// };

export default function AgentTasks({ agentNames }: AgentTasksProps) {
  const router = useRouter();
  const { tasks, loadTasks, updateTask } = useTaskStore();

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleTaskClick = (agentId: string) => {
    router.push(`/?agentId=${agentId}`);
  };

  const handleTaskToggle = async (taskId: string, completed: boolean) => {
    await updateTask(taskId, { completed });
  };

  const allTasks = tasks;

  if (allTasks.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Your Tasks</h2>
        <div
          className="border rounded-lg overflow-hidden relative"
          style={{ backgroundColor: "#131722" }}
        >
          <div className="py-8 text-center text-gray-400">
            <div>No agent tasks yet</div>
            <a
              href="https://lytix-nocode-agents.beehiiv.com/p/notebook-changelog-feb-28"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline mt-2 inline-block"
            >
              What are agent tasks? →
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-4">Your Tasks</h2>
      <div
        className="border rounded-lg overflow-hidden"
        style={{ backgroundColor: "#131722" }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Agent</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {allTasks.map((task) => (
              <TableRow
                key={task.id}
                className="cursor-pointer hover:bg-gray-800"
                onClick={() => handleTaskClick(task.agentId)}
              >
                <TableCell
                  className="flex items-center justify-center h-full"
                  style={{ verticalAlign: "middle" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) =>
                      handleTaskToggle(task.id, checked as boolean)
                    }
                    className="border-white data-[state=checked]:bg-white data-[state=checked]:text-black"
                  />
                </TableCell>
                <TableCell
                  className={`font-medium ${task.completed ? "line-through text-gray-400" : ""}`}
                >
                  {task.title}
                </TableCell>
                <TableCell className="align-top">
                  <div>
                    {/* <div className="font-medium">
                      {agentNames[task.agentId] || "email-lead-qualifier"}
                    </div> */}
                    <div className="text-sm text-gray-400">{task.agentId}</div>
                  </div>
                </TableCell>
                <TableCell>{task.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
