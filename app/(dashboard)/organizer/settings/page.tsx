"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { SettingsForm } from "@/components/SettingsForm";

export default function OrganizerSettingsPage() {
  const { role } = useAuth();

  if (role !== "organizer") {
    return <div className="p-8 text-center font-bold text-red-500">Akses Ditolak. Anda bukan Penyelenggara.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto pb-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-dark tracking-tight">Pengaturan</h1>
        <p className="text-neutral text-sm mt-1 font-medium">Kelola profil organisasi dan keamanan akun Anda.</p>
      </div>

      <SettingsForm />
    </div>
  );
}
