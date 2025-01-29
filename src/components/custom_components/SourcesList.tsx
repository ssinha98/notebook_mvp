import { useSourceStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function SourcesList() {
  const sources = useSourceStore((state) => state.sources);
  const removeSource = useSourceStore((state) => state.removeSource);

  return (
    <Card className="w-full max-h-[300px] flex flex-col">
      <CardHeader className="flex-none">
        <CardTitle>Available Sources</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto p-0">
        {Object.entries(sources).length === 0 ? (
          <p className="text-muted-foreground p-4">No sources added yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(sources).map(([name, source]) => (
                <ContextMenu key={name}>
                  <ContextMenuTrigger>
                    <TableRow className="cursor-pointer hover:bg-secondary/80">
                      <TableCell className="font-medium">{name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {source.type}
                      </TableCell>
                      <TableCell className="text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSource(name);
                            toast.success(`Removed source "${name}"`);
                          }}
                          className="opacity-0 group-hover:opacity-100 h-4 w-4 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem
                      className="text-destructive focus:text-destructive flex items-center gap-2"
                      onClick={() => {
                        removeSource(name);
                        toast.success(`Removed source "${name}"`);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Add default export
export default SourcesList;
