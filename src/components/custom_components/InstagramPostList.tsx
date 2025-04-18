import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";

interface SimplifiedPost {
  pk: string;
  id: string;
  taken_at: string;
  image_url: string;
  comment_count: number;
  like_count: number;
  play_count: number | null;
  has_liked: boolean;
  caption: string;
}

interface InstagramPostListProps {
  posts: SimplifiedPost[];
  onSelectionChange?: (selectedPosts: SimplifiedPost[]) => void;
}

export default function InstagramPostList({
  posts = [],
  onSelectionChange,
}: InstagramPostListProps) {
  const mailtoLink =
    "mailto:sahil@lytix.co?subject=instagram%20credentials&body=hey!%20I'd%20like%20to%20get%20started%20with%20the%20instagram%20agent";

  return (
    <div className="w-full p-8">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 text-center">
        <h3 className="text-lg font-semibold text-gray-200 mb-3">
          🔒 Coming Soon
        </h3>
        <p className="text-gray-400 mb-6">
          Instagram Agent needs your credentials in order to scrape results. Get
          in touch to pass us your credentials and start scraping Instagram
          data!
        </p>
        <a
          href={mailtoLink}
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Get Started
        </a>
      </div>
    </div>
  );
}
