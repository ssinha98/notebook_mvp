import { useAgentStore } from "@/lib/agentStore";
import { Block, SearchAgentBlock } from "@/types/types";

export const useBlockManager = () => {
  const { addBlockToAgent, deleteBlock, updateBlockData } = useAgentStore();
  const currentAgent = useAgentStore((state) => state.currentAgent);
  const blocks = currentAgent?.blocks || [];

  const getNextBlockNumber = () => {
    return blocks.length > 0
      ? Math.max(...blocks.map((b) => b.blockNumber)) + 1
      : 1;
  };

  const addBlock = (type: Block["type"], additionalProps = {}) => {
    const blockNumber = getNextBlockNumber();
    const newBlock: Partial<SearchAgentBlock> = {
      id: crypto.randomUUID(),
      blockNumber,
      ...additionalProps,
    };

    if (type === "searchagent") {
      // Add default search properties
      // newBlock.query = "";
      // newBlock.searchEngine = "google";
      // newBlock.maxResults = 5;
      // newBlock.filters = {
      //   dateRange: "any",
      //   language: "en",
      //   region: "global",
      // };
    }

    addBlockToAgent(newBlock as Block);
  };

  const removeBlock = (blockNumber: number) => {
    deleteBlock(blockNumber);
  };

  const updateBlock = (blockNumber: number, updates: Partial<Block>) => {
    updateBlockData(blockNumber, updates);
  };

  return {
    blocks,
    addBlock,
    deleteBlock: removeBlock, // Keep the old name for backward compatibility
    updateBlockData: updateBlock, // Keep the old name for backward compatibility
    getNextBlockNumber,
  };
};
