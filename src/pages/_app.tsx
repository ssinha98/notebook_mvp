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
import { AuthWrapper } from "@/components/custom_components/SessionHandler";

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
          firebase_uid: user.uid,
        });
      } else {
        // Reset the user identification when they log out
        posthog.reset();
      }
    });

    return () => {
      router.events.off("routeChangeComplete", handleRouteChange);
      unsubscribe();
    };
  }, [router.events, router]);

  // List of public routes that don't require authentication
  const publicRoutes = [
    "/agentStore",
    "/sharedAgent",
    "/login/signup",
    "/login/signin",
  ];

  // Check if the current route is a public route
  const isPublicRoute = publicRoutes.some((route) =>
    router.pathname.startsWith(route)
  );

  return (
    <>
      {isPublicRoute ? (
        <Component {...pageProps} />
      ) : (
        <AuthWrapper>
          <Component {...pageProps} />
        </AuthWrapper>
      )}
    </>
  );
}
