import { DashboardLayout } from "@/components/layout/DashboardLayout";

export default function GlobalDashboardLayout({ children }: { children: React.ReactNode }) {
  // Komponen ini akan secara otomatis membungkus semua route di dalam (dashboard)
  // Termasuk /admin, /organizer, dan /mahasiswa
  return <DashboardLayout>{children}</DashboardLayout>;
}
