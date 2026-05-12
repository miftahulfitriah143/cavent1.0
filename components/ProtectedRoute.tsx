"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Jika belum login, tendang ke halaman login
        router.push("/login");
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Jika sudah login tapi role-nya tidak diizinkan untuk halaman ini
        // Arahkan ke dashboard masing-masing sesuai role-nya
        if (role === "admin") router.push("/admin");
        else if (role === "organizer") router.push("/organizer");
        else router.push("/mahasiswa");
      }
    }
  }, [user, role, isLoading, router, allowedRoles]);

  // Tampilkan layar loading saat memverifikasi status auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  // Jika tidak punya akses (sedang dalam proses redirect), cegah render children
  if (!user || (allowedRoles && role && !allowedRoles.includes(role))) {
    return null;
  }

  return <>{children}</>;
}
