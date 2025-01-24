// // app/providers.tsx
// 'use client'

// import posthog from 'posthog-js'
// import { PostHogProvider as PHProvider } from 'posthog-js/react'
// import { useEffect } from 'react'

// export function PostHogProvider({ children }: { children: React.ReactNode }) {
//     useEffect(() => {
//       posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
//         api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
//         capture_pageview: false // Disable automatic pageview capture, as we capture manually
//       })
//   }, [])

//   return (
//     <PHProvider client={posthog}>
//       {children}
//     </PHProvider>
//   )
// }

"use client";

import posthog from "posthog-js";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function PostHogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Initialize PostHog
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
      api_host:
        process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      loaded: (posthog) => {
        if (process.env.NODE_ENV === "development") posthog.debug();
      },
    });
  }, []);

  useEffect(() => {
    if (pathname) {
      posthog.capture("$pageview");
    }
  }, [pathname, searchParams]);

  return children;
}
