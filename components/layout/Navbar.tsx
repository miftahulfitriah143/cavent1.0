"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { Building2 } from "lucide-react";
import Image from "next/image";

export function Navbar() {
  const { role } = useAuth();

  // Mapping role ke label
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    organizer: "Penyelenggara",
    audiens: "Audiens",
  };

  const displayRole = role ? roleLabels[role] || role : "Penyelenggara";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-between bg-white/70 backdrop-blur-xl pl-14 pr-4 md:px-6 border-b border-white/50 shadow-sm">

      {/* Kiri: Logo Cavent */}
      <div className="flex items-center">
        <div className="relative h-5 w-28 md:h-7 md:w-32">
          <Image src="/CAVENT5.svg" alt="Cavent Logo" fill className="object-contain object-left" priority />
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
