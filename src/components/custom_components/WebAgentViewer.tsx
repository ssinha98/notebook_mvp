import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface WebAgentViewerProps {
  url: string;
  nickname?: string;
}

type WorkStage =
  | "loading"
  | "reading"
  | "extracting"
  | "processing"
  | "complete";

export default function WebAgentViewer({ url, nickname }: WebAgentViewerProps) {
  const [workStage, setWorkStage] = useState<WorkStage>("loading");

  // Simulate work stages
  useEffect(() => {
    const stages: WorkStage[] = [
      "loading",
      "reading",
      "extracting",
      "processing",
      "complete",
    ];
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % stages.length;
      setWorkStage(stages[currentIndex]);
    }, 3000); // Change stage every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const getStageMessage = (stage: WorkStage) => {
    switch (stage) {
      case "loading":
        return "Loading website...";
      case "reading":
        return "Reading content...";
      case "extracting":
        return "Extracting relevant information...";
      case "processing":
        return "Processing data...";
      case "complete":
        return "Analysis complete";
    }
  };

  return (
    <div className="relative w-full h-screen">
      {/* iframe */}
      <iframe
        src={url}
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-same-origin"
        referrerPolicy="no-referrer"
      />

      {/* Overlay container */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Status badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={workStage}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 bg-black/75 backdrop-blur-sm px-4 py-2 rounded-full"
          >
            <div className="flex items-center gap-2">
              <div className="animate-pulse h-2 w-2 bg-blue-500 rounded-full" />
              <p className="text-sm text-white font-medium">
                {getStageMessage(workStage)}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Scanning line animation */}
        <motion.div
          animate={{
            top: ["0%", "100%", "0%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"
        />

        {/* Highlight overlay */}
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500/20 rounded-lg"
        />

        {/* Processing particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{
                x: Math.random() * 100 + "%",
                y: "-20%",
                scale: 0,
              }}
              animate={{
                y: "120%",
                scale: [0, 1, 0],
                x: `${Math.random() * 100}%`,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeOut",
              }}
              className="absolute w-2 h-2 bg-blue-500/50 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
