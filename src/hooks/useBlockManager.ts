import { useSourceStore } from "@/lib/store";
import { Block, SearchAgentBlock } from "@/types/types";

export const useBlockManager = () => {
  const { blocks, addBlockToNotebook, removeBlock, updateBlock } =
    useSourceStore();
  const nextBlockNumber = useSourceStore((state) => state.nextBlockNumber);

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

    addBlockToNotebook(newBlock as Block);
  };

  const deleteBlock = (blockNumber: number) => {
    removeBlock(blockNumber);
  };

  const updateBlockData = (blockNumber: number, updates: Partial<Block>) => {
    updateBlock(blockNumber, updates);
  };

  return {
    blocks,
    addBlock,
    deleteBlock,
    updateBlockData,
    getNextBlockNumber,
  };
};
