"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";
import { Loader2 } from "lucide-react";

export default function GlobalDashboardLayout({ children }: { children: React.ReactNode }) {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  // Jika Audiens: Tampilan Bersih (tanpa sidebar)
  if (role === "audiens") {
    return (
      <div className="min-h-screen flex flex-col bg-[#f8f9fa]">
        <PublicNavbar />
        <main className="flex-1 pt-28 pb-16">
          <div className="mx-auto max-w-7xl px-4 md:px-6 w-full">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Jika Admin/Organizer: Layout Dashboard Standar (dengan sidebar)
  return <DashboardLayout>{children}</DashboardLayout>;
}
