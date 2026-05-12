"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import toast from "react-hot-toast";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  Edit,
  Bell,
  QrCode,
  BarChart,
  Mic2,
  Users,
  Menu,
  X
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"masuk" | "daftar">("masuk");
  const [registerRole, setRegisterRole] = useState<"organizer" | "mahasiswa">("mahasiswa");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Dipakai untuk Nama Lengkap / Nama Organisasi

  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  // Jika sudah login, langsung arahkan ke dashboard
  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === "admin") router.push("/admin");
      else if (role === "organizer") router.push("/organizer");
      else router.push("/mahasiswa");
    }
  }, [user, role, isLoading, router]);

  // Fungsi validasi email Paramadina
  const validateParamadinaEmail = (emailToCheck: string) => {
    const isParamadina = emailToCheck.endsWith("@paramadina.ac.id");
    const isStudent = emailToCheck.endsWith("@students.paramadina.ac.id");
    const isSuperAdmin = emailToCheck === "miftahulfitriah143@gmail.com";
    return isParamadina || isStudent || isSuperAdmin;
  };

  // 1. Fungsi Login dengan Email/Password
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Harap isi email dan kata sandi!");
      return;
    }

    setIsProcessing(true);
    try {
      if (!validateParamadinaEmail(email)) {
        throw new Error("Gunakan email @paramadina.ac.id atau @students.paramadina.ac.id");
      }

      const result = await signInWithEmailAndPassword(auth, email, password);

      // Ambil role dari Firestore
      const userSnap = await getDoc(doc(db, "users", result.user.uid));
      let assignedRole = "mahasiswa";
      if (userSnap.exists()) {
        assignedRole = userSnap.data().role;
      }

      toast.success("Berhasil masuk!");
      if (assignedRole === "admin") router.push("/admin");
      else if (assignedRole === "organizer") router.push("/organizer");
      else router.push("/mahasiswa");

    } catch (error: any) {
      console.error("Login error:", error);
      // Pesan error ramah
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast.error("Email atau kata sandi salah.");
      } else {
        toast.error(error.message || "Gagal masuk. Silakan coba lagi.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Fungsi Daftar dengan Email/Password
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      toast.error("Harap lengkapi semua data!");
      return;
    }

    setIsProcessing(true);
    try {
      if (!validateParamadinaEmail(email)) {
        throw new Error("Pendaftaran wajib menggunakan email institusi Paramadina.");
      }

      // Buat akun di Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Update Display Name di Firebase Auth Profile
      await updateProfile(result.user, { displayName: fullName });

      // Simpan data lengkap ke Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: fullName,
        photoURL: "",
        role: registerRole, // Sesuai pilihan di form
        createdAt: serverTimestamp(),
      });

      toast.success("Pendaftaran berhasil!");

      if (registerRole === "organizer") router.push("/organizer");
      else router.push("/mahasiswa");

    } catch (error: any) {
      console.error("Register error:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Email ini sudah terdaftar. Silakan login.");
      } else if (error.code === 'auth/weak-password') {
        toast.error("Kata sandi terlalu lemah (minimal 6 karakter).");
      } else {
        toast.error(error.message || "Gagal mendaftar. Silakan coba lagi.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. Fungsi Google Auth (Bisa untuk Daftar & Masuk)
  const handleGoogleAuth = async () => {
    setIsProcessing(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const currentUser = result.user;
      const userEmail = currentUser.email || "";

      if (!validateParamadinaEmail(userEmail)) {
        await auth.signOut();
        toast.error("Akses ditolak! Gunakan email @paramadina.ac.id atau @students.paramadina.ac.id", { duration: 5000 });
        setIsProcessing(false);
        return;
      }

      // Cek apakah user sudah ada di Firestore
      const userRef = doc(db, "users", currentUser.uid);
      const userSnap = await getDoc(userRef);

      let assignedRole = "mahasiswa";

      // Jika belum ada, ini berarti PENDAFTARAN BARU via Google
      if (!userSnap.exists()) {
        // Tentukan role: Jika user menekan tombol di tab 'Daftar', gunakan pilihan rolenya
        // Jika dia menekan dari tab 'Masuk', default ke mahasiswa, kecuali email admin
        if (activeTab === "daftar") {
          assignedRole = registerRole;
        } else {
          // Fallback logika lama
          const isParamadina = userEmail.endsWith("@paramadina.ac.id");
          if (userEmail === "miftahulfitriah143@gmail.com" || isParamadina) {
            assignedRole = "admin";
          }
        }

        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "Pengguna",
          photoURL: currentUser.photoURL || "",
          role: assignedRole,
          createdAt: serverTimestamp(),
        });
        toast.success("Pendaftaran dengan Google berhasil!");
      } else {
        // Jika sudah ada, ini berarti LOGIN via Google
        assignedRole = userSnap.data().role;
        toast.success("Berhasil masuk!");
      }

      if (assignedRole === "admin") router.push("/admin");
      else if (assignedRole === "organizer") router.push("/organizer");
      else router.push("/mahasiswa");

    } catch (error: any) {
      console.error("Google Auth error:", error);
      toast.error(error.message || "Gagal autentikasi dengan Google.");
      setIsProcessing(false);
    }
  };

  if (isLoading || (user && role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-app">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background-app font-sans">

      {/* Top Navbar - Floating Pill Design */}
      <div className="fixed top-0 w-full z-50 flex flex-col items-center pt-4 md:pt-6 px-4 md:px-6">
        <header className="w-full max-w-7xl bg-white/95 backdrop-blur-md rounded-full px-4 py-2 md:px-6 md:py-3 shadow-sm flex items-center justify-between relative">
          
          {/* Bagian Kiri: Menu & Logo */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-1.5 -ml-1.5 text-primary rounded-full hover:bg-gray-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Logo Icon (Hexagon placeholder) */}
            <div className="relative flex h-6 w-6 md:h-8 md:w-8 items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="h-full w-full text-primary" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z" />
                <circle cx="12" cy="12" r="3" fill="currentColor" />
              </svg>
            </div>
            {/* Logo Text */}
            <div className="font-bold text-lg md:text-xl tracking-tight">
              <span className="text-primary">CA</span><span className="text-secondary">VENT</span>
            </div>
          </div>
          
          {/* Navigation Links - Tengah */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-neutral">
            <Link href="/" className="hover:text-primary transition-colors">Beranda</Link>
            <Link href="/" className="hover:text-primary transition-colors">Acara</Link>
            <Link href="/" className="hover:text-primary transition-colors">Tentang</Link>
            <Link href="/" className="hover:text-primary transition-colors">Kontak</Link>
          </nav>

          {/* Buttons Kanan */}
          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={() => setActiveTab("masuk")}
              className={`px-3 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-semibold transition-all ${
                activeTab === "masuk" 
                  ? "border border-primary text-primary bg-primary-50" 
                  : "border border-primary/30 text-primary hover:border-primary hover:bg-primary-50"
              }`}
            >
              Masuk
            </button>
            <button 
              onClick={() => setActiveTab("daftar")}
              className="px-4 py-1.5 md:px-6 md:py-2 rounded-full text-xs md:text-sm font-semibold bg-primary text-white shadow-sm hover:bg-[#0e517a] transition-colors"
            >
              Daftar
            </button>
          </div>
        </header>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="w-full max-w-7xl mt-2 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg md:hidden flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
            <Link href="/" className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Beranda</Link>
            <Link href="/" className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Acara</Link>
            <Link href="/" className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Tentang</Link>
            <Link href="/" className="font-semibold text-neutral hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">Kontak</Link>
          </div>
        )}
      </div>

      {/* Main Container - Fullscreen Background Gradient */}
      <main className="flex-1 flex items-start justify-center p-4 pt-28 md:pt-[120px] md:pb-12 md:px-[199px] bg-gradient-to-br from-[#0a2540] via-primary to-secondary min-h-screen">

        {/* Card Wrapper (Split Screen) */}
        <div className="flex w-full h-full max-w-7xl flex-col md:flex-row bg-white rounded-2xl shadow-2xl overflow-hidden min-h-[500px] md:min-h-[600px]">

          {/* Left Panel: Information - HIDDEN ON MOBILE */}
          <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-primary to-secondary p-10 pt-16 flex-col justify-start text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 font-bold text-2xl tracking-tight mb-8">
                <span>CA<span className="text-accent">VENT</span></span>
              </div>

              <h1 className="text-3xl font-bold leading-tight mb-4">
                Selamat Datang di<br />Platform Acara Kampus
              </h1>

              <p className="text-white/80 text-sm mb-10 leading-relaxed">
                With Cavent, all campus events are at your fingertips! Search, discover and experience the fun of being part of every event you love.
              </p>

              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Edit className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-sm">Buat & Kelola Acara</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-sm">Notifikasi Acara</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <QrCode className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-sm">QR Code Check-in</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <BarChart className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-medium text-sm">Dashboard</span>
                </div>
              </div>
            </div>

            {/* Dekorasi lingkaran samar di background kiri */}
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
            <div className="absolute top-10 -right-20 w-48 h-48 bg-white/10 rounded-full blur-2xl"></div>
          </div>

          {/* Right Panel: Form Area */}
          <div className="md:w-[55%] p-10 flex flex-col bg-card relative">

            {/* Tab Switcher (Masuk / Daftar) dengan Animasi Slider */}
            <div className="relative flex w-full rounded-lg bg-neutral-100 p-1 mb-8">
              {/* Background Putih yang menggeser (Slider) */}
              <div
                className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-md bg-white shadow-sm transition-transform duration-300 ease-in-out ${activeTab === "masuk" ? "translate-x-0" : "translate-x-full"
                  }`}
              ></div>

              <button
                onClick={() => setActiveTab("masuk")}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 ${activeTab === "masuk" ? "text-dark" : "text-neutral hover:text-dark"
                  }`}
              >
                Masuk
              </button>
              <button
                onClick={() => setActiveTab("daftar")}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 ${activeTab === "daftar" ? "text-dark" : "text-neutral hover:text-dark"
                  }`}
              >
                Daftar
              </button>
            </div>

            {/* FORM CONTENT */}
            {/* Menggunakan justify-start agar menempel di atas */}
            <div className="flex-1 flex flex-col justify-start">

              {/* === TAB: MASUK === */}
              {activeTab === "masuk" && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-forwards">
                  <h2 className="text-2xl font-bold text-dark mb-1">Masuk ke Akun Anda</h2>
                  <p className="text-sm text-neutral mb-8">Akses dashboard dan kelola acara anda</p>

                  <form onSubmit={handleEmailLogin} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1.5">Email Institusi</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="miftahul.fitriah@students.paramadina.ac.id"
                        className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1.5">Kata Sandi</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-md border border-gray-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                        <span className="text-xs font-medium text-dark">Ingat saya</span>
                      </label>
                      <a href="#" className="text-xs font-medium text-primary hover:underline transition-colors">Lupa sandi?</a>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f527c] hover:shadow-md hover:shadow-primary/20 disabled:opacity-70 mt-4"
                    >
                      {isProcessing ? "Memproses..." : "Masuk"}
                    </button>
                  </form>
                </div>
              )}

              {/* === TAB: DAFTAR === */}
              {activeTab === "daftar" && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500 fill-mode-forwards">
                  <h2 className="text-2xl font-bold text-dark mb-1">Buat Akun Baru</h2>
                  <p className="text-sm text-neutral mb-6">Pilih peran anda di platform CAVENT</p>

                  {/* Role Selector */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      type="button"
                      onClick={() => setRegisterRole("organizer")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${registerRole === "organizer"
                          ? "border-primary bg-primary-50 text-primary shadow-sm scale-[1.02]"
                          : "border-gray-100 bg-white text-neutral hover:border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <Mic2 className={`h-6 w-6 mb-2 transition-colors ${registerRole === "organizer" ? "text-primary" : "text-neutral"}`} />
                      <span className="text-sm font-bold">Penyelenggara</span>
                      <span className="text-[10px] opacity-80 mt-1">Buat & kelola acara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegisterRole("mahasiswa")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${registerRole === "mahasiswa"
                          ? "border-primary bg-primary-50 text-primary shadow-sm scale-[1.02]"
                          : "border-gray-100 bg-white text-neutral hover:border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <Users className={`h-6 w-6 mb-2 transition-colors ${registerRole === "mahasiswa" ? "text-primary" : "text-neutral"}`} />
                      <span className="text-sm font-bold">Audiens</span>
                      <span className="text-[10px] opacity-80 mt-1">Daftar & ikuti acara</span>
                    </button>
                  </div>

                  <form onSubmit={handleEmailRegister} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1.5 transition-all">
                        {registerRole === "organizer" ? "Nama Organisasi / Unit Kerja" : "Nama Lengkap"}
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={registerRole === "organizer" ? "HIMTI" : "Budi Santoso"}
                        className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1.5">Email Institusi</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={registerRole === "organizer" ? "himti@paramadina.ac.id" : "budi@students.paramadina.ac.id"}
                        className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1.5">Kata Sandi</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-md border border-gray-200 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        required
                        minLength={6}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f527c] hover:shadow-md hover:shadow-primary/20 disabled:opacity-70 mt-4"
                    >
                      {isProcessing ? "Memproses..." : "Daftar"}
                    </button>
                  </form>
                </div>
              )}
            </div>

            <div className="mt-8">
              {/* Divider */}
              <div className="relative mb-6 mt-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-4 text-neutral transition-all">atau {activeTab === "masuk" ? "masuk" : "daftar"} dengan</span>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-gray-50 disabled:opacity-70"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {activeTab === "masuk" ? "Masuk" : "Daftar"} dengan Google
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
