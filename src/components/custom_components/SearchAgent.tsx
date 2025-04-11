import React, {
  forwardRef,
  useState,
  useImperativeHandle,
  useEffect,
} from "react";
import { SearchAgentBlock, Variable } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Settings2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSourceStore } from "@/lib/store";
import { VscJson } from "react-icons/vsc";
import { MdRawOn } from "react-icons/md";
import { api } from "@/tools/api";
import { GoogleSearchParams } from "@/tools/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useVariableStore } from "@/lib/variableStore";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import VariableDropdown from "./VariableDropdown";
import { useAgentStore } from "@/lib/agentStore";

interface SearchAgentProps {
  blockNumber: number;
  variables: Array<Variable>;
  onDeleteBlock: (blockNumber: number) => void;
  onUpdateBlock: (
    blockNumber: number,
    updates: Partial<SearchAgentBlock>
  ) => void;
  onAddVariable: (variable: Variable) => void;
  onOpenTools?: () => void;
  financeWindow?: "1D" | "5D" | "1M" | "6M" | "YTD" | "1Y" | "5Y" | "MAX";
  marketsIndexMarket?:
    | "americas"
    | "europe-middle-east-africa"
    | "asia-pacific";
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
  initialQuery?: string;
  initialEngine?: "search" | "news" | "finance" | "markets";
  initialLimit?: number;
  initialTopic?: string;
  initialSection?: string;
  initialTimeWindow?: string;
  initialTrend?: string;
  initialRegion?: string;
}

export interface SearchAgentRef {
  processBlock: () => Promise<boolean>;
}

interface ParsedResultsProps {
  engine: "search" | "news" | "finance" | "markets";
  results: any;
  limit: number;
}

interface FinanceItem {
  name: string;
  stock: string;
  price: string;
  price_movement: {
    movement: "Up" | "Down";
    percentage: number;
  };
  link: string;
}

interface SearchItem {
  title: string;
  snippet: string;
  displayed_link: string;
  position: number;
  link: string;
}

interface MarketItem {
  name: string;
  stock: string;
  price: string;
  price_movement: {
    movement: "Up" | "Down";
    percentage: number;
    value: number;
  };
  link: string;
}

const SearchCard: React.FC<SearchItem> = ({
  title,
  snippet,
  displayed_link,
  position,
  link,
}) => (
  <a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors relative"
  >
    <div className="absolute top-2 left-2 bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center text-sm text-gray-300">
      {position}
    </div>
    <div className="pl-8">
      <div className="text-lg font-semibold text-blue-400 hover:underline">
        {title}
      </div>
      <div className="text-sm text-gray-400 mb-2">{displayed_link}</div>
      <div className="text-sm text-gray-300 line-clamp-2">{snippet}</div>
    </div>
  </a>
);

const FinanceCard: React.FC<FinanceItem> = ({
  name,
  stock,
  price,
  price_movement,
  link,
}) => (
  <a
    href={link}
    target="_blank"
    rel="noopener noreferrer"
    className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
  >
    <div className="text-lg font-semibold text-gray-200">{name}</div>
    <div className="text-sm text-gray-400">{stock}</div>
    <div className="my-2 border-t border-gray-700" />
    <div className="flex items-center justify-between">
      <div className="text-gray-300">Price: {price}</div>
      <div
        className={`flex items-center ${price_movement.movement === "Up" ? "text-green-500" : "text-red-500"}`}
      >
        {price_movement.movement === "Up" ? "↑" : "↓"}
        <span className="ml-1">{price_movement.percentage.toFixed(2)}%</span>
      </div>
    </div>
  </a>
);

const MarketsCard: React.FC<MarketItem> = ({
  name = "",
  stock = "",
  price = "",
  price_movement,
  link = "#",
}) => {
  // Early check for price_movement validity
  const isValidPriceMovement =
    price_movement &&
    typeof price_movement === "object" &&
    "movement" in price_movement &&
    "percentage" in price_movement &&
    "value" in price_movement;

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors border border-gray-700"
    >
      <div className="text-lg font-semibold text-gray-200 line-clamp-2">
        {name}
      </div>
      <div className="text-sm text-gray-400">{stock}</div>
      <div className="my-2 border-t border-gray-700" />
      <div className="flex items-center justify-between">
        <div className="text-gray-300">{price}</div>
        {isValidPriceMovement && (
          <div className="flex flex-col items-end">
            <div
              className={`flex items-center ${
                price_movement.movement === "Up"
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              {price_movement.movement === "Up" ? "↑" : "↓"}
              <span className="ml-1">
                {price_movement.percentage.toFixed(2)}%
              </span>
            </div>
            <div className="text-sm text-gray-400">
              {price_movement.movement === "Up" ? "+" : "-"}$
              {Math.abs(price_movement.value).toFixed(2)}
            </div>
          </div>
        )}
      </div>
    </a>
  );
};

const ParsedResults = ({ engine, results, limit }: ParsedResultsProps) => {
  const getLimitedResults = (items: any[]) => items.slice(0, limit);
  switch (engine) {
    case "search":
      const searchData =
        typeof results === "string" ? JSON.parse(results) : results;
      const searchResults = getLimitedResults(searchData.results || []);
      return (
        <div className="space-y-4">
          {searchResults.map((item: SearchItem) => (
            <SearchCard key={item.position} {...item} />
          ))}
        </div>
      );
    case "news":
      const newsData =
        typeof results === "string" ? JSON.parse(results) : results;
      return (
        <div className="space-y-4">
          {newsData.results?.map((result: any) => (
            <NewsCard key={result.position} result={result} />
          ))}
        </div>
      );
    case "finance":
      const items = results.results?.discover_more?.[0]?.items || [];
      const financeItems = items.slice(0, limit);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {financeItems.map((item: FinanceItem, index: number) => (
            <FinanceCard key={index} {...item} />
          ))}
        </div>
      );
    case "markets":
      const marketItems = results.results?.[0]?.results || [];
      const marketItemsLimited = marketItems.slice(0, limit);
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {marketItemsLimited.map((item: MarketItem, index: number) => (
            <MarketsCard
              key={index}
              name={item.name}
              stock={item.stock}
              price={item.price}
              price_movement={item.price_movement}
              link={item.link}
            />
          ))}
        </div>
      );
    default:
      return <div>Unknown engine type</div>;
  }
};

const NEWS_TOPICS = {
  technology: {
    label: "Technology",
    value: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGRqTVhZU0FtVnVHZ0pWVXlnQVAB",
    sections: {
      mobile: {
        label: "Mobile",
        value:
          "CAQiYkNCQVNRd29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURVd2F6Z3FId29kQ2hsTlQwSkpURVZmVUVoUFRrVmZVMFZEVkVsUFRsOU9RVTFGSUFFb0FBKioIAComCAoiIENCQVNFZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeWdBUAFQAQ",
      },
      gadgets: {
        label: "Gadgets",
        value:
          "CAQiW0NCQVNQZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURKdFpqRnVLaGtLRndvVFIwRkVSMFZVWDFORlExUkpUMDVmVGtGTlJTQUJLQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURsek1XWVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      internet: {
        label: "Internet",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TUROeWJIUXFDaElJTDIwdk1ETnliSFFvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURkak1YWVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      "virtual-reality": {
        label: "Virtual Reality",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURkZmJua3FDaElJTDIwdk1EZGZibmtvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURkak1YWVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      "artificial-intelligence": {
        label: "Artificial Intelligence",
        value:
          "CAQiQ0NCQVNMQW9JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlOQ0FRYUNRb0hMMjB2TUcxcmVpb0pFZ2N2YlM4d2JXdDZLQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURkak1YWVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      computing: {
        label: "Computing",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURGc2NITXFDaElJTDIwdk1ERnNjSE1vQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURkak1YWVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
    },
  },
  business: {
    label: "Business",
    value: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?",
    sections: {
      economy: {
        label: "Economy",
        value:
          "CAQiSENCQVNNQW9JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TUdkbWNITXpLZ3NTQ1M5dEx6Qm5abkJ6TXlnQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVABUAE",
      },
      markets: {
        label: "Markets",
        value:
          "CAQiXENCQVNQd29JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURsNU5IQnRLaG9LR0FvVVRVRlNTMFZVVTE5VFJVTlVTVTlPWDA1QlRVVWdBU2dBKioIAComCAoiIENCQVNFZ29JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeWdBUAFQAQ",
      },
      jobs: {
        label: "Jobs",
        value:
          "CAQiXkNCQVNRQW9JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeUlUQ0FRYUR3b05MMmN2TVRGblltWmljSHBvZENvWENoVUtFVXBQUWxOZlUwVkRWRWxQVGw5T1FVMUZJQUVvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURsek1XWVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      "personal-finance": {
        label: "Personal Finance",
        value:
          "CAQiSENCQVNNQW9JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURGNU5tTnhLZ3NTQ1M5dEx6QXhlVFpqY1NnQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVABUAE",
      },
      entrepreneurship: {
        label: "Entrepreneurship",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURKdWQzRXFDaElJTDIwdk1ESnVkM0VvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURsek1XWVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
    },
  },
  entertainment: {
    label: "Entertainment",
    value: "CAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVAB",
    sections: {
      movies: {
        label: "Movies",
        value:
          "CAQiWkNCQVNQUW9JTDIwdk1ESnFhblFTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURKMmVHNHFHUW9YQ2hOTlQxWkpSVk5mVTBWRFZFbFBUbDlPUVUxRklBRW9BQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVABUAE",
      },
      music: {
        label: "Music",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1ESnFhblFTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURSeWJHWXFDaElJTDIwdk1EUnliR1lvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURKcWFuUVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      tv: {
        label: "TV",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1ESnFhblFTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURkak5USXFDaElJTDIwdk1EZGpOVElvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURKcWFuUVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      books: {
        label: "Books",
        value:
          "CAQiWkNCQVNQUW9JTDIwdk1ESnFhblFTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TUdKMFgyTXpLaGdLRmdvU1FrOVBTMU5mVTBWRFZFbFBUbDlPUVUxRklBRW9BQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNREpxYW5RU0FtVnVHZ0pWVXlnQVABUAE",
      },
      "arts-design": {
        label: "Arts & Design",
        value:
          "CAQiQ0NCQVNMQW9JTDIwdk1ESnFhblFTQW1WdUdnSlZVeUlOQ0FRYUNRb0hMMjB2TUdwcWR5b0pFZ2N2YlM4d2FtcDNLQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURKcWFuUVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
      celebrities: {
        label: "Celebrities",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1ESnFhblFTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURGeVpub3FDaElJTDIwdk1ERnlabm9vQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURKcWFuUVNBbVZ1R2dKVlV5Z0FQAVAB",
      },
    },
  },
  sports: {
    label: "Sports",
    value: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVAB",
    sections: {
      nfl: {
        label: "NFL",
        value:
          "CAQiQkNCQVNLd29JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURVNWVXb3FCd29GRWdOT1Jrd29BQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVABUAE",
      },
      nba: {
        label: "NBA",
        value:
          "CAQiQkNCQVNLd29JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURWcWRuZ3FCd29GRWdOT1FrRW9BQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVABUAE",
      },
      mlb: {
        label: "MLB",
        value:
          "CAQiQkNCQVNLd29JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURsd01UUXFCd29GRWdOTlRFSW9BQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVABUAE",
      },
      nhl: {
        label: "NHL",
        value:
          "CAQiQkNCQVNLd29JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURWbmQzSXFCd29GRWdOT1NFd29BQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtVnVHZ0pWVXlnQVABUAE",
      },
      "ncaa-football": {
        label: "NCAA Football",
        value:
          "CAQiT0NCQVNOUW9JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURGNlptWXFFUW9QRWcxT1EwRkJJRVp2YjNSaVlXeHNLQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadWRHb1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
      "ncaa-basketball": {
        label: "NCAA Basketball",
        value:
          "CAQiU0NCQVNPQW9JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURNNWVYcHpLaE1LRVJJUFRrTkJRU0JDWVhOclpYUmlZV3hzS0FBKioIAComCAoiIENCQVNFZ29JTDIwdk1EWnVkR29TQW1WdUdnSlZVeWdBUAFQAQ",
      },
      soccer: {
        label: "Soccer",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURKMmVEUXFDZ29JRWdaVGIyTmpaWElvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadWRHb1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
      nascar: {
        label: "NASCAR",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURVNU9Ya3FDZ29JRWdaT1FWTkRRVklvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadWRHb1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
      golf: {
        label: "Golf",
        value:
          "CAQiQ0NCQVNMQW9JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURNM2FIb3FDQW9HRWdSSGIyeG1LQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadWRHb1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
      tennis: {
        label: "Tennis",
        value:
          "CAQiQ0NCQVNMQW9JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURNM2FIb3FDQW9HRWdSSGIyeG1LQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadWRHb1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
      wnba: {
        label: "WNBA",
        value:
          "CAQiQ0NCQVNMQW9JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TUdaMk1UZ3FDQW9HRWdSWFRrSkJLQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadWRHb1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
    },
  },
  science: {
    label: "Science",
    value: "CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVAB",
    sections: {
      environment: {
        label: "Environment",
        value:
          "CAQiS0NCQVNNZ29JTDIwdk1EWnRjVGNTQW1WdUdnSlZVeUlRQ0FRYURBb0tMMjB2TURRMk5qTXljeW9NRWdvdmJTOHdORFkyTXpKektBQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVABUAE",
      },
      space: {
        label: "Space",
        value:
          "CAQiSENCQVNNQW9JTDIwdk1EWnRjVGNTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURFNE16TjNLZ3NTQ1M5dEx6QXhPRE16ZHlnQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVABUAE",
      },
      physics: {
        label: "Physics",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EWnRjVGNTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURWeGFuUXFDaElJTDIwdk1EVnhhblFvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadGNUY1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
      genetics: {
        label: "Genetics",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EWnRjVGNTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURNMlh6SXFDaElJTDIwdk1ETTJYeklvQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadGNUY1NBbVZ1R2dKVlV5Z0FQAVAB",
      },
      wildlife: {
        label: "Wildlife",
        value:
          "CAQiS0NCQVNNZ29JTDIwdk1EWnRjVGNTQW1WdUdnSlZVeUlRQ0FRYURBb0tMMmN2TVROaVlsOTBjeW9NRWdvdlp5OHhNMkppWDNSektBQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRFp0Y1RjU0FtVnVHZ0pWVXlnQVABUAE",
      },
    },
  },
  health: {
    label: "Health",
    value: "CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAQ",
    sections: {
      medication: {
        label: "Medication",
        value:
          "CAQiQENCQVNLZ29JTDIwdk1HdDBOVEVTQW1WdUlnNElCQm9LQ2dndmJTOHdOSE5vTXlvS0VnZ3ZiUzh3TkhOb015Z0EqJQgAKiEICiIbQ0JBU0Rnb0lMMjB2TUd0ME5URVNBbVZ1S0FBUAFQAQ",
      },
      "health-care": {
        label: "Health Care",
        value:
          "CAQiQ0NCQVNMQW9JTDIwdk1HdDBOVEVTQW1WdUlnOElCQm9MQ2drdmJTOHdNVzEzTW5ncUN4SUpMMjB2TURGdGR6SjRLQUEqJQgAKiEICiIbQ0JBU0Rnb0lMMjB2TUd0ME5URVNBbVZ1S0FBUAFQAQ",
      },
      "mental-health": {
        label: "Mental Health",
        value:
          "CAQiQ0NCQVNMQW9JTDIwdk1HdDBOVEVTQW1WdUlnOElCQm9MQ2drdmJTOHdNM2cyT1djcUN4SUpMMjB2TURONE5qbG5LQUEqJQgAKiEICiIbQ0JBU0Rnb0lMMjB2TUd0ME5URVNBbVZ1S0FBUAFQAQ",
      },
      nutrition: {
        label: "Nutrition",
        value:
          "CAQiQENCQVNLZ29JTDIwdk1HdDBOVEVTQW1WdUlnNElCQm9LQ2dndmJTOHdOV1JxWXlvS0VnZ3ZiUzh3TldScVl5Z0EqJQgAKiEICiIbQ0JBU0Rnb0lMMjB2TUd0ME5URVNBbVZ1S0FBUAFQAQ",
      },
      fitness: {
        label: "Fitness",
        value:
          "CAQiV0NCQVNPd29JTDIwdk1HdDBOVEVTQW1WdUlnOElCQm9MQ2drdmJTOHdNamQ0TjI0cUdnb1lDaFJHU1ZST1JWTlRYMU5GUTFSSlQwNWZUa0ZOUlNBQktBQSolCAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRFU0FtVnVLQUFQAVAB",
      },
    },
  },
} as const;

function NewsCard({ result }: { result: any }) {
  try {
    // Handle both individual news items and grouped stories
    const isGroupedStories = result.stories !== undefined;

    if (isGroupedStories) {
      // For grouped stories, display the main title and first story
      const mainStory = result.stories[0];
      return (
        <a
          href={mainStory.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block mb-4"
        >
          <Card className="hover:bg-gray-700/50 transition-colors bg-gray-800 border border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <div className="bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {result.position}
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-blue-400 hover:text-blue-300 font-medium">
                    {result.title}
                  </h3>
                  <p className="text-sm text-gray-400">{mainStory.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{mainStory.source.name}</span>
                    {mainStory.source.authors?.length > 0 && (
                      <span>• {mainStory.source.authors.join(", ")}</span>
                    )}
                    <span>• {mainStory.date}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      );
    }

    // For individual news items
    return (
      <a
        href={result.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-4"
      >
        <Card className="hover:bg-gray-700/50 transition-colors bg-gray-800 border border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="bg-gray-700 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0">
                {result.position}
              </div>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-blue-400 hover:text-blue-300 font-medium">
                  {result.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{result.source.name}</span>
                  {result.source.authors?.length > 0 && (
                    <span>• {result.source.authors.join(", ")}</span>
                  )}
                  <span>• {result.date}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    );
  } catch (error) {
    return (
      <Card className="bg-gray-800 mb-4 border border-gray-700">
        <CardContent className="pt-6">
          <div className="text-sm text-gray-500">
            Unable to display this news item
          </div>
        </CardContent>
      </Card>
    );
  }
}

const SearchAgent = forwardRef<SearchAgentRef, SearchAgentProps>(
  (props, ref) => {
    const [query, setQuery] = useState(props.initialQuery || "");
    const [searchEngine, setSearchEngine] = useState(
      props.initialEngine || "search"
    );
    const [limit, setLimit] = useState(props.initialLimit || 5);
    const [newsSearchType, setNewsSearchType] = React.useState<
      "query" | "topic" /* | "publication" */
    >("query");
    const [newsTopic, setNewsTopic] = useState<string>(
      props.initialTopic || ""
    );
    const [newsPublication, setNewsPublication] = React.useState<
      string | undefined
    >(undefined);
    const [newsSection, setNewsSection] = useState<string>(
      props.initialSection || ""
    );
    const validTrends = [
      "indexes",
      "most-active",
      "gainers",
      "losers",
      "climate-leaders",
      "cryptocurrencies",
      "currencies",
    ] as const;
    const [marketsTrend, setMarketsTrend] = useState<
      (typeof validTrends)[number]
    >(
      props.initialTrend && validTrends.includes(props.initialTrend as any)
        ? (props.initialTrend as (typeof validTrends)[number])
        : "indexes"
    );
    const [selectedVariableId, setSelectedVariableId] = useState<string>("");
    const [modelResponse, setModelResponse] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<string>("parsed");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const storeVariables = useVariableStore((state) => state.variables);
    const [timeWindow, setTimeWindow] = useState<string>(
      props.initialTimeWindow || ""
    );
    const [marketsRegion, setMarketsRegion] = useState<string>(
      props.initialRegion || ""
    );
    const currentAgent = useAgentStore((state) => state.currentAgent);

    // Add state for variables if needed
    const [variables, setVariables] =
      useState<Record<string, Variable>>(storeVariables);

    // Update local variables when store changes
    useEffect(() => {
      setVariables(storeVariables);
    }, [storeVariables]);

    // Helper function to find variable by name
    const findVariableByName = (name: string) => {
      return Object.values(storeVariables).find((v) => v.name === name);
    };

    // Update processVariablesInText to use store variables
    const processVariablesInText = (text: string): string => {
      const regex = /{{(.*?)}}/g;
      return text.replace(regex, (match, varName) => {
        const trimmedName = varName.trim();
        const variable = findVariableByName(trimmedName);
        return variable?.value || match;
      });
    };

    // Update formatTextWithVariables to use store variables
    const formatTextWithVariables = (text: string) => {
      const regex = /{{(.*?)}}/g;
      const parts = [];
      let lastIndex = 0;

      for (const match of text.matchAll(regex)) {
        const [fullMatch, varName] = match;
        const startIndex = match.index!;
        const trimmedName = varName.trim();
        const varExists = findVariableByName(trimmedName) !== undefined;

        if (startIndex > lastIndex) {
          parts.push(text.slice(lastIndex, startIndex));
        }

        parts.push(
          <span
            key={startIndex}
            className={varExists ? "font-bold text-blue-400" : "text-red-400"}
          >
            {fullMatch}
          </span>
        );

        lastIndex = startIndex + fullMatch.length;
      }

      if (lastIndex < text.length) {
        parts.push(text.slice(lastIndex));
      }

      return parts.length ? parts : text;
    };

    // Expose processBlock to parent components
    useImperativeHandle(ref, () => ({
      processBlock: async () => {
        return handleSearch();
      },
    }));

    const handleUpdateBlock = (updates: Partial<SearchAgentBlock>) => {
      try {
        if (typeof props.onUpdateBlock === "function") {
          props.onUpdateBlock(props.blockNumber, updates);
        } else {
          console.warn("onUpdateBlock is not available");
        }
      } catch (error) {
        console.error("Error updating block:", error);
      }
    };

    const handleEngineChange = (value: string) => {
      console.log("Engine changing to:", value);
      setSearchEngine(value as "search" | "news" | "finance" | "markets");
      handleUpdateBlock({
        type: "searchagent",
        blockNumber: props.blockNumber,
        engine: value as "search" | "news" | "finance" | "markets",
        query,
        limit,
        topic: newsTopic,
        section: newsSection,
        timeWindow,
        trend: marketsTrend,
        region: marketsRegion,
      });
    };

    const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newQuery = e.target.value;
      setQuery(newQuery);
      handleUpdateBlock({
        type: "searchagent",
        blockNumber: props.blockNumber,
        query: newQuery,
        engine: searchEngine,
        limit,
        topic: newsTopic,
        section: newsSection,
        timeWindow,
        trend: marketsTrend,
        region: marketsRegion,
      });
    };

    const handleNewsSearchTypeChange = (
      type: "query" | "topic" /* | "publication" */
    ) => {
      setNewsSearchType(type);
      // Clear other values when switching tabs
      handleUpdateBlock({
        newsSearchType: type,
        query: type === "query" ? query : undefined,
        newsTopic: type === "topic" ? newsTopic : undefined,
        // newsPublication: type === "publication" ? newsPublication : undefined,
        newsSection: undefined,
      });
    };

    const handleNewsFilterChange = (field: string, value: string) => {
      switch (field) {
        case "Topic":
          setNewsTopic(value);
          break;
        case "Publication":
          setNewsPublication(value);
          break;
        case "Section":
          setNewsSection(value);
          break;
      }
      handleUpdateBlock({
        [`news${field}`]: value,
      } as Partial<SearchAgentBlock>);
    };

    const handleVariableSelect = (value: string) => {
      if (value === "add_new" && props.onOpenTools) {
        props.onOpenTools();
      } else {
        setSelectedVariableId(value);
        const selectedVariable = variables.find((v) => v.id === value);
        if (selectedVariable) {
          props.onUpdateBlock(props.blockNumber, {
            language,
            code,
            outputVariable: {
              id: selectedVariable.id,
              name: selectedVariable.name,
              type: selectedVariable.type,
            },
          });
        }
      }
    };

    const handleSearch = async () => {
      try {
        const processedQuery = processVariablesInText(query);

        const response = await api.post("/api/search", {
          engine: searchEngine,
          query: processedQuery,
          limit: limit || 5,
          ...(searchEngine === "markets" && { trend: marketsTrend }),
          ...(searchEngine === "finance" && {
            window: props.financeWindow,
          }),
          ...(searchEngine === "news" && {
            searchType: newsSearchType,
            topic: newsTopic,
            publication: newsPublication,
          }),
        });

        console.log("Search params:", {
          engine: searchEngine,
          trend: marketsTrend,
        });

        console.log("Search response:", response);

        if (!response || typeof response !== "object") {
          throw new Error(
            `Invalid response format: ${JSON.stringify(response)}`
          );
        }

        setModelResponse(response);

        if (selectedVariableId) {
          props.onAddVariable({
            id: selectedVariableId,
            name:
              Object.values(variables).find((v) => v.id === selectedVariableId)
                ?.name || `search_results_${props.blockNumber}`,
            type: "intermediate",
            value: response,
          });
        }

        return true;
      } catch (error) {
        console.error("Error in search block:", error);
        return false;
      }
    };

    const renderResults = () => {
      if (!modelResponse) return null;

      try {
        const getLimitedResults = (items: any[]) => {
          return limit ? items.slice(0, limit) : items;
        };

        let displayResults;

        switch (searchEngine) {
          case "search":
            const searchData =
              typeof modelResponse === "string"
                ? JSON.parse(modelResponse)
                : modelResponse;
            const searchResults = getLimitedResults(searchData.results || []);
            displayResults = { results: searchResults };
            break;
          case "news":
            const newsData =
              typeof modelResponse === "string"
                ? JSON.parse(modelResponse)
                : modelResponse;
            displayResults = {
              results: (newsData.results || []).slice(0, limit),
            };
            break;
          case "finance":
            displayResults = modelResponse;
            break;
          case "markets":
            displayResults = modelResponse;
            break;
          default:
            displayResults = modelResponse;
        }

        return (
          <div className="mt-4 p-4 bg-gray-800 rounded">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 bg-gray-900">
                <TabsTrigger
                  value="parsed"
                  className="text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                >
                  Parsed
                </TabsTrigger>
                <TabsTrigger
                  value="full"
                  className="text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                >
                  Full
                </TabsTrigger>
              </TabsList>
              <TabsContent value="parsed">
                <ParsedResults
                  engine={
                    searchEngine as "search" | "news" | "finance" | "markets"
                  }
                  results={displayResults}
                  limit={limit}
                />
              </TabsContent>
              <TabsContent value="full">
                <pre className="text-sm whitespace-pre-wrap">
                  {JSON.stringify(displayResults, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>
          </div>
        );
      } catch (error) {
        console.error("Error parsing results:", error);
        return <div className="text-red-500">Error parsing results</div>;
      }
    };

    // Update the query input to show formatted variables
    const renderQueryInput = () => (
      <div className="space-y-2">
        <label htmlFor="query" className="block text-sm text-gray-400">
          Query
        </label>
        <Input
          id="query"
          value={query}
          onChange={handleQueryChange}
          placeholder="Enter your search query"
          className="w-full"
        />
        {query && (
          <div className="preview mt-2 text-gray-300">
            {formatTextWithVariables(query)}
          </div>
        )}
      </div>
    );

    return (
      <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">
            Search Agent #{props.blockNumber}
          </h3>
          <Popover>
            <PopoverTrigger>
              <span className="text-gray-400 hover:text-gray-200 cursor-pointer">
                ⚙️
              </span>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-0 bg-black border border-red-500">
              <button
                className="w-full px-4 py-2 text-red-500 hover:bg-red-950 text-left transition-colors"
                onClick={() => props.onDeleteBlock(props.blockNumber)}
              >
                Delete Block
              </button>
            </PopoverContent>
          </Popover>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center gap-4 mb-4">
          <span>&gt; Search Engine</span>
          <Select value={searchEngine} onValueChange={handleEngineChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="search">🔍 Search</SelectItem>
              <SelectItem value="news">📰 News</SelectItem>
              <SelectItem value="finance">💳 Finance</SelectItem>
              <SelectItem value="markets">📈 Finance Markets</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="my-4" />
        <span>
          &gt; {searchEngine.charAt(0).toUpperCase() + searchEngine.slice(1)}{" "}
          Parameters
        </span>

        <div className="mt-4 flex items-center gap-2">
          <Input
            type="number"
            value={limit || ""}
            onChange={(e) =>
              setLimit(e.target.value === "" ? 0 : parseInt(e.target.value))
            }
            className="w-24"
            min={1}
            placeholder="Limit"
          />
          <span className="text-sm text-gray-400">results (empty for all)</span>
        </div>

        {searchEngine && (
          <>
            {/* Conditional content based on searchEngine value */}
            {searchEngine === "search" && (
              <div className="mt-4">{renderQueryInput()}</div>
            )}
            {searchEngine === "news" && (
              <div className="mt-4 space-y-4">
                <Tabs
                  defaultValue="query"
                  value={newsSearchType}
                  onValueChange={(value) =>
                    handleNewsSearchTypeChange(
                      value as "query" | "topic" /* | "publication" */
                    )
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 bg-gray-900">
                    <TabsTrigger
                      value="query"
                      className="text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                    >
                      Query Search
                    </TabsTrigger>
                    <TabsTrigger
                      value="topic"
                      className="text-gray-300 data-[state=active]:bg-gray-800 data-[state=active]:text-white"
                    >
                      Topic Search
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="query" className="mt-4">
                    {renderQueryInput()}
                  </TabsContent>

                  <TabsContent value="topic" className="mt-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="block text-sm text-gray-400">
                          Topic
                        </label>
                        <Select
                          onValueChange={(v) =>
                            handleNewsFilterChange("Topic", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(NEWS_TOPICS).map(([_, topic]) => (
                              <SelectItem key={topic.value} value={topic.value}>
                                {topic.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm text-gray-400">
                          Section (Optional)
                        </label>
                        <Select
                          onValueChange={(v) =>
                            handleNewsFilterChange("Section", v)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a section" />
                          </SelectTrigger>
                          <SelectContent>
                            {newsTopic &&
                              Object.entries(NEWS_TOPICS).map(
                                ([topicKey, topic]) => {
                                  if (
                                    topic.value === newsTopic &&
                                    "sections" in topic
                                  ) {
                                    return Object.entries(topic.sections).map(
                                      ([sectionKey, section]) => (
                                        <SelectItem
                                          key={sectionKey}
                                          value={section.value}
                                        >
                                          {section.label}
                                        </SelectItem>
                                      )
                                    );
                                  }
                                  return null;
                                }
                              )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            {searchEngine === "finance" && (
              <div className="mt-4 space-y-4">
                {renderQueryInput()}
                <div className="space-y-2">
                  <label className="block text-sm text-gray-400">
                    Time Window (Optional)
                  </label>
                  <Select
                    onValueChange={(v) =>
                      handleUpdateBlock({
                        financeWindow: v as
                          | "1D"
                          | "5D"
                          | "1M"
                          | "6M"
                          | "YTD"
                          | "1Y"
                          | "5Y"
                          | "MAX",
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time window (default: 1D)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1D">1 Day</SelectItem>
                      <SelectItem value="5D">5 Days</SelectItem>
                      <SelectItem value="1M">1 Month</SelectItem>
                      <SelectItem value="6M">6 Months</SelectItem>
                      <SelectItem value="YTD">Year to Date</SelectItem>
                      <SelectItem value="1Y">1 Year</SelectItem>
                      <SelectItem value="5Y">5 Years</SelectItem>
                      <SelectItem value="MAX">Maximum</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            {searchEngine === "markets" && (
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm text-gray-400">Trend</label>
                  <Select
                    onValueChange={(v) => {
                      setMarketsTrend(
                        v as
                          | "indexes"
                          | "most-active"
                          | "gainers"
                          | "losers"
                          | "climate-leaders"
                          | "cryptocurrencies"
                          | "currencies"
                      );
                      handleUpdateBlock({
                        marketsTrend: v as
                          | "indexes"
                          | "most-active"
                          | "gainers"
                          | "losers"
                          | "climate-leaders"
                          | "cryptocurrencies"
                          | "currencies",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select market trend" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indexes">Market indexes</SelectItem>
                      <SelectItem value="most-active">Most active</SelectItem>
                      <SelectItem value="gainers">Gainers</SelectItem>
                      <SelectItem value="losers">Losers</SelectItem>
                      <SelectItem value="climate-leaders">
                        Climate leaders
                      </SelectItem>
                      <SelectItem value="cryptocurrencies">Crypto</SelectItem>
                      <SelectItem value="currencies">Currencies</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {marketsTrend === "indexes" && (
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-400">
                      Market Region (Optional)
                    </label>
                    <Select
                      onValueChange={(v) =>
                        handleUpdateBlock({
                          marketsIndexMarket: v as
                            | "americas"
                            | "europe-middle-east-africa"
                            | "asia-pacific",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select market region" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="americas">Americas</SelectItem>
                        <SelectItem value="europe-middle-east-africa">
                          Europe, Middle East, and Africa
                        </SelectItem>
                        <SelectItem value="asia-pacific">
                          Asia Pacific
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Conditional divider before variable selector */}
            <Separator className="my-4" />

            <div className="flex items-center gap-2 text-gray-300">
              <span>Set output as:</span>
              <VariableDropdown
                value={selectedVariableId}
                onValueChange={handleVariableSelect}
                agentId={currentAgent?.id || null}
                onAddNew={props.onOpenTools}
              />
            </div>

            {/* Search button */}
            <div className="mt-4 flex justify-start">
              <Button
                className="flex items-center gap-2"
                onClick={handleSearch}
                disabled={props.isProcessing}
              >
                {props.isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⟳</span>
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </>
        )}

        {modelResponse && !props.isProcessing && renderResults()}
      </div>
    );
  }
);

SearchAgent.displayName = "SearchAgent";

export default SearchAgent;
