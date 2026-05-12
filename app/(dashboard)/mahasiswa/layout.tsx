import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["mahasiswa", "admin"]}>
      {children}
    </ProtectedRoute>
  );
}
