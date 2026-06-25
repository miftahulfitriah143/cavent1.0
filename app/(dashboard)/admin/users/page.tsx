"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, doc, updateDoc, query } from "firebase/firestore";
import { useAuth } from "@/components/providers/AuthProvider";
import { Search, UserCog, ShieldAlert, CheckCircle2, XCircle, SearchX } from "lucide-react";
import toast from "react-hot-toast";

export default function UsersManagementPage() {
  const { user, role } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user || role !== "admin") return;

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
      setIsLoading(false);
    }, (error) => {
      console.error("Gagal mengambil data users:", error);
      toast.error("Gagal memuat daftar pengguna.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, role]);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    // Jangan izinkan ubah role admin
    if (currentRole === "admin") {
      toast.error("Tidak dapat mengubah role Admin utama.");
      return;
    }

    const newRole = currentRole === "organizer" ? "mahasiswa" : "organizer";
    
    if (!window.confirm(`Apakah Anda yakin ingin mengubah role akun ini menjadi ${newRole.toUpperCase()}?`)) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        role: newRole
      });
      toast.success(`Role berhasil diubah menjadi ${newRole}`);
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Gagal mengubah role pengguna.");
    }
  };

  const handleToggleActive = async (userId: string, currentIsActive: boolean, userRole: string) => {
    if (userRole === "admin") {
      toast.error("Tidak dapat menonaktifkan akun Admin utama.");
      return;
    }

    // Default isActive adalah true jika undefined
    const isCurrentlyActive = currentIsActive !== false;
    const newIsActive = !isCurrentlyActive;
    
    const actionText = newIsActive ? "mengaktifkan" : "menonaktifkan";
    if (!window.confirm(`Apakah Anda yakin ingin ${actionText} akun ini?`)) return;

    try {
      await updateDoc(doc(db, "users", userId), {
        isActive: newIsActive
      });
      toast.success(`Akun berhasil ${newIsActive ? 'diaktifkan' : 'dinonaktifkan'}.`);
    } catch (error) {
      console.error("Error toggling active status:", error);
      toast.error(`Gagal ${actionText} akun.`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const email = (u.email || "").toLowerCase();
    const name = (u.displayName || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return email.includes(search) || name.includes(search);
  });

  if (role !== "admin") {
    return <div className="p-8 text-center font-bold text-red-500">Akses Ditolak. Anda bukan Admin.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-10">
        <h1 className="text-4xl font-black text-dark tracking-tight mb-2">Manajemen Akun</h1>
        <p className="text-neutral text-sm">Kelola pengguna, tetapkan role Penyelenggara, dan aktifkan/nonaktifkan akun.</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral/50" />
          <input 
            type="text" 
            placeholder="Cari berdasarkan nama atau email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border border-transparent rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all"
          />
        </div>
        <div className="text-sm font-bold text-neutral">
          Total Pengguna: <span className="text-primary">{filteredUsers.length}</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
            <p className="text-sm font-bold text-neutral">Memuat data pengguna...</p>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-neutral uppercase tracking-wider">
                  <th className="p-5">Pengguna</th>
                  <th className="p-5">Role</th>
                  <th className="p-5">Status Akun</th>
                  <th className="p-5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const roleName = u.role || "mahasiswa";
                  const isDeactivated = u.isActive === false;
                  
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-5">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {u.photoURL ? (
                              <img src={u.photoURL} alt={u.displayName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold text-lg">
                                {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-dark text-sm">{u.displayName || "Tanpa Nama"}</p>
                            <p className="text-xs text-neutral">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5">
                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          roleName === "admin" 
                            ? "bg-purple-100 text-purple-700" 
                            : roleName === "organizer" 
                              ? "bg-blue-100 text-blue-700" 
                              : "bg-gray-100 text-gray-700"
                        }`}>
                          {roleName}
                        </span>
                      </td>
                      <td className="p-5">
                        {isDeactivated ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
                            <XCircle className="h-4 w-4" /> Nonaktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-bold">
                            <CheckCircle2 className="h-4 w-4" /> Aktif
                          </span>
                        )}
                      </td>
                      <td className="p-5">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRoleChange(u.id, roleName)}
                            disabled={roleName === "admin"}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                              roleName === "admin" 
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                                : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                            }`}
                            title="Ubah Role"
                          >
                            Ubah Role
                          </button>
                          
                          <button
                            onClick={() => handleToggleActive(u.id, u.isActive, roleName)}
                            disabled={roleName === "admin"}
                            className={`p-2 rounded-lg transition-colors ${
                              roleName === "admin"
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : isDeactivated
                                  ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white"
                                  : "bg-red-100 text-red-700 hover:bg-red-600 hover:text-white"
                            }`}
                            title={isDeactivated ? "Aktifkan Akun" : "Nonaktifkan Akun"}
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <SearchX className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-bold text-dark mb-1">Pengguna tidak ditemukan</h3>
            <p className="text-sm text-neutral">Coba gunakan kata kunci pencarian yang lain.</p>
          </div>
        )}
      </div>
    </div>
  );
}
