import React, { useEffect } from "react";
import { useRouter } from "next/router";
import { auth } from "@/tools/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { SessionExpiredAlert } from "./SessionExpiredAlert";
import { createRoot } from "react-dom/client";

export function SessionHandler() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        // Show alert
        const alertContainer = document.createElement("div");
        document.body.appendChild(alertContainer);
        const root = createRoot(alertContainer);
        root.render(<SessionExpiredAlert />);

        // Redirect after delay
        setTimeout(() => {
          router.push("/login/signup");
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null;
}
