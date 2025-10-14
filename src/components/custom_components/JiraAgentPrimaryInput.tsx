import React, { forwardRef, useImperativeHandle } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { JiraBlock } from "@/types/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { api, API_URL } from "@/tools/api";
import { auth } from "@/tools/firebase";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "lucide-react";
import { useVariableStore } from "@/lib/variableStore";

// New reusable component
interface JiraPrimaryInputSearchProps {
  searchType: string;
  searchQuery: string;
  onSearchTypeChange: (type: string) => void;
  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  index: number; // Add this
  selectedCount: number; // Add this
  onAddAnotherSearch: () => void; // Add this
  onSelectedCountChange: (count: number) => void; // Add this
  onSearchResultsChange: (results: any[]) => void; // Add this
  onSelectedTicketsChange: (tickets: Set<string>) => void; // Add this
}

function JiraPrimaryInputSearch({
  searchType,
  searchQuery,
  onSearchTypeChange,
  onSearchQueryChange,
  onSearch,
  index,
  selectedCount,
  onAddAnotherSearch, // Add this
  onSelectedCountChange,
  onSearchResultsChange,
  onSelectedTicketsChange,
}: JiraPrimaryInputSearchProps) {
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(
    new Set()
  );

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      console.log("No search query provided");
      return;
    }

    setIsSearching(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        console.error("No user ID available");
        return;
      }

      const response = await api.post("/jira/search", {
        user_id: userId,
        search_type: searchType,
        search_input: searchQuery,
      });

      console.log("Jira search response:", response);

      if (response.status === "success" && response.data) {
        setSearchResults(response.data);
        onSearchResultsChange(response.data); // Add this
        // Auto-select all tickets by default
        const allTicketIds = new Set(
          response.data.map((ticket: any) => ticket.id as string)
        );
        setSelectedTickets(allTicketIds as Set<string>);
        onSelectedTicketsChange(allTicketIds as Set<string>); // Add this
        onSelectedCountChange(allTicketIds.size); // Report the new count
      } else {
        console.error("Search failed:", response);
        setSearchResults([]);
        setSelectedTickets(new Set());
        onSelectedCountChange(0); // Report the new count
      }
    } catch (error) {
      console.error("Error searching Jira:", error);
      setSearchResults([]);
      setSelectedTickets(new Set());
      onSelectedCountChange(0); // Report the new count
    } finally {
      setIsSearching(false);
    }
  };

  const handleTicketSelect = (ticketId: string, isSelected: boolean) => {
    setSelectedTickets((prev) => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(ticketId);
      } else {
        newSet.delete(ticketId);
      }
      onSelectedTicketsChange(newSet); // Add this
      onSelectedCountChange(newSet.size); // Report the new count
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allTicketIds = new Set(
      searchResults.map((ticket: any) => ticket.id as string)
    );
    setSelectedTickets(allTicketIds);
    onSelectedTicketsChange(allTicketIds); // Add this
    onSelectedCountChange(allTicketIds.size); // Report the new count
  };

  const handleClearAll = () => {
    setSelectedTickets(new Set());
    onSelectedTicketsChange(new Set()); // Add this
    onSelectedCountChange(0); // Report the new count
  };

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="search" className="border border-gray-700">
        <AccordionTrigger className="text-gray-300 hover:text-white px-4 py-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span>Search {index}</span>
            {selectedCount > 0 && (
              <span className="text-xs text-blue-400">
                ({selectedCount} selected)
              </span>
            )}
          </div>
        </AccordionTrigger>
        <AccordionContent className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="space-y-3">
            {/* Search Type Tabs */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                Search Type
              </Label>
              <Tabs
                value={searchType}
                onValueChange={onSearchTypeChange}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700">
                  <TabsTrigger
                    value="query"
                    className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>🔍</span>
                      <span>Query</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="jql"
                    className="text-gray-300 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:border-blue-500 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>⚙️</span>
                      <span>JQL</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Search Query Input */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-300">
                {searchType === "jql" ? "JQL Query" : "Search Query"}
              </Label>
              <Input
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={
                  searchType === "jql"
                    ? "Enter JQL query (e.g., project = 'PROJ' AND status = 'Open')"
                    : "Enter what to search for"
                }
                className="bg-gray-800 border-gray-700 text-gray-100 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              {searchType === "jql" && (
                <div className="text-xs text-gray-400 mt-1">
                  💡 JQL (Jira Query Language) allows advanced filtering.
                  Example:{" "}
                  <code className="bg-gray-800 px-1 rounded">
                    project = "PROJ" AND status = "Open"
                  </code>
                </div>
              )}

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Search"}
              </Button>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-300">
                      Search Results ({searchResults.length})
                    </h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                        className="text-xs"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAll}
                        className="text-xs"
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto">
                    {searchResults.map((ticket: any) => (
                      <Card
                        key={ticket.id}
                        className={`border border-gray-600 bg-gray-800 hover:bg-gray-750 transition-colors ${
                          selectedTickets.has(ticket.id)
                            ? "ring-2 ring-blue-500"
                            : ""
                        }`}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedTickets.has(ticket.id)}
                              onCheckedChange={(checked) =>
                                handleTicketSelect(
                                  ticket.id,
                                  checked as boolean
                                )
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-white">
                                  {ticket.key}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {ticket.fields.project.name}
                                </span>
                              </div>
                              <div className="text-sm text-gray-200">
                                {ticket.fields.summary}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-gray-400">
                                <span>
                                  Created by:{" "}
                                  {ticket.fields.creator.displayName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <span>Priority:</span>
                                  <span
                                    className={`px-1 rounded text-xs ${
                                      ticket.fields.priority.name === "High"
                                        ? "bg-red-900 text-red-300"
                                        : ticket.fields.priority.name ===
                                            "Medium"
                                          ? "bg-yellow-900 text-yellow-300"
                                          : "bg-gray-700 text-gray-300"
                                    }`}
                                  >
                                    {ticket.fields.priority.name}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Add "Make Another Query" button after results */}
              {searchResults.length > 0 && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={onAddAnotherSearch} // Use the callback
                    className="w-full mt-3 border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Make Another Query?
                  </Button>
                </div>
              )}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

// Main component now uses the reusable search component
interface JiraAgentPrimaryInputProps {
  block: JiraBlock;
  onUpdate: (blockData: Partial<JiraBlock>) => void;
}

export const JiraAgentPrimaryInput = forwardRef<
  { saveSelectedTicketsToVariable: () => Promise<void> },
  JiraAgentPrimaryInputProps
>(({ block, onUpdate }, ref) => {
  // Update the searchConfigs state to include the missing properties:
  const [searchConfigs, setSearchConfigs] = useState([
    {
      id: 1,
      searchType: block.prompt || "query",
      searchQuery: block.searchQuery || "",
      selectedCount: 0,
      searchResults: [] as any[], // Add this
      selectedTickets: new Set<string>(), // Add this
    },
  ]);

  // Calculate total selected tickets across all accordions
  const totalSelectedTickets = searchConfigs.reduce(
    (total, config) => total + config.selectedCount,
    0
  );

  // Get the variable name from the block
  const getVariableName = () => {
    if (block.outputVariable) {
      return block.outputVariable.name;
    }
    return "selected variable";
  };

  const handleAddSearch = () => {
    const newId = Math.max(...searchConfigs.map((s) => s.id)) + 1;
    setSearchConfigs((prev) => [
      ...prev,
      {
        id: newId,
        searchType: "query",
        searchQuery: "",
        selectedCount: 0,
        searchResults: [], // Add this
        selectedTickets: new Set(), // Add this
      },
    ]);
  };

  const handleSearchConfigUpdate = (id: number, updates: any) => {
    setSearchConfigs((prev) =>
      prev.map((config) =>
        config.id === id ? { ...config, ...updates } : config
      )
    );
  };

  // Add this function to collect all selected tickets:
  const getAllSelectedTickets = () => {
    const allSelectedTickets: any[] = [];

    searchConfigs.forEach((config) => {
      // Get the search results for this config
      const configResults = config.searchResults || [];
      const configSelectedTickets = config.selectedTickets || new Set();

      // Add selected tickets to the collection
      configResults.forEach((ticket: any) => {
        if (configSelectedTickets.has(ticket.id)) {
          allSelectedTickets.push(ticket);
        }
      });
    });

    return allSelectedTickets;
  };

  // Add this function to format tickets as a string:
  const formatTicketsAsString = (tickets: any[]) => {
    return tickets
      .map((ticket) => {
        return `${ticket.key}: ${ticket.fields.summary} (${ticket.fields.project.name}, ${ticket.fields.priority.name}, Created by: ${ticket.fields.creator.displayName})`;
      })
      .join("\n");
  };

  // Add this function to save selected tickets to variable:
  const saveSelectedTicketsToVariable = async () => {
    const selectedTickets = getAllSelectedTickets();
    if (selectedTickets.length === 0) {
      console.log("No tickets selected");
      return;
    }

    const ticketsString = formatTicketsAsString(selectedTickets);

    if (block.outputVariable) {
      try {
        if (
          block.outputVariable.type === "table" &&
          block.outputVariable.columnName
        ) {
          // Save to table column
          await useVariableStore
            .getState()
            .addTableRow(block.outputVariable.id, {
              [block.outputVariable.columnName]: ticketsString,
            });
        } else {
          // Save to regular variable
          await useVariableStore
            .getState()
            .updateVariable(block.outputVariable.id, ticketsString);
        }
        console.log(
          `Saved ${selectedTickets.length} tickets to ${block.outputVariable.name}`
        );
      } catch (error) {
        console.error("Error saving tickets to variable:", error);
      }
    }
  };

  // Expose the save function via useImperativeHandle
  useImperativeHandle(ref, () => ({
    saveSelectedTicketsToVariable,
  }));

  return (
    <div className="space-y-3 h-full overflow-y-auto">
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

      {/* Multiple Search Components */}
      {searchConfigs.map((config) => (
        <JiraPrimaryInputSearch
          key={config.id}
          index={config.id}
          searchType={config.searchType}
          searchQuery={config.searchQuery}
          selectedCount={config.selectedCount}
          onSearchTypeChange={(type) =>
            handleSearchConfigUpdate(config.id, { searchType: type })
          }
          onSearchQueryChange={(query) =>
            handleSearchConfigUpdate(config.id, { searchQuery: query })
          }
          onSearch={() => console.log("Search clicked:", config.searchQuery)}
          onAddAnotherSearch={handleAddSearch} // Add this
          onSelectedCountChange={(count) =>
            handleSearchConfigUpdate(config.id, { selectedCount: count })
          }
          onSearchResultsChange={(results) =>
            handleSearchConfigUpdate(config.id, { searchResults: results })
          }
          onSelectedTicketsChange={(tickets) =>
            handleSearchConfigUpdate(config.id, { selectedTickets: tickets })
          }
        />
      ))}

      {/* Total selected tickets summary */}
      {totalSelectedTickets > 0 && (
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-600/30 rounded-md">
          <div className="text-blue-300 text-sm font-medium">
            {totalSelectedTickets} ticket{totalSelectedTickets !== 1 ? "s" : ""}{" "}
            being saved to {getVariableName()}
          </div>
        </div>
      )}
    </div>
  );
});

JiraAgentPrimaryInput.displayName = "JiraAgentPrimaryInput";
