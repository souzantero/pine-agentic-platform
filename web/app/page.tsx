"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotChat } from "@copilotkit/react-core/v2";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export default function Home() {
  const router = useRouter();
  const supabaseRef = useRef<SupabaseClient | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const getSupabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = createClient();
    }
    return supabaseRef.current;
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = getSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <CopilotKit runtimeUrl="/api/copilotkit" agent="agent">
      <main className="relative min-h-screen">
        <div className="absolute top-4 right-4 z-10">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={loggingOut}>
                {loggingOut ? "Saindo..." : "Sair"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Deseja sair?</AlertDialogTitle>
                <AlertDialogDescription>
                  Você será desconectado da sua conta e redirecionado para a página de login.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Sair
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        <CopilotChat />
      </main>
    </CopilotKit>
  );
}
