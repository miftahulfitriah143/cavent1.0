"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import Link from "next/link";
import { 
  User, 
  CalendarDays, 
  Star, 
  LogOut, 
  LayoutDashboard,
  ChevronDown
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function UserNav() {
  const { user, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) return null;

  const roleLabels: Record<string, string> = {
    admin: "Administrator",
    organizer: "Penyelenggara",
    audiens: "Audiens",
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors group"
      >
        <div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-primary-900 border-2 border-white shadow-sm flex items-center justify-center text-white overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt={user.displayName || ""} className="h-full w-full object-cover" />
          ) : (
            <User className="h-5 w-5" />
          )}
        </div>
        <ChevronDown className={`hidden md:block h-4 w-4 text-neutral transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in duration-200">
          <div className="px-4 py-3 border-b border-gray-50 mb-1">
            <p className="text-sm font-bold text-dark truncate">{user.displayName || "User"}</p>
            <p className="text-[10px] font-medium text-primary uppercase tracking-wider mt-0.5">
              {roleLabels[role || "audiens"]}
            </p>
          </div>

          <div className="py-1">
            {/* Link Dashboard Khusus Admin/Organizer */}
            {(role === 'admin' || role === 'organizer') && (
              <Link 
                href={`/${role}`} 
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:text-primary hover:bg-primary-50 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                <LayoutDashboard className="h-4 w-4" />
                Panel Dashboard
              </Link>
            )}

            {/* Link Khusus Audiens / Umum */}
            <Link 
              href="/audiens/profile" 
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:text-primary hover:bg-primary-50 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              Profil Saya
            </Link>

            {role === 'audiens' && (
              <>
                <Link 
                  href="/audiens/my-events" 
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:text-primary hover:bg-primary-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <CalendarDays className="h-4 w-4" />
                  Acara Saya
                </Link>
                <Link 
                  href="/audiens/ratings" 
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-neutral hover:text-primary hover:bg-primary-50 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <Star className="h-4 w-4" />
                  Ulasan & Rating
                </Link>
              </>
            )}
          </div>

          <div className="mt-1 pt-1 border-t border-gray-50">
            <button 
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 w-full text-left transition-colors font-medium"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
