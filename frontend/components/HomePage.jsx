"use client";

import PageLoader from "@/components/PageLoader";
import {
  ClerkProvider,
  Show,
  SignInButton,
  SignUpButton,
  useAuth,
  UserButton,
} from "@clerk/nextjs";
export default function Home() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <PageLoader />;
  }

  return <div className="p-5"></div>;
}
