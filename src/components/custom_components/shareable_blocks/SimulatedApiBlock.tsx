import { SimulatedApiBlockType } from "@/types/shareable_blocks";
import { useEffect, useState } from "react";

interface SimulatedApiBlockProps {
  blockNumber: number;
  endpoint: string;
  method: string;
  headers?: Record<string, string>;
  body?: string;
  outputVariable?: {
    name: string;
  };
  isCompleted?: boolean;
  output?: string;
  isRunning?: boolean;
  isProcessing?: boolean;
}

export default function SimulatedApiBlock({
  blockNumber,
  endpoint,
  method,
  headers,
  body,
  outputVariable,
  isCompleted,
  output,
  isRunning = false,
  isProcessing = false,
}: SimulatedApiBlockProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isRunning && isProcessing) {
      setIsVisible(true);
      setTimeout(() => setShouldAnimate(true), 50);
    }
  }, [isRunning, isProcessing]);

  if (!isVisible) return null;

  return (
    <div
      className={`bg-gray-950 p-3 rounded-lg mb-6 border border-white/10 transform transition-all duration-500 ease-out 
      ${shouldAnimate ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"}`}
    >
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-white mr-3">
          Block {blockNumber}
        </h3>
        <span className="bg-blue-900 text-blue-200 px-2 py-1 rounded text-sm">
          Simulated API
        </span>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400 mb-2">Endpoint</p>
          <p className="text-white bg-gray-800 p-3 rounded-lg">{endpoint}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-2">Method</p>
          <p className="text-white bg-gray-800 p-3 rounded-lg">{method}</p>
        </div>
        {headers && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Headers</p>
            <pre className="text-white bg-gray-800 p-3 rounded-lg overflow-x-auto">
              {JSON.stringify(headers, null, 2)}
            </pre>
          </div>
        )}
        {body && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Body</p>
            <pre className="text-white bg-gray-800 p-3 rounded-lg overflow-x-auto">
              {body}
            </pre>
          </div>
        )}
        {outputVariable && (
          <div>
            <p className="text-sm text-gray-400 mb-2">Save output as:</p>
            <p className="text-blue-400">{outputVariable.name}</p>
          </div>
        )}
        {isCompleted && output && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {output}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
