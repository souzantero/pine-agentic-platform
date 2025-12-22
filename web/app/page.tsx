"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-core/v2";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function Home() {
  const router = useRouter();
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  const handleLogout = async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="agent">
      <main className="relative min-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
        <CopilotChat />
      </main>
    </CopilotKit>
  );
}
