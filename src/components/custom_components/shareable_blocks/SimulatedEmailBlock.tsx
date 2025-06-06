import { SimulatedEmailBlockType } from "@/types/shareable_blocks";
import { useEffect, useState } from "react";
import { MdOutlineEmail } from "react-icons/md";

interface SimulatedEmailBlockProps {
  blockNumber: number;
  from: string;
  subject: string;
  body: string;
  attachments?: {
    name: string;
    type: string;
    content: string;
  }[];
  outputVariable?: {
    name: string;
  };
  isCompleted?: boolean;
  output?: string;
  isRunning?: boolean;
  isProcessing?: boolean;
}

export default function SimulatedEmailBlock({
  blockNumber,
  from,
  subject,
  body,
  attachments,
  outputVariable,
  isCompleted,
  output,
  isRunning = false,
  isProcessing = false,
}: SimulatedEmailBlockProps) {
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
          Email Received (hello@yourco.com)
        </span>
      </div>
      <div className="space-y-3">
        <div>
          <p className="text-sm text-gray-400 mb-1">From</p>
          <p className="text-white bg-gray-900 p-2 rounded-lg">{from}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">Subject</p>
          <p className="text-white bg-gray-900 p-2 rounded-lg">{subject}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400 mb-1">Body</p>
          <div className="text-white bg-gray-900 p-2 rounded-lg max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap">{body}</pre>
          </div>
        </div>
        {attachments && attachments.length > 0 && (
          <div>
            <p className="text-sm text-gray-400 mb-1">Attachments</p>
            <div className="space-y-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="bg-gray-900 p-2 rounded-lg flex items-center justify-between"
                >
                  <span className="text-white">{attachment.name}</span>
                  <span className="text-gray-400 text-sm">
                    {attachment.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        {outputVariable && (
          <div>
            <p className="text-sm text-gray-400 mb-1">Save output as:</p>
            <p className="text-blue-400">{outputVariable.name}</p>
          </div>
        )}
        {isCompleted && output && (
          <div className="mt-3 p-3 bg-gray-900 rounded-lg">
            <p className="text-sm text-gray-300 whitespace-pre-wrap">
              {output}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
