import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchAgentBlock } from "@/types/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
          "CAQiW0NCQVNQZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURKd29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeWdBUAFQAQ",
      },
      internet: {
        label: "Internet",
        value:
          "CAQiRkNCQVNMZ29JTDIwdk1EZGpNWFlTQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURkak1YWVNBbVZ1R2dKVlV5Z0FQAVAB",
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
          "CAQiSENCQVNNQW9JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURkak1YWVNBbVZ1R2dKVlV5Z0FQAVAB",
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

interface SearchAgentPrimaryInputProps {
  block: SearchAgentBlock;
  onUpdate: (blockData: Partial<SearchAgentBlock>) => void;
}

export function SearchAgentPrimaryInput({
  block,
  onUpdate,
}: SearchAgentPrimaryInputProps) {
  const [newsSearchType, setNewsSearchType] = useState<"query" | "topic">(
    "query"
  );
  return (
    <div className="space-y-4">
      {/* Skip Block Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="skip"
          checked={block.skip || false}
          onCheckedChange={(checked) => onUpdate({ skip: checked as boolean })}
        />
        <Label htmlFor="skip" className="text-white">
          Skip Block
        </Label>
      </div>

      {/* Search Engine */}
      <div className="space-y-2">
        <Label htmlFor="engine" className="text-white">
          Search Engine
        </Label>
        <Select
          value={block.engine || "search"}
          onValueChange={(value) =>
            onUpdate({
              engine: value as "search" | "news" | "finance" | "markets",
            })
          }
        >
          <SelectTrigger
            id="engine"
            className="bg-gray-800 border-gray-700 text-white"
          >
            <SelectValue placeholder="Select search engine" />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700">
            <SelectItem value="search" className="text-white">
              🔍 Search
            </SelectItem>
            <SelectItem value="news" className="text-white">
              📰 News
            </SelectItem>
            <SelectItem value="finance" className="text-white">
              💳 Finance
            </SelectItem>
            <SelectItem value="markets" className="text-white">
              📈 Markets
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Search Query */}
      {block.engine === "search" && (
        <div className="space-y-2">
          <Label htmlFor="query" className="text-white">
            Search Query
          </Label>
          <Input
            id="query"
            value={block.query || ""}
            onChange={(e) => onUpdate({ query: e.target.value })}
            placeholder="Enter your search query..."
            className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
          />
        </div>
      )}

      {/* Results Limit */}
      <div className="space-y-2">
        <Label htmlFor="limit" className="text-white">
          Number of Results
        </Label>
        <Input
          id="limit"
          type="number"
          min={1}
          max={20}
          value={block.limit ?? 5}
          onChange={(e) =>
            onUpdate({
              limit: e.target.value === "" ? 0 : parseInt(e.target.value) || 5,
            })
          }
          className="bg-gray-800 border-gray-700 text-white"
        />
      </div>
      {/* News-specific fields */}
      {block.engine === "news" && (
        <div className="space-y-4">
          <Tabs
            defaultValue="query"
            value={newsSearchType}
            onValueChange={(value) =>
              setNewsSearchType(value as "query" | "topic")
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
              <div className="space-y-2">
                <Label htmlFor="query" className="text-white">
                  Search Query
                </Label>
                <Input
                  id="query"
                  value={block.query || ""}
                  onChange={(e) => onUpdate({ query: e.target.value })}
                  placeholder="Enter your search query..."
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
            </TabsContent>

            <TabsContent value="topic" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Topic</Label>
                  <Select
                    onValueChange={(v) => {
                      // When selecting a topic, also set newsSearchType to "topic" and clear query
                      onUpdate({
                        topic: v,
                        newsSearchType: "topic",
                        query: undefined, // Clear query when using topic
                      });
                    }}
                  >
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a topic" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {Object.entries(NEWS_TOPICS).map(([_, topic]) => (
                        <SelectItem
                          key={topic.value}
                          value={topic.value}
                          className="text-white"
                        >
                          {topic.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Section (Optional)</Label>
                  <Select onValueChange={(v) => onUpdate({ section: v })}>
                    <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                      <SelectValue placeholder="Select a section" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      {block.topic &&
                        Object.entries(NEWS_TOPICS).map(([_, topic]) => {
                          if (
                            topic.value === block.topic &&
                            "sections" in topic
                          ) {
                            return Object.entries(topic.sections).map(
                              ([_, section]) => (
                                <SelectItem
                                  key={section.value}
                                  value={section.value}
                                  className="text-white"
                                >
                                  {section.label}
                                </SelectItem>
                              )
                            );
                          }
                          return null;
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
      {/* News-specific fields */}
      {/* {block.engine === "news" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="topic" className="text-white">
              News Topic
            </Label>
            <Input
              id="topic"
              value={block.topic || ""}
              onChange={(e) => onUpdate({ topic: e.target.value })}
              placeholder="Enter news topic..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="section" className="text-white">
              News Section
            </Label>
            <Input
              id="section"
              value={block.section || ""}
              onChange={(e) => onUpdate({ section: e.target.value })}
              placeholder="Enter news section..."
              className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
            />
          </div>
        </>
      )} */}
    </div>
  );
}
