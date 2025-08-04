import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
// import {
//   Menu,
//   Settings,
//   KeyOutlined,
//   ToolOutlined,
//   CodeOutlined,
//   VideoCameraOutlined,
// } from "lucide-react";
import { LuMenu, LuSettings } from "react-icons/lu";

import {
  ExperimentOutlined,
  KeyOutlined,
  ToolOutlined,
  CodeOutlined,
  VideoCameraOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { auth } from "@/tools/firebase";
import { useEffect, useState } from "react";

export function NavigationDrawer({
  onApiKeyClick,
  onToolsClick,
  onCodeClick,
  onVideoGuideClick,
}: {
  onApiKeyClick?: () => void;
  onToolsClick?: () => void;
  onCodeClick?: () => void;
  onVideoGuideClick?: () => void;
}) {
  const router = useRouter();
  const [user, setUser] = useState(auth.currentUser);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Escape to close
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  const navigation = [
    {
      name: "Agent Editor",
      href: "/notebook",
      current: router.pathname === "/notebook",
    },
    {
      name: "Agents",
      href: "/agents",
      current: router.pathname === "/agents",
    },
    {
      name: "Files",
      href: "/files",
      current: router.pathname === "/files",
    },
  ];

  //   const renderPageActions = () => {
  //     switch (router.pathname) {
  //       case "/notebook":
  //         return (
  //           <div className="space-y-2 mb-6">
  //             <h3 className="font-semibold text-sm text-muted-foreground mb-2">
  //               Actions
  //             </h3>
  //             <Button
  //               variant="ghost"
  //               className="w-full justify-start"
  //               onClick={onVideoGuideClick}
  //             >
  //               <VideoCameraOutlined className="mr-2 h-4 w-4" />
  //               Guide
  //             </Button>
  //             <Button
  //               variant="ghost"
  //               className="w-full justify-start"
  //               onClick={onApiKeyClick}
  //             >
  //               <KeyOutlined className="mr-2 h-4 w-4" />
  //               API Keys
  //             </Button>
  //             <Button
  //               variant="ghost"
  //               className="w-full justify-start"
  //               onClick={onToolsClick}
  //             >
  //               <ToolOutlined className="mr-2 h-4 w-4" />
  //               Tools
  //             </Button>
  //             <Button
  //               variant="ghost"
  //               className="w-full justify-start"
  //               onClick={onCodeClick}
  //             >
  //               <CodeOutlined className="mr-2 h-4 w-4" />
  //               Code
  //             </Button>
  //           </div>
  //         );
  //       case "/agents":
  //         return (
  //           <div className="space-y-2 mb-6">
  //             <h3 className="font-semibold text-sm text-muted-foreground mb-2">
  //               Agent Actions
  //             </h3>
  //             <Button
  //               variant="ghost"
  //               className="w-full justify-start"
  //               onClick={() => {
  //                 /* Add agent-specific actions */
  //               }}
  //             >
  //               Create New Agent
  //             </Button>
  //           </div>
  //         );
  //       case "/files":
  //         return (
  //           <div className="space-y-2 mb-6">
  //             <h3 className="font-semibold text-sm text-muted-foreground mb-2">
  //               File Actions
  //             </h3>
  //             <Button
  //               variant="ghost"
  //               className="w-full justify-start"
  //               onClick={() => {
  //                 /* Add file-specific actions */
  //               }}
  //             >
  //               Upload File
  //             </Button>
  //           </div>
  //         );
  //       default:
  //         return null;
  //     }
  //   };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="fixed left-4 top-2 z-50">
          <LuMenu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[400px] flex flex-col bg-black border-r border-border/40"
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="text-white">Solari</SheetTitle>
          <SheetDescription className="text-gray-300"></SheetDescription>
        </SheetHeader>

        <div className="flex-grow">
          {/* {renderPageActions()} */}
          {/* <div className="h-px bg-border my-4" /> */}
          <nav className="space-y-2 py-4">
            {navigation.map((item) => (
              <Button
                key={item.name}
                variant={item.current ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => router.push(item.href)}
              >
                {item.name}
              </Button>
            ))}
          </nav>
        </div>

        <div className="mt-auto">
          <Button
            variant="default"
            className="w-full justify-start bg-blue-600/80 hover:bg-blue-700/90 mb-4"
            onClick={() => router.push("/agentStore")}
          >
            Agent Store
          </Button>

          <Card className="border-none shadow-none">
            <CardHeader className="flex-row items-center space-x-4 space-y-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.photoURL || ""} />
                <AvatarFallback>
                  {user?.displayName?.[0]?.toUpperCase() || "👤"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-grow min-w-0">
                <h3 className="font-bold truncate">
                  {user?.displayName || "User"}
                </h3>
                <p className="text-sm text-muted-foreground truncate">
                  {user?.email || ""}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/settings")}
              >
                <LuSettings className="h-5 w-5" />
              </Button>
            </CardHeader>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
