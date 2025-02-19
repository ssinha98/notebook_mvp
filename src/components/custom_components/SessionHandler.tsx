import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { auth } from "@/tools/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { SessionExpiredAlert } from "./SessionExpiredAlert";
import { createRoot } from "react-dom/client";

interface AuthWrapperProps {
  children: React.ReactNode;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [isAuthReady, setIsAuthReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const currentPath = window.location.pathname + window.location.search;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && !router.pathname.includes("/login")) {
        // Store the current path for redirect after login
        sessionStorage.setItem("redirectPath", currentPath);

        // Redirect to login page
        router.push({
          pathname: "/login/signup",
          query: { redirect: currentPath },
        });
      }
      setIsAuthReady(true);
    });

    return () => unsubscribe();
  }, [router]);

  // Show nothing while checking auth state
  if (!isAuthReady) {
    return null; // Or return a loading spinner
  }

  // Only render children once auth is ready
  return <>{children}</>;
}

export function SessionHandler() {
  return null; // This can be removed if you're using AuthWrapper instead
}

export function useAuthProtection() {
  const router = useRouter();
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user && !router.pathname.includes("/login")) {
        const currentPath = window.location.pathname + window.location.search;
        sessionStorage.setItem("redirectPath", currentPath);
        router.push({
          pathname: "/login/signup",
          query: { redirect: currentPath },
        });
      }
      setIsAuthChecked(true);
    });

    return () => unsubscribe();
  }, [router]);

  return { isAuthChecked, user: auth.currentUser };
}
