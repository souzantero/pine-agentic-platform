"use client";

import { Thread } from "@/components/thread";
import { StreamProvider } from "@/providers/Stream";
import { ThreadProvider } from "@/providers/Thread";
import { Toaster } from "@/components/ui/sonner";
import React, { useEffect } from "react";
import { useAuth } from "@/providers/Auth";
import { useRouter } from "next/navigation";

export default function DemoPage(): React.ReactNode {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/sign-in");
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  return (
    <React.Suspense fallback={<div>Carregando...</div>}>
      <Toaster />
      <ThreadProvider>
        <StreamProvider>
          <Thread />
        </StreamProvider>
      </ThreadProvider>
    </React.Suspense>
  );
}
