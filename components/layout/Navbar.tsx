"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Building2 } from "lucide-react";

export function Navbar() {
  const { role } = useAuth();

  // Mapping role ke label
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    organizer: "Penyelenggara",
    mahasiswa: "Mahasiswa",
  };

  const displayRole = role ? roleLabels[role] || role : "Penyelenggara";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between bg-white pl-14 pr-4 md:px-6 border-b border-gray-100 shadow-sm">
      
      {/* Kiri: Logo Cavent */}
      <div className="flex items-center gap-2">
        <div className="relative flex h-8 w-8 items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-primary" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
          </svg>
        </div>
        <div className="font-bold text-xl tracking-tight">
          <span className="text-primary">CA</span><span className="text-secondary">VENT</span>
        </div>
      </div>

      {/* Kanan: Role Info */}
      <div className="flex items-center gap-2 text-sm text-neutral font-medium bg-gray-50 px-3 py-1.5 rounded-md border border-gray-100">
        <Building2 className="h-4 w-4 text-primary" />
        <span>Mode: {displayRole}</span>
      </div>
    </header>
  );
}
