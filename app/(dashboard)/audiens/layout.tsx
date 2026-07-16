import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MahasiswaLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["audiens", "admin"]}>
      {children}
    </ProtectedRoute>
  );
}
