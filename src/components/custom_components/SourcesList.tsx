import { useSourceStore } from "@/lib/store";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export function SourcesList() {
  const sources = useSourceStore((state) => state.sources);
  const removeSource = useSourceStore((state) => state.removeSource);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Available Sources</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(sources).length === 0 ? (
          <p className="text-muted-foreground">No sources added yet</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(sources).map(([name, source]) => (
              <div
                key={name}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary cursor-pointer hover:bg-secondary/80"
                onClick={() => {
                  // console.log("source tapped");
                  const preview = source.processedData?.substring(0, 100);
                  console.log(
                    `Source preview for ${name}:`,
                    preview ? `${preview}...` : "No processed data available"
                  );
                }}
              >
                <div>
                  <span className="font-medium">{name}</span>
                  <span className="ml-2 text-sm text-muted-foreground">
                    ({source.type})
                  </span>
                </div>
                <button
                  onClick={() => {
                    removeSource(name);
                    toast.success(`Removed source "${name}"`);
                  }}
                  className="text-destructive hover:text-destructive/80"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Add default export
export default SourcesList;
