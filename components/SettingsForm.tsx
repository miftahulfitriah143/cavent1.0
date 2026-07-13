"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { Save, User, Lock, Mail, Building2, Eye, EyeOff, Camera } from "lucide-react";
import toast from "react-hot-toast";

export function SettingsForm() {
  const { user, role } = useAuth();
  
  const [profileData, setProfileData] = useState({
    displayName: "",
    orgDescription: "",
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        setProfileData({
          displayName: data.displayName || user.displayName || "",
          orgDescription: data.orgDescription || "",
        });
      }
    };
    fetchProfile();
  }, [user]);

  if (!user) return null;

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: profileData.displayName,
        ...(role === "organizer" && { orgDescription: profileData.orgDescription })
      });
      toast.success("Profil berhasil diperbarui");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menyimpan profil");
    }
    setIsSavingProfile(false);
  };

  const handleSavePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Kata sandi baru tidak cocok");
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter");
      return;
    }

    setIsSavingPassword(true);
    try {
      // Re-authenticate
      const credential = EmailAuthProvider.credential(user.email!, passwordData.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordData.newPassword);
      toast.success("Kata sandi berhasil diperbarui");
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/invalid-credential') {
        toast.error("Kata sandi saat ini salah");
      } else {
        toast.error("Gagal mengubah kata sandi");
      }
    }
    setIsSavingPassword(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Profil Section */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <User className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">Profil Akun</h2>
            <p className="text-sm text-neutral">Kelola informasi publik Anda</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Avatar (Static for now) */}
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 rounded-full bg-gray-100 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center relative group shrink-0">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-400">{profileData.displayName.charAt(0) || "U"}</span>
              )}
              {/* Optional overlay placeholder */}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-not-allowed">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-dark text-lg">{profileData.displayName || "Pengguna"}</h3>
              <p className="text-xs font-bold text-primary uppercase tracking-wider px-3 py-1 bg-primary/10 rounded-full inline-block mt-1">
                {role === "admin" ? "Administrator" : "Penyelenggara"}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Email Institusi</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="email" 
                value={user.email || ""} 
                disabled 
                className="w-full bg-gray-50 border border-gray-200 text-gray-500 rounded-lg pl-10 pr-4 py-2.5 text-sm cursor-not-allowed font-medium"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 font-medium">*Email tidak dapat diubah karena terikat pada institusi.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nama {role === "organizer" ? "Penyelenggara" : "Lengkap"}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input 
                type="text" 
                value={profileData.displayName} 
                onChange={e => setProfileData({...profileData, displayName: e.target.value})}
                className="w-full bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark font-medium transition-all"
                placeholder="Masukkan nama"
              />
            </div>
          </div>

          {role === "organizer" && (
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Deskripsi Organisasi</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <textarea 
                  rows={3}
                  value={profileData.orgDescription} 
                  onChange={e => setProfileData({...profileData, orgDescription: e.target.value})}
                  className="w-full bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg pl-10 pr-4 py-2.5 text-sm text-dark font-medium transition-all resize-none"
                  placeholder="Ceritakan singkat tentang organisasi Anda..."
                />
              </div>
            </div>
          )}

          <button 
            onClick={handleSaveProfile}
            disabled={isSavingProfile || !profileData.displayName}
            className="w-full bg-primary hover:bg-primary-600 text-white font-bold py-3 rounded-lg text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isSavingProfile ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Simpan Profil
          </button>
        </div>
      </div>

      {/* Security Section */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 shadow-sm h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <Lock className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark">Keamanan Akun</h2>
            <p className="text-sm text-neutral">Perbarui kata sandi akun Anda</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Kata Sandi Saat Ini</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={passwordData.currentPassword} 
                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg px-4 py-2.5 text-sm font-medium text-dark transition-all"
                placeholder="••••••••"
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Kata Sandi Baru</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={passwordData.newPassword} 
                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg px-4 py-2.5 text-sm font-medium text-dark transition-all"
                placeholder="Min. 6 karakter"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Konfirmasi Kata Sandi Baru</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={passwordData.confirmPassword} 
                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full bg-white border border-gray-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary rounded-lg px-4 py-2.5 text-sm font-medium text-dark transition-all"
                placeholder="Ulangi kata sandi baru"
              />
            </div>
          </div>

          <button 
            onClick={handleSavePassword}
            disabled={isSavingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            className="w-full bg-dark hover:bg-black text-white font-bold py-3 rounded-lg text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {isSavingPassword ? (
              <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock className="h-4 w-4" />
            )}
            Perbarui Kata Sandi
          </button>
        </div>
      </div>
    </div>
  );
}
