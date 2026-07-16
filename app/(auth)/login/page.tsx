"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendEmailVerification
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
  X,
  Eye,
  EyeOff
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"masuk" | "daftar">("masuk");
  const [registerRole, setRegisterRole] = useState<"organizer" | "audiens">("audiens");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  // Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState(""); // Dipakai untuk Nama Lengkap / Nama Organisasi
  const [showPassword, setShowPassword] = useState(false);

  // Deteksi domain email reaktif untuk audiens & dosen/HIMA
  const isStudentEmail = email.toLowerCase().trim().endsWith("@students.paramadina.ac.id");
  const isParamadinaEmail = email.toLowerCase().trim().endsWith("@paramadina.ac.id");

  useEffect(() => {
    if (activeTab === "daftar" && isStudentEmail) {
      setRegisterRole("audiens");
    }
  }, [email, activeTab, isStudentEmail]);

  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  // Jika sudah login, langsung arahkan ke dashboard
  useEffect(() => {
    if (!isLoading && user && role) {
      if (role === "admin") router.push("/admin");
      else if (role === "organizer") router.push("/organizer");
      else router.push("/"); // Audiens diarahkan ke Beranda
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

      // PROTEKSI: Cek verifikasi email (kecuali akun superadmin/developer dan email dummy penyelenggara)
      const isBypassed = result.user.email === "miftahulfitriah143@gmail.com" ||
        result.user.email === "mita@paramadina.ac.id" ||
        result.user.email === "testing@paramadina.ac.id" ||
        result.user.email === "dummy@students.paramadina.ac.id";
      if (!result.user.emailVerified && !isBypassed) {
        await auth.signOut();
        toast.error("Email Anda belum terverifikasi! Harap verifikasi email Anda terlebih dahulu.");
        setIsProcessing(false);
        return;
      }

      // Ambil role dari Firestore
      const userRef = doc(db, "users", result.user.uid);
      const userSnap = await getDoc(userRef);
      let assignedRole = "audiens";
      let isApproved = true;
      if (userSnap.exists()) {
        const userData = userSnap.data();
        assignedRole = userData.role;
        isApproved = userData.isApproved !== false;

        // SINKRONISASI STATUS VERIFIKASI: Update ke true jika sebelumnya masih false/belum ada
        if (!userData.emailVerified) {
          await setDoc(userRef, { emailVerified: true }, { merge: true });
        }
      }

      toast.success("Berhasil masuk!");
      if (assignedRole === "admin") {
        router.push("/admin");
      } else if (assignedRole === "organizer") {
        if (!isApproved) {
          router.push("/pending-approval");
        } else {
          router.push("/organizer");
        }
      } else {
        router.push("/");
      }

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
        isApproved: registerRole === "organizer" ? false : true, // Penyelenggara butuh approval
        emailVerified: false, // Ditandai sebagai belum terverifikasi
        createdAt: serverTimestamp(),
      });

      // Kirim email verifikasi
      await sendEmailVerification(result.user);

      // Simpan email yang didaftarkan untuk modal
      setRegisteredEmail(email);

      // Sign out agar tidak langsung ter-login dalam keadaan belum diverifikasi
      await auth.signOut();

      // Reset form fields
      setEmail("");
      setPassword("");
      setFullName("");

      // Buka modal verifikasi dan alihkan ke tab masuk
      setShowVerificationModal(true);
      setActiveTab("masuk");

      toast.success("Pendaftaran berhasil! Silakan verifikasi email Anda.");

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

      let assignedRole = "audiens";
      let isApproved = true;

      // Jika belum ada, ini berarti PENDAFTARAN BARU via Google
      if (!userSnap.exists()) {
        if (activeTab === "masuk" && userEmail !== "miftahulfitriah143@gmail.com") {
          // Tolak akses jika mencoba masuk tapi akun belum terdaftar
          await auth.signOut();
          toast.error("Akun belum terdaftar. Silakan ke tab 'Daftar' terlebih dahulu untuk memilih peran Anda.", { duration: 6000 });
          setActiveTab("daftar"); // Arahkan otomatis ke tab daftar
          setIsProcessing(false);
          return;
        }

        // Tentukan role untuk yang mendaftar dari tab 'Daftar' atau superadmin
        if (activeTab === "daftar") {
          // PROTEKSI: Audiens dengan email @students.paramadina.ac.id dipaksa role audiens
          const isStudent = userEmail.toLowerCase().trim().endsWith("@students.paramadina.ac.id");
          assignedRole = isStudent ? "audiens" : registerRole;
        } else if (userEmail === "miftahulfitriah143@gmail.com") {
          assignedRole = "admin";
        }
        
        isApproved = assignedRole === "organizer" ? false : true;

        await setDoc(userRef, {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || "Pengguna",
          photoURL: currentUser.photoURL || "",
          role: assignedRole,
          isApproved: isApproved,
          emailVerified: true, // Google login otomatis terverifikasi
          createdAt: serverTimestamp(),
        });
        toast.success("Pendaftaran dengan Google berhasil!");
      } else {
        // Jika sudah ada, ini berarti LOGIN via Google
        const userData = userSnap.data();
        assignedRole = userData.role;
        isApproved = userData.isApproved !== false;

        // SINKRONISASI STATUS VERIFIKASI: Pastikan ter-update ke true di Firestore
        if (!userData.emailVerified) {
          await setDoc(userRef, { emailVerified: true }, { merge: true });
        }
        toast.success("Berhasil masuk!");
      }

      if (assignedRole === "admin") {
        router.push("/admin");
      } else if (assignedRole === "organizer") {
        if (!isApproved) {
          router.push("/pending-approval");
        } else {
          router.push("/organizer");
        }
      } else {
        router.push("/");
      }

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

      {/* Top Navbar - Menggunakan komponen PublicNavbar yang sama dengan Beranda */}
      <PublicNavbar />

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
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 cursor-pointer ${activeTab === "masuk" ? "text-dark" : "text-neutral hover:text-dark"
                  }`}
              >
                Masuk
              </button>
              <button
                onClick={() => setActiveTab("daftar")}
                className={`relative z-10 flex-1 py-2 text-sm font-semibold transition-colors duration-300 cursor-pointer ${activeTab === "daftar" ? "text-dark" : "text-neutral hover:text-dark"
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
                        className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1.5">Kata Sandi</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-md border border-gray-200 bg-white px-4 py-2.5 pr-10 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-dark transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
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
                      className="w-full cursor-pointer rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f527c] hover:shadow-md hover:shadow-primary/20 disabled:opacity-70 mt-4"
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
                      disabled={isStudentEmail}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 ${registerRole === "organizer"
                        ? "border-primary bg-primary-50 text-primary shadow-sm scale-[1.02]"
                        : "border-gray-100 bg-white text-neutral hover:border-gray-200 hover:bg-gray-50"
                        } ${isStudentEmail ? "opacity-40 cursor-not-allowed border-gray-100" : "cursor-pointer"}`}
                    >
                      <Mic2 className={`h-6 w-6 mb-2 transition-colors ${registerRole === "organizer" ? "text-primary" : "text-neutral"}`} />
                      <span className="text-sm font-bold">Penyelenggara</span>
                      <span className="text-[10px] opacity-80 mt-1">Buat & kelola acara</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRegisterRole("audiens")}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer ${registerRole === "audiens"
                        ? "border-primary bg-primary-50 text-primary shadow-sm scale-[1.02]"
                        : "border-gray-100 bg-white text-neutral hover:border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      <Users className={`h-6 w-6 mb-2 transition-colors ${registerRole === "audiens" ? "text-primary" : "text-neutral"}`} />
                      <span className="text-sm font-bold">Audiens</span>
                      <span className="text-[10px] opacity-80 mt-1">Daftar & ikuti acara</span>
                    </button>
                  </div>

                  {/* Reactive warning descriptions based on email input */}
                  {isStudentEmail && (
                    <div className="text-[11px] text-[#0e517a] bg-blue-50/50 border border-blue-100/50 rounded-xl p-3 mb-6 font-semibold animate-in fade-in slide-in-from-top-1 duration-300 flex items-start gap-2">
                      <span className="text-xs">💡</span>
                      <span>Email student (<strong>@students.paramadina.ac.id</strong>) otomatis dikunci sebagai peran <strong>Audiens</strong>.</span>
                    </div>
                  )}
                  {isParamadinaEmail && (
                    <div className="text-[11px] text-[#854d0e] bg-amber-50/50 border border-amber-100/50 rounded-xl p-3 mb-6 font-semibold animate-in fade-in slide-in-from-top-1 duration-300 flex items-start gap-2">
                      <span className="text-xs">ℹ️</span>
                      <span>Email @paramadina.ac.id terdeteksi. Silakan pilih peran <strong>Audiens</strong> (untuk Dosen/Staf) atau <strong>Penyelenggara</strong> (untuk HIMA/UKM/Fakultas).</span>
                    </div>
                  )}

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
                        className="w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
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
                        className="w-full rounded-md border border-gray-200 bg-white px-4 py-2 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-dark mb-1.5">Kata Sandi</label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full rounded-md border border-gray-200 bg-white px-4 py-2 pr-10 text-sm text-dark focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-shadow"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral hover:text-dark transition-colors cursor-pointer"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full cursor-pointer rounded-md bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-[#0f527c] hover:shadow-md hover:shadow-primary/20 disabled:opacity-70 mt-4"
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
                className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-dark transition hover:bg-gray-50 disabled:opacity-70"
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

      {/* Verification Email Modal */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
          <div
            className="absolute inset-0 bg-[#0a2540]/60 backdrop-blur-sm"
            onClick={() => setShowVerificationModal(false)}
          />
          <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-300">
            {/* Header dengan Gradient & Ikon Animatif */}
            <div className="bg-gradient-to-br from-primary to-secondary p-8 text-white text-center relative">
              <button
                onClick={() => setShowVerificationModal(false)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mx-auto h-16 w-16 bg-white/25 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md animate-bounce">
                <Bell className="h-8 w-8 text-white" />
              </div>

              <h3 className="text-xl font-extrabold mb-1">Verifikasi Email Anda</h3>
              <p className="text-white/70 text-xs">Satu langkah lagi untuk memulai petualanganmu!</p>
            </div>

            {/* Isi Modal */}
            <div className="p-8 text-center font-sans">
              <p className="text-sm text-dark font-medium leading-relaxed mb-6">
                Kami telah mengirimkan tautan verifikasi ke email institusi Anda:
                <br />
                <strong className="text-primary text-base block mt-2 font-bold select-all bg-gray-50 rounded-lg py-2 px-3 border border-gray-100">
                  {registeredEmail}
                </strong>
              </p>

              <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-4 text-left mb-6 flex gap-3">
                <span className="text-amber-500 shrink-0 text-base mt-0.5">⚠️</span>
                <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                  Harap klik tautan verifikasi di email tersebut sebelum masuk. Jika email belum masuk dalam 2 menit, silakan periksa folder <strong>Spam</strong> atau <strong>Promosi</strong> Anda.
                </p>
              </div>

              <button
                onClick={() => setShowVerificationModal(false)}
                className="w-full bg-primary hover:bg-[#0f527c] text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 text-sm"
              >
                Saya Mengerti, Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
