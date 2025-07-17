import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { auth, googleProvider, db } from "@/tools/firebase";
import { useRouter } from "next/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [passwordOne, setPasswordOne] = useState("");
  const [passwordTwo, setPasswordTwo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { redirect } = router.query; // Get redirect path from query params

  const handleSuccessfulAuth = () => {
    // Always redirect to home after successful login
    router.push("/");
  };

  const createUserDocument = async (uid: string, email: string) => {
    try {
      const userRef = doc(db, "users", uid);
      await setDoc(
        userRef,
        {
          email,
          createdAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (error: any) {
      console.error("Error creating user document:", error);
      setError("Failed to create user profile");
    }
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (passwordOne === passwordTwo) {
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          passwordOne
        );
        await createUserDocument(userCredential.user.uid, email);
        handleSuccessfulAuth();
      } catch (error: any) {
        setError(error.message);
      }
    } else {
      setError("Passwords do not match");
    }
  };

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await createUserDocument(result.user.uid, result.user.email!);
      handleSuccessfulAuth();
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-gray-800 p-8">
        <h2 className="text-center text-3xl font-bold text-white">Log In</h2>
        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="signUpEmail">Email</Label>
            <Input
              id="signUpEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signUpPassword">Password</Label>
            <Input
              id="signUpPassword"
              type="password"
              value={passwordOne}
              onChange={(e) => setPasswordOne(e.target.value)}
              placeholder="Password"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="signUpPassword2">Confirm Password</Label>
            <Input
              id="signUpPassword2"
              type="password"
              value={passwordTwo}
              onChange={(e) => setPasswordTwo(e.target.value)}
              placeholder="Confirm Password"
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Log In
          </Button>

          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-gray-800 px-2 text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              type="button"
              onClick={signInWithGoogle}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-white text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
