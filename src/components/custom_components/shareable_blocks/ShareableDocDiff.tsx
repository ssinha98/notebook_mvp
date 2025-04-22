import React from "react";

interface ShareableDocDiffProps {
  blockNumber: number;
  originalDoc: string;
  modifiedDoc: string;
  isProcessing?: boolean;
  isCompleted?: boolean;
  output?: string;
}

const ShareableDocDiff: React.FC<ShareableDocDiffProps> = ({
  blockNumber,
  originalDoc,
  modifiedDoc,
  isProcessing,
  isCompleted,
  output,
}) => {
  return (
    <div className="p-4 border rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">
          Document Diff Block #{blockNumber}
        </h3>
        {isProcessing && <span>Processing...</span>}
        {isCompleted && <span>✓</span>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Original Document</h4>
          <pre className="bg-gray-100 p-2 rounded">{originalDoc}</pre>
        </div>
        <div>
          <h4 className="font-medium mb-2">Modified Document</h4>
          <pre className="bg-gray-100 p-2 rounded">{modifiedDoc}</pre>
        </div>
      </div>

      {output && (
        <div className="mt-4">
          <h4 className="font-medium mb-2">Output</h4>
          <pre className="bg-gray-100 p-2 rounded">{output}</pre>
        </div>
      )}
    </div>
  );
};

export default ShareableDocDiff;
