import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import VariableDropdown from "./VariableDropdown";
import { useAgentStore } from "@/lib/agentStore";
import { useVariableStore } from "@/lib/variableStore";

interface ChatBlockFormProps {
  blockType: string;
  blockName: string;
  onSubmit: (params: any) => void;
  onCancel: () => void;
  initialValues?: any;
  validationErrors?: Record<string, string>;
  selectedData?: any[];
  selectedColumn?: string;
}

interface FormField {
  key: string;
  label: string;
  type:
    | "input"
    | "textarea"
    | "number"
    | "select"
    | "checkbox"
    | "variabledropdown";
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: any;
}

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
          "CAQiSENCQVNNQW9JTDIwdk1EbHpNV1lTQW1WdUdnSlZVeUlQQ0FRYUN3b0pMMjB2TURkbWNITXpLZ3NTQ1M5dEx6Qm5abkJ6TXlnQSoqCAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVABUAE",
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
          "CAQiT0NCQVNOUW9JTDIwdk1EWnVkR29TQW1WdUdnSlZVeUlPQ0FRYUNnb0lMMjB2TURGNlptWXFFUW9QRWcxT1EwRkJJRVp2YjNSaVlXeHNLQUEqKggAKiYICiIgQ0JBU0Vnb0lMMjB2TURadWRHb1NBbVZ1R2dKVlV5Z0FQAVABUAE",
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

const ChatBlockForm: React.FC<ChatBlockFormProps> = ({
  blockType,
  blockName,
  onSubmit,
  onCancel,
  initialValues,
  validationErrors,
  selectedData,
  selectedColumn,
}) => {
  const [useSelection, setUseSelection] = useState(() => {
    // For Apollo agents, don't use selection by default
    if (blockType === "apolloagent") {
      return false;
    }
    return !!selectedData?.length;
  });

  const [formData, setFormData] = useState(() => {
    const baseData = { ...initialValues };

    // If we have selected data, override the relevant fields
    if (selectedData && selectedData.length > 0) {
      switch (blockType) {
        case "webagent":
          // For webagent, override the URL field with selected data
          if (selectedColumn) {
            baseData.url = selectedData
              .map((row) => row[selectedColumn])
              .filter(Boolean) // Remove null/undefined values
              .join("\n");
          } else {
            // Fallback to first available value
            baseData.url = selectedData
              .map((row) => Object.values(row)[0])
              .filter(Boolean)
              .join("\n");
          }
          break;
        case "searchagent":
          // For search agent, override the query field
          if (selectedColumn) {
            baseData.query = selectedData
              .map((row) => row[selectedColumn])
              .filter(Boolean) // Remove null/undefined values
              .join(", ");
          } else {
            // Fallback to first available value
            baseData.query = selectedData
              .map((row) => Object.values(row)[0])
              .filter(Boolean)
              .join(", ");
          }
          break;
        case "apolloagent":
          // For Apollo agent, we don't auto-fill since it needs two separate fields
          // The user can manually use @selection or table variables
          break;
        // Add other block types as needed
      }
    }

    return baseData;
  });

  // Initialize selectedTopic from initialValues
  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialValues?.topic || ""
  );

  // Update form data when initial values change
  useEffect(() => {
    setFormData(initialValues);
    setSelectedTopic(initialValues?.topic || "");
  }, [initialValues]);

  // Check if Apollo form has @selection values
  const hasApolloSelection =
    blockType === "apolloagent" &&
    ((formData.fullName && formData.fullName.includes("@selection")) ||
      (formData.company && formData.company.includes("@selection")));

  // Helper function to get section options based on selected topic
  const getSectionOptions = (topicValue: string) => {
    if (!topicValue) {
      // Return a placeholder option when no topic is selected
      return [{ value: "", label: "Select a topic first" }];
    }

    const topic = Object.values(NEWS_TOPICS).find(
      (t) => t.value === topicValue
    );
    if (topic && "sections" in topic) {
      return Object.entries(topic.sections).map(([key, section]) => ({
        value: section.value,
        label: section.label,
      }));
    }
    // Return a placeholder option if topic is selected but has no sections
    return [{ value: "", label: "No sections available for this topic" }];
  };

  const getFormFields = (): FormField[] => {
    switch (blockType) {
      case "agent":
        return [
          {
            key: "userPrompt",
            label: "User Prompt",
            type: "textarea",
            placeholder: "Enter your prompt here...",
            required: true,
          },
          {
            key: "systemPrompt",
            label: "System Prompt",
            type: "textarea",
            placeholder: "Optional system prompt...",
            required: false,
          },
        ];

      case "searchagent":
        // Get the current topic value from formData
        const currentTopic = formData.topic || selectedTopic;
        const sectionOptions = getSectionOptions(currentTopic);

        // Check if query is required based on engine and topic
        const isQueryRequired = !(formData.engine === "news" && currentTopic);

        return [
          {
            key: "query",
            label: "Search Query",
            type: "input",
            placeholder: "What do you want to search for?",
            required: isQueryRequired,
          },
          {
            key: "engine",
            label: "Search Engine",
            type: "select",
            options: [
              { value: "search", label: "Google Search" },
              { value: "news", label: "News" },
              { value: "finance", label: "Finance" },
              { value: "markets", label: "Markets" },
              { value: "image", label: "Image Search" },
            ],
            defaultValue: "search",
          },
          {
            key: "limit",
            label: "Number of Results",
            type: "number",
            placeholder: "10",
            defaultValue: 10,
          },
          {
            key: "topic",
            label: "Topic",
            type: "select",
            options: [
              { value: "", label: "Select a topic" },
              ...Object.entries(NEWS_TOPICS).map(([key, topic]) => ({
                value: topic.value,
                label: topic.label,
              })),
            ],
            required: false,
          },
          {
            key: "section",
            label: "Section",
            type: "select",
            options: sectionOptions,
            required: false,
          },
          {
            key: "timeWindow",
            label: "Time Window",
            type: "input",
            placeholder: "Optional time filter...",
            required: false,
          },
          {
            key: "region",
            label: "Region",
            type: "input",
            placeholder: "Optional region filter...",
            required: false,
          },
          {
            key: "previewMode",
            label: "Preview Mode",
            type: "checkbox",
            defaultValue: false,
          },
          {
            key: "outputVariable",
            label: "Save Results To",
            type: "variabledropdown",
            required: false,
          },
        ];

      case "deepresearchagent":
        return [
          {
            key: "topic",
            label: "Research Topic",
            type: "input",
            placeholder: "Topic to research deeply",
            required: true,
          },
          {
            key: "searchEngine",
            label: "Search Engine",
            type: "select",
            options: [
              { value: "google", label: "Google" },
              { value: "bing", label: "Bing" },
              { value: "duckduckgo", label: "DuckDuckGo" },
            ],
            defaultValue: "google",
          },
        ];

      case "webagent":
        return [
          {
            key: "url",
            label: "URL",
            type: "input",
            placeholder: "https://example.com",
            required: true,
          },
          {
            key: "prompt",
            label: "Extraction Prompt",
            type: "textarea",
            placeholder: "What do you want to extract from this page?",
            required: true,
          },
          {
            key: "outputVariable",
            label: "Save Results To",
            type: "variabledropdown",
            required: false,
          },
        ];

      case "codeblock":
        return [
          {
            key: "code",
            label: "Code",
            type: "textarea",
            placeholder: "Enter your code here...",
            required: true,
          },
          {
            key: "language",
            label: "Language",
            type: "select",
            options: [
              { value: "python", label: "Python" },
              { value: "javascript", label: "JavaScript" },
              { value: "sql", label: "SQL" },
              { value: "bash", label: "Bash" },
            ],
            defaultValue: "python",
          },
        ];

      case "instagramagent":
        return [
          {
            key: "url",
            label: "Instagram URL",
            type: "input",
            placeholder: "https://instagram.com/username",
            required: true,
          },
          {
            key: "postCount",
            label: "Number of Posts",
            type: "number",
            placeholder: "10",
            defaultValue: 10,
          },
        ];

      case "excelagent":
        return [
          {
            key: "prompt",
            label: "Excel Task Description",
            type: "textarea",
            placeholder: "Describe what you want to do with Excel...",
            required: true,
          },
        ];

      case "pipedriveagent":
        return [
          {
            key: "prompt",
            label: "Pipedrive Task",
            type: "textarea",
            placeholder: "What do you want to do in Pipedrive?",
            required: true,
          },
        ];

      case "clickupagent":
        return [
          {
            key: "prompt",
            label: "ClickUp Task",
            type: "textarea",
            placeholder: "What do you want to do in ClickUp?",
            required: true,
          },
        ];

      case "datavizagent":
        return [
          {
            key: "prompt",
            label: "Visualization Request",
            type: "textarea",
            placeholder: "What kind of chart or visualization do you want?",
            required: true,
          },
          {
            key: "chartType",
            label: "Chart Type",
            type: "select",
            options: [
              { value: "bar", label: "Bar Chart" },
              { value: "line", label: "Line Chart" },
              { value: "pie", label: "Pie Chart" },
              { value: "scatter", label: "Scatter Plot" },
              { value: "auto", label: "Auto-detect" },
            ],
            defaultValue: "auto",
          },
        ];

      case "googledriveagent":
        return [
          {
            key: "prompt",
            label: "Google Drive Task",
            type: "textarea",
            placeholder: "What do you want to do with Google Drive?",
            required: true,
          },
        ];

      case "make":
        return [
          {
            key: "webhookUrl",
            label: "Webhook URL",
            type: "input",
            placeholder: "https://hook.make.com/...",
            required: true,
          },
          {
            key: "parameters",
            label: "Parameters (JSON)",
            type: "textarea",
            placeholder: '{"key": "value"}',
            required: false,
          },
        ];

      case "contact":
        return [
          {
            key: "recipient",
            label: "Recipient",
            type: "input",
            placeholder: "email@example.com",
            required: true,
          },
          {
            key: "subject",
            label: "Subject",
            type: "input",
            placeholder: "Email subject",
            required: true,
          },
          {
            key: "body",
            label: "Message Body",
            type: "textarea",
            placeholder: "Your message...",
            required: true,
          },
        ];

      case "apolloagent":
        return [
          {
            key: "fullName",
            label: "Full Name",
            type: "input",
            placeholder: "Enter full name or use {{table.column}}",
            required: true,
          },
          {
            key: "company",
            label: "Company",
            type: "input",
            placeholder: "Enter company name or use {{table.column}}",
            required: true,
          },
          {
            key: "prompt",
            label: "Prompt (optional)",
            type: "textarea",
            placeholder: "Enter optional prompt for enrichment",
            required: false,
          },
          {
            key: "outputVariable",
            label: "Output Variable",
            type: "variabledropdown", // Custom type for VariableDropdown
            required: false,
          },
        ];

      default:
        return [];
    }
  };

  const handleInputChange = (key: string, value: any) => {
    // Special handling for outputVariable to convert string back to object format
    if (key === "outputVariable" && typeof value === "string") {
      if (value.includes(":")) {
        // It's a table column selection
        const [tableId, columnName] = value.split(":");
        const variables = useVariableStore.getState().variables;
        const tableVariable = variables[tableId];

        if (tableVariable && tableVariable.type === "table") {
          value = {
            id: tableId,
            name: tableVariable.name,
            type: "table",
            columnName: columnName,
          };
        }
      } else if (value) {
        // It's a regular variable
        const variables = useVariableStore.getState().variables;
        const variable = variables[value];

        if (variable) {
          value = {
            id: value,
            name: variable.name,
            type: variable.type,
          };
        }
      }
    }

    setFormData((prev: any) => ({
      ...prev,
      [key]: value,
    }));

    // Update selected topic when topic field changes
    if (key === "topic") {
      setSelectedTopic(value);
      // Clear section when topic changes
      setFormData((prev: any) => ({
        ...prev,
        section: "",
      }));
    }
  };

  // Add debugging to the handleSubmit function
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // console.log("ChatBlockForm: handleSubmit called");
    // console.log("ChatBlockForm: formData:", formData);
    // console.log("ChatBlockForm: useSelection:", useSelection);
    // console.log("ChatBlockForm: selectedData:", selectedData);

    let finalFormData = { ...formData };

    // If using selection, add it to the form data
    if (useSelection && selectedData && selectedData.length > 0) {
      finalFormData.selectedData = selectedData;
      finalFormData.selectedColumn = selectedColumn; // Add selectedColumn to form data

      // Pre-fill certain fields with selection data
      if (blockType === "agent" && !finalFormData.userPrompt) {
        finalFormData.userPrompt = `Process this data: ${JSON.stringify(selectedData)}`;
      }
    }

    // For Apollo agents, make sure we pass the outputVariable as selectedVariableId
    if (blockType === "apolloagent") {
      if (finalFormData.outputVariable) {
        finalFormData.selectedVariableId = finalFormData.outputVariable;
        // console.log(
        //   "ChatBlockForm: Apollo outputVariable:",
        //   finalFormData.outputVariable
        // );
      } else {
        // console.log("ChatBlockForm: Apollo - no outputVariable selected");
      }
    }

    // console.log("ChatBlockForm: Caliling onSubmit with:", finalFormData);
    onSubmit(finalFormData);
  };

  const renderField = (field: FormField) => {
    // Use form data value, or fall back to field default, or empty string
    let value =
      formData[field.key] !== undefined
        ? formData[field.key]
        : (field.defaultValue ?? "");

    // Special handling for outputVariable in VariableDropdown
    if (field.type === "variabledropdown" && field.key === "outputVariable") {
      // Convert outputVariable object to string format for VariableDropdown
      if (value && typeof value === "object" && value.id) {
        if (value.type === "table" && value.columnName) {
          value = `${value.id}:${value.columnName}`;
        } else {
          value = value.id;
        }
      } else if (typeof value !== "string") {
        value = "";
      }
    }

    const hasError = validationErrors?.[field.key];

    if (field.type === "variabledropdown") {
      return (
        <div key={field.key} className="space-y-1">
          <label className="block text-sm text-gray-300">
            {field.label}
            {field.required && <span className="text-red-400 ml-1">*</span>}
          </label>
          <VariableDropdown
            value={value || ""}
            onValueChange={(newValue) => handleInputChange(field.key, newValue)}
            agentId={useAgentStore.getState().currentAgent?.id || null}
            className="w-full"
          />
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1">
        <label className="block text-sm text-gray-300">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {field.type === "checkbox" ? (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id={field.key}
              checked={value}
              onChange={(e) => handleInputChange(field.key, e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor={field.key} className="text-sm text-gray-300">
              Enable preview mode - show results in dialog before adding to
              table
            </label>
          </div>
        ) : field.type === "textarea" ? (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`bg-gray-700 border-gray-600 text-white min-h-[80px] ${
              hasError ? "border-red-500" : ""
            }`}
            required={field.required}
          />
        ) : field.type === "select" ? (
          <select
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className={`w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 ${
              hasError ? "border-red-500" : ""
            }`}
            required={field.required}
          >
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : field.type === "number" ? (
          <Input
            type="number"
            value={value}
            onChange={(e) =>
              handleInputChange(field.key, parseInt(e.target.value) || 0)
            }
            placeholder={field.placeholder}
            className={`bg-gray-700 border-gray-600 text-white ${
              hasError ? "border-red-500" : ""
            }`}
            required={field.required}
          />
        ) : (
          <Input
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className={`bg-gray-700 border-gray-600 text-white ${
              hasError ? "border-red-500" : ""
            }`}
            required={field.required}
          />
        )}

        {hasError && (
          <div className="text-red-400 text-xs">
            {validationErrors[field.key]}
          </div>
        )}
      </div>
    );
  };

  const fields = getFormFields();

  if (fields.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mt-2">
        <div className="text-white text-center">
          No parameters required for {blockName}
        </div>
        <div className="flex gap-2 pt-4 justify-center">
          <Button
            onClick={() => onSubmit({})}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-3 w-3 mr-1" />
            Execute
          </Button>
          <Button
            onClick={onCancel}
            size="sm"
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mt-2">
      <h4 className="text-white font-medium mb-3">
        Parameters for {blockName}
      </h4>

      {/* Apollo selection warning */}
      {hasApolloSelection && (
        <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-md">
          <div className="text-yellow-300 text-sm font-medium mb-1">
            ⚠️ Apollo Agent Recommendation
          </div>
          <div className="text-yellow-200 text-xs">
            Apollo works best when working on full columns. Consider using table
            variables like{" "}
            <code className="bg-yellow-900/50 px-1 rounded">
              {"{{table.column}}"}
            </code>{" "}
            instead of @selection for better results.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(renderField)}

        {selectedData && selectedData.length > 0 && (
          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="useSelection"
              checked={useSelection}
              onChange={(e) => setUseSelection(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            <label htmlFor="useSelection" className="text-sm text-gray-300">
              Use selected data ({selectedData.length} items)
            </label>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            type="submit"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Check className="h-3 w-3 mr-1" />
            Execute
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onCancel}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <X className="h-3 w-3 mr-1" />
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatBlockForm;
