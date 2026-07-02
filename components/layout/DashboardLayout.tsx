"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Navbar } from "@/components/layout/Navbar";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col w-full bg-[#f8f9fa] font-sans">
      {/* Navbar di atas (Full Width) */}
      <Navbar />

      {/* Container untuk Sidebar dan Konten Utama */}
      <div className="flex flex-1 pt-16 w-full">
        <Sidebar />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-8 lg:ml-64 w-full overflow-x-hidden">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
