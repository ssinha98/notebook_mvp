import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "@/tools/firebase";
import { useRouter } from "next/router";
import posthog from "posthog-js";

export default function SignOut() {
  const router = useRouter();

  useEffect(() => {
    signOut(auth).then(() => {
      // Reset PostHog identification when user signs out
      posthog.reset();
      router.push('/login/signup');
    }).catch((error) => {
      console.error("Error signing out:", error);
    });
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="text-white">Signing out...</div>
    </div>
  );
}