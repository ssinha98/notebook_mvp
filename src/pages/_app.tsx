// import "@/styles/globals.css";
// import type { AppProps } from "next/app";

// export default function App({ Component, pageProps }: AppProps) {
//   return <Component {...pageProps} />;
// }

import "@/styles/globals.css";
import type { AppProps } from "next/app";
import posthog from "posthog-js";
import { useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "@/tools/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Check that PostHog is client-side
if (typeof window !== "undefined") {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY as string, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
    loaded: (posthog) => {
      if (process.env.NODE_ENV === "development") posthog.debug();
    },
  });
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  useEffect(() => {
    // Track page views
    const handleRouteChange = () => posthog.capture("$pageview");
    router.events.on("routeChangeComplete", handleRouteChange);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Identify user in PostHog when they log in
        posthog.identify(user.uid, {
          email: user.email,
          name: user.displayName,
          firebase_uid: user.uid
        });
      } else if (router.pathname !== '/login/signup') {
        router.push('/login/signup');
        // Reset the user identification when they log out
        posthog.reset();
      }
    });

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      unsubscribe();
    };
  }, [router.events, router]);

  return <Component {...pageProps} />;
}
