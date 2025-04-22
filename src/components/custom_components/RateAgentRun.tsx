import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

interface RateAgentRunProps {
  onRate: (isPositive: boolean) => void;
}

export default function RateAgentRun({ onRate }: RateAgentRunProps) {
  const [rating, setRating] = useState<"positive" | "negative" | null>(null);

  const handleRate = (isPositive: boolean) => {
    setRating(isPositive ? "positive" : "negative");
    onRate(isPositive);
    toast.success(`${isPositive ? "Positive" : "Negative"} rating received!`);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="text-xl text-gray-700">Rate agent output</div>
      <div className="flex gap-8">
        <ThumbsUp
          className={`w-8 h-8 cursor-pointer transition-colors ${
            rating === "positive"
              ? "text-green-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
          onClick={() => handleRate(true)}
        />
        <ThumbsDown
          className={`w-8 h-8 cursor-pointer transition-colors ${
            rating === "negative"
              ? "text-red-500"
              : "text-gray-400 hover:text-gray-600"
          }`}
          onClick={() => handleRate(false)}
        />
      </div>
    </div>
  );
}
