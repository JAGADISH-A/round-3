"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Sidebar from "@/components/chat/Sidebar";
import { ConnectivityGuard } from "@/components/chat/ConnectivityGuard";
import ThirukuralPopup from "@/components/ui/ThirukuralPopup";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex h-screen bg-black overflow-hidden relative">
      <Sidebar />
      <main className="flex-1 h-full overflow-hidden relative transition-all duration-500 ease-in-out">
        {children}
      </main>
      <ThirukuralPopup />
      <ConnectivityGuard />
    </div>
  );
}
