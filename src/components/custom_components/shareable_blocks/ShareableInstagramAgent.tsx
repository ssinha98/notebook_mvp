import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { api } from "@/tools/api";

interface ShareableInstagramResult {
  imageUrl: string;
  caption: string;
  likes: number;
  comments: number;
  timestamp: string;
}

interface ShareableInstagramAgentProps {
  blockNumber: number;
  isCompleted?: boolean;
  isProcessing?: boolean;
  thinkingEmoji?: string;
  output?: string;
  outputVariable?: {
    name: string;
    value?: string;
  };
  url: string;
  postCount: number;
}

const ShareableInstagramAgent: React.FC<ShareableInstagramAgentProps> = ({
  blockNumber,
  isCompleted,
  isProcessing,
  thinkingEmoji,
  output,
  outputVariable,
  url,
  postCount,
}) => {
  const [error, setError] = useState<string | null>(null);
  const parsedPosts = isCompleted && output ? JSON.parse(output) : [];

  return (
    <div className="p-4 rounded-lg border border-gray-700 bg-gray-800">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">
          Instagram Agent #{blockNumber}
        </h3>
      </div>

      <Separator className="my-4" />

      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-400">Instagram URL</p>
          <p className="text-white">{url}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Number of Posts</p>
          <p className="text-white">{postCount}</p>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-800 rounded">
          <p className="text-red-500">{error}</p>
        </div>
      )}

      {isProcessing && thinkingEmoji && (
        <div className="text-2xl text-center animate-pulse mt-4">
          {thinkingEmoji}
        </div>
      )}

      {isCompleted && parsedPosts.length > 0 && (
        <div className="mt-4">
          <div className="overflow-x-auto">
            <div
              className="flex gap-4 pb-4"
              style={{ minWidth: "min-content" }}
            >
              {parsedPosts.map((post: any, index: number) => (
                <div
                  key={index}
                  className="p-4 bg-gray-700 rounded-lg"
                  style={{ minWidth: "400px" }}
                >
                  <div className="flex gap-4">
                    <div className="w-24 h-24 bg-gray-600 rounded-lg overflow-hidden">
                      <img
                        src={post.imageUrl}
                        alt="Instagram post"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-white mb-2">{post.caption}</p>
                      <div className="flex gap-4 text-sm text-gray-400">
                        <span>❤️ {post.likes}</span>
                        <span>💬 {post.comments}</span>
                        <span>
                          🕒 {new Date(post.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShareableInstagramAgent;
