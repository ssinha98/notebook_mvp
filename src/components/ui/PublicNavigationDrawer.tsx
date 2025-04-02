import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LuMenu } from "react-icons/lu";
import { ExperimentOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function PublicNavigationDrawer() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const navigation = [
    {
      name: "Agent Store",
      href: "/agentStore",
    },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn("relative h-9 w-9 px-0", open && "bg-muted")}
        >
          <ExperimentOutlined className="h-4 w-4" />
          <span className="sr-only">Toggle Navigation</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pr-0">
        <div className="px-7">
          <div className="space-y-6">
            <div className="flex items-center">
              <ExperimentOutlined className="mr-2 h-6 w-6" />
              <span className="font-bold">Caio</span>
            </div>
            <div className="space-y-1">
              {navigation.map((item) => (
                <Button
                  key={item.href}
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    router.push(item.href);
                    setOpen(false);
                  }}
                >
                  {item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
