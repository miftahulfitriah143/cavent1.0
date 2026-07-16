"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { Clock, LogOut } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function PendingApprovalPage() {
  const { user, role, isApproved, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login");
      } else if (isApproved) {
        if (role === "admin") router.push("/admin");
        else if (role === "organizer") router.push("/organizer");
        else router.push("/");
      }
    }
  }, [user, role, isApproved, isLoading, router]);

  if (isLoading || isApproved || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-app">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background-app font-sans">
      <PublicNavbar />
      
      <main className="flex-1 flex items-center justify-center p-4 pt-28 bg-gradient-to-br from-[#0a2540] via-primary to-secondary">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
          <div className="bg-gradient-to-br from-amber-400 to-amber-600 p-8 text-center relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm mb-4 animate-pulse">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-2xl font-black text-white mb-2">Menunggu Persetujuan</h1>
              <p className="text-white/80 text-sm font-medium">Akun Penyelenggara Anda sedang ditinjau.</p>
            </div>
            {/* Background Decorations */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          </div>
          
          <div className="p-8 text-center">
            <p className="text-neutral text-sm leading-relaxed mb-8 font-medium">
              Terima kasih telah mendaftar sebagai Penyelenggara di platform CAVENT. 
              Admin kami sedang memverifikasi akun Anda untuk memastikan keamanan dan validitas.
              <br /><br />
              Silakan periksa kembali secara berkala, atau hubungi pihak kampus jika membutuhkan proses yang lebih cepat.
            </p>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-red-50 text-neutral hover:text-red-600 py-4 rounded-xl text-sm font-bold transition-all border border-gray-100 hover:border-red-100"
            >
              <LogOut className="h-4 w-4" /> Keluar
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
