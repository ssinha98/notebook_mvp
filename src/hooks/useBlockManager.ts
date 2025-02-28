import { useSourceStore } from "@/lib/store";
import { Block } from "@/types/types";

export const useBlockManager = () => {
  const { blocks, addBlockToNotebook, removeBlock, updateBlock } =
    useSourceStore();
  const nextBlockNumber = useSourceStore((state) => state.nextBlockNumber);

  const getNextBlockNumber = () => {
    return blocks.length > 0
      ? Math.max(...blocks.map((b) => b.blockNumber)) + 1
      : 1;
  };

  const addBlock = (
    type: "agent" | "transform" | "checkin" | "contact",
    data?: Partial<Block>
  ) => {
    console.log("BlockManager: Creating new block:", {
      type,
      blockNumber: nextBlockNumber,
      ...data,
    });
    const newBlock: Block = {
      type,
      blockNumber: nextBlockNumber,
      ...data,
    };

    console.log("BlockManager: Calling addBlockToNotebook with:", newBlock);
    addBlockToNotebook(newBlock);
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
