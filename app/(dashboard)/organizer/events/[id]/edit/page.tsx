"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Image as ImageIcon,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Info,
  CheckCircle2,
  X,
  LayoutGrid,
  CreditCard,
  Building2,
  ArrowRight,
  Award,
  Sparkles,
  FileText,
  Link2,
  Tag
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { uploadImage } from "@/lib/cloudinary";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const DEFAULT_CATEGORIES = ["Seminar", "Workshop", "Kompetisi", "Webinar", "Diskusi"];
  const [availableCategories, setAvailableCategories] = useState<string[]>(DEFAULT_CATEGORIES);

  // Load global categories from Firestore
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const snap = await getDocs(collection(db, "categories"));
        if (snap.empty) {
          const seedPromises = DEFAULT_CATEGORIES.map(name =>
            addDoc(collection(db, "categories"), { name, createdAt: serverTimestamp() })
          );
          await Promise.all(seedPromises);
          setAvailableCategories(DEFAULT_CATEGORIES);
        } else {
          const names = Array.from(new Set(snap.docs.map(d => d.data().name as string)));
          const sorted = [
            ...DEFAULT_CATEGORIES.filter(d => names.includes(d)),
            ...names.filter(n => !DEFAULT_CATEGORIES.includes(n))
          ];
          setAvailableCategories(sorted);
        }
      } catch (err) {
        // Jika belum dideploy rulesnya ke Firebase live, maka ini wajar akan catch error (permission denied)
        // Kita cukup abaikan karena akan fallback ke DEFAULT_CATEGORIES.
        // console.warn("Menggunakan kategori bawaan karena gagal membaca dari server.");
      }
    };
    loadCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  
  // Track existing database URLs so we don't re-upload
  const [existingBannerUrl, setExistingBannerUrl] = useState<string>("");
  const [existingAdditionalMedia, setExistingAdditionalMedia] = useState<string[]>([]);
  
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [additionalMediaPreviews, setAdditionalMediaPreviews] = useState<string[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    startTime: "",
    endTime: "",
    category: ["Seminar"] as string[],
    feeType: "Gratis",
    campusLocation: "",
    venue: "",
    meetingLink: "",
    maxCapacity: "",
    description: "",
    benefits: "",
    targetAudience: "",
    organizerProdi: ["Universitas"] as string[],
    whatYouWillGet: [""] as string[],
    termsAndConditions: [
      "Pendaftaran dilakukan hanya melalui website cavent.",
      "Peserta wajib menjaga ketertiban selama acara berlangsung.",
      "Peserta harus scan QR atau menunjukkan tiket (e-ticket) saat registrasi onsite.",
      "Hanya peserta yang statusnya hadir yang bisa menuliskan ulasan."
    ] as string[],
    regOpenDate: "",
    regCloseDate: "",
    bannerPoster: null as File | null,
    additionalMedia: [] as File[],
  });

  // Fetch Event on Mount
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, "events", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const eventData = docSnap.data();
          
          // Security Check: Only the organizer who created it (or admin) can edit
          if (auth.currentUser && eventData.organizerId !== auth.currentUser.uid) {
            toast.error("Anda tidak memiliki hak untuk mengedit acara ini.");
            router.push("/organizer/events");
            return;
          }

          // Populate states
          setFormData({
            title: eventData.title || "",
            startDate: eventData.startDate || "",
            endDate: eventData.endDate || "",
            startTime: eventData.startTime || "",
            endTime: eventData.endTime || "",
            category: eventData.category || ["Seminar"],
            feeType: eventData.feeType || "Gratis",
            campusLocation: eventData.campusLocation || "",
            venue: eventData.venue || "",
            meetingLink: eventData.meetingLink || "",
            maxCapacity: eventData.maxCapacity ? String(eventData.maxCapacity) : "",
            description: eventData.description || "",
            benefits: eventData.benefits || "",
            targetAudience: eventData.targetAudience || "",
            organizerProdi: eventData.organizerProdi || ["Universitas"],
            whatYouWillGet: eventData.whatYouWillGet && eventData.whatYouWillGet.length > 0 ? eventData.whatYouWillGet : [""],
            termsAndConditions: eventData.termsAndConditions && eventData.termsAndConditions.length > 0 ? eventData.termsAndConditions : [
              "Pendaftaran dilakukan hanya melalui website cavent.",
              "Peserta wajib menjaga ketertiban selama acara berlangsung.",
              "Peserta harus scan QR atau menunjukkan tiket (e-ticket) saat registrasi onsite.",
              "Hanya peserta yang statusnya hadir yang bisa menuliskan ulasan."
            ],
            regOpenDate: eventData.regOpenDate || "",
            regCloseDate: eventData.regCloseDate || "",
            bannerPoster: null,
            additionalMedia: [],
          });

          // Set custom categories if any aren't in available lists, avoiding duplicates
          if (eventData.category) {
            setAvailableCategories(prev => {
              const newCats = eventData.category.filter((cat: string) => !prev.includes(cat));
              if (newCats.length > 0) {
                return Array.from(new Set([...prev, ...newCats]));
              }
              return prev;
            });
          }

          setExistingBannerUrl(eventData.bannerUrl || "");
          setBannerPreview(eventData.bannerUrl || "");
          setExistingAdditionalMedia(eventData.additionalMedia || []);
          setAdditionalMediaPreviews(eventData.additionalMedia || []);

        } else {
          toast.error("Acara tidak ditemukan");
          router.push("/organizer/events");
        }
      } catch (error: any) {
        console.error("Fetch Event Error:", error);
        toast.error("Gagal memuat data acara");
      } finally {
        setIsLoading(false);
      }
    };

    if (auth.currentUser) {
      fetchEvent();
    } else {
      // Wait a moment for auth state to resolve
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          fetchEvent();
        } else {
          router.push("/login");
        }
        unsubscribe();
      });
    }
  }, [id, router]);

  // Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleCategory = (cat: string) => {
    setFormData(prev => {
      const isSelected = prev.category.includes(cat);
      const newCategory = isSelected
        ? prev.category.filter(c => c !== cat)
        : [...prev.category, cat];
      return { ...prev, category: newCategory };
    });
  };

  const handleToggleProdi = (prodi: string) => {
    setFormData(prev => {
      const isSelected = prev.organizerProdi.includes(prodi);
      const newProdi = isSelected
        ? prev.organizerProdi.filter(p => p !== prodi)
        : [...prev.organizerProdi, prodi];
      return { ...prev, organizerProdi: newProdi };
    });
  };

  const handleAddCustomCategory = async () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;

    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    if (!availableCategories.includes(formatted)) {
      setAvailableCategories(prev => Array.from(new Set([...prev, formatted])));
      try {
        const existing = await getDocs(
          query(collection(db, "categories"), where("name", "==", formatted))
        );
        if (existing.empty) {
          await addDoc(collection(db, "categories"), { name: formatted, createdAt: serverTimestamp() });
        }
      } catch (err) {
        console.error("Failed to save category:", err);
      }
    }

    setFormData(prev => {
      if (!prev.category.includes(formatted)) {
        return { ...prev, category: [...prev.category, formatted] };
      }
      return prev;
    });

    setCustomCategoryInput("");
    toast.success(`Kategori "${formatted}" berhasil ditambahkan!`);
  };

  // What You Will Get Handlers
  const addWhatYouWillGetItem = () => {
    setFormData(prev => ({
      ...prev,
      whatYouWillGet: [...prev.whatYouWillGet, ""]
    }));
  };

  const removeWhatYouWillGetItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      whatYouWillGet: prev.whatYouWillGet.filter((_, i) => i !== index)
    }));
  };

  const handleWhatYouWillGetChange = (index: number, value: string) => {
    const newItems = [...formData.whatYouWillGet];
    newItems[index] = value;
    setFormData(prev => ({ ...prev, whatYouWillGet: newItems }));
  };

  // Terms and Conditions Handlers
  const addTermsItem = () => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: [...prev.termsAndConditions, ""]
    }));
  };

  const removeTermsItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      termsAndConditions: prev.termsAndConditions.filter((_, i) => i !== index)
    }));
  };

  const handleTermsChange = (index: number, value: string) => {
    const newItems = [...formData.termsAndConditions];
    newItems[index] = value;
    setFormData(prev => ({ ...prev, termsAndConditions: newItems }));
  };

  // Media Handlers
  const handleBannerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, bannerPoster: file }));
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setFormData(prev => ({
        ...prev,
        additionalMedia: [...prev.additionalMedia, ...filesArray].slice(0, 5)
      }));
      const newPreviews = filesArray.map(file => URL.createObjectURL(file));
      setAdditionalMediaPreviews(prev => [...prev, ...newPreviews].slice(0, 5));
    }
  };

  const removeAdditionalMedia = (idx: number) => {
    // If it's from the existing collection
    if (idx < existingAdditionalMedia.length) {
      setExistingAdditionalMedia(prev => prev.filter((_, i) => i !== idx));
      setAdditionalMediaPreviews(prev => prev.filter((_, i) => i !== idx));
    } else {
      // It's a newly added file
      const relativeIndex = idx - existingAdditionalMedia.length;
      setFormData(prev => ({
        ...prev,
        additionalMedia: prev.additionalMedia.filter((_, i) => i !== relativeIndex)
      }));
      setAdditionalMediaPreviews(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const handleSaveDraft = async () => {
    if (!formData.title.trim()) {
      toast.error('Judul acara minimal harus diisi untuk menyimpan draft.');
      return;
    }

    if (!auth.currentUser) {
      toast.error('Sesi telah berakhir, silakan login kembali.');
      return;
    }

    setIsLoading(true);
    console.log('Saving draft...');

    try {
      let bannerUrl = existingBannerUrl;
      let additionalMediaUrls: string[] = [...existingAdditionalMedia];

      if (formData.bannerPoster) {
        bannerUrl = await uploadImage(formData.bannerPoster);
      }

      if (formData.additionalMedia.length > 0) {
        const uploadPromises = formData.additionalMedia.map(file => uploadImage(file));
        const newMediaUrls = await Promise.all(uploadPromises);
        additionalMediaUrls = [...additionalMediaUrls, ...newMediaUrls];
      }

      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        category: formData.category,
        feeType: formData.feeType,
        campusLocation: formData.campusLocation,
        venue: formData.venue,
        meetingLink: formData.campusLocation === 'Online' ? formData.meetingLink : '',
        maxCapacity: parseInt(formData.maxCapacity) || 0,
        description: formData.description,
        benefits: formData.benefits,
        targetAudience: formData.targetAudience,
        whatYouWillGet: formData.whatYouWillGet.filter(item => item.trim() !== ''),
        termsAndConditions: formData.termsAndConditions.filter(item => item.trim() !== ''),
        organizerProdi: formData.organizerProdi,
        regOpenDate: formData.regOpenDate,
        regCloseDate: formData.regCloseDate,
        bannerUrl: bannerUrl,
        additionalMedia: additionalMediaUrls,
        status: 'draft',
      });

      toast.success('Draft berhasil disimpan!');
      router.push('/organizer/events');
    } catch (error: any) {
      console.error('Draft Save Error:', error);
      toast.error(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.startDate) {
      toast.error("Mohon lengkapi informasi wajib (Judul & Tanggal)");
      return;
    }

    if (formData.category.length === 0) {
      toast.error("Mohon pilih minimal satu kategori acara!");
      return;
    }

    if (!auth.currentUser) {
      toast.error("Sesi telah berakhir, silakan login kembali.");
      return;
    }

    setIsSaving(true);
    toast.loading("Menyimpan perubahan acara...", { id: "saving" });

    try {
      let finalBannerUrl = existingBannerUrl;
      let finalAdditionalMedia = [...existingAdditionalMedia];

      // 1. Upload Poster to Cloudinary only if updated
      if (formData.bannerPoster) {
        finalBannerUrl = await uploadImage(formData.bannerPoster);
      }

      // 2. Upload newly added gallery files if any
      if (formData.additionalMedia.length > 0) {
        const uploadPromises = formData.additionalMedia.map(file => uploadImage(file));
        const newMediaUrls = await Promise.all(uploadPromises);
        finalAdditionalMedia = [...finalAdditionalMedia, ...newMediaUrls];
      }

      // 3. Update Firestore event details
      const docRef = doc(db, "events", id);
      await updateDoc(docRef, {
        title: formData.title,
        startDate: formData.startDate,
        endDate: formData.endDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        category: formData.category,
        feeType: formData.feeType,
        campusLocation: formData.campusLocation,
        venue: formData.venue,
        meetingLink: formData.campusLocation === 'Online' ? formData.meetingLink : '',
        maxCapacity: parseInt(formData.maxCapacity) || 0,
        description: formData.description,
        benefits: formData.benefits,
        targetAudience: formData.targetAudience,
        whatYouWillGet: formData.whatYouWillGet.filter(item => item.trim() !== ""),
        termsAndConditions: formData.termsAndConditions.filter(item => item.trim() !== ""),
        organizerProdi: formData.organizerProdi,
        regOpenDate: formData.regOpenDate,
        regCloseDate: formData.regCloseDate,
        bannerUrl: finalBannerUrl,
        additionalMedia: finalAdditionalMedia,
        status: "pending", // Reverts to pending for re-approval
        updatedAt: serverTimestamp(),
      });

      // 4. Create Notification for Admin
      await addDoc(collection(db, "notifications"), {
        type: "EVENT_UPDATED",
        title: "Perubahan Pengajuan Acara",
        message: `${auth.currentUser.displayName || "Penyelenggara"} memperbarui pengajuan acara: ${formData.title}`,
        eventId: id,
        status: "unread",
        createdAt: serverTimestamp(),
        targetRole: "admin"
      });

      toast.success("Acara berhasil diperbarui! Menunggu persetujuan admin kembali.", { id: "saving" });
      router.push("/organizer/events");
    } catch (error: any) {
      console.error("Submission Error:", error);
      toast.error(`Gagal menyimpan perubahan: ${error.message}`, { id: "saving" });
    } finally {
      setIsSaving(false);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!formData.title.trim()) {
        toast.error("Mohon isi Nama Acara!");
        return;
      }
      if (!formData.startDate) {
        toast.error("Mohon isi Tanggal Mulai!");
        return;
      }
      if (!formData.endDate) {
        toast.error("Mohon isi Tanggal Selesai!");
        return;
      }
      if (!formData.startTime) {
        toast.error("Mohon isi Jam Mulai!");
        return;
      }
      if (!formData.endTime) {
        toast.error("Mohon isi Jam Selesai!");
        return;
      }
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        toast.error("Tanggal selesai tidak boleh sebelum tanggal mulai!");
        return;
      }
    } else if (step === 2) {
      if (formData.campusLocation !== 'Online' && !formData.venue.trim()) {
        toast.error("Mohon isi Venue / Ruangan Acara!");
        return;
      }
      if (formData.campusLocation === 'Online' && !formData.meetingLink.trim()) {
        toast.error("Mohon isi Link Zoom/GMeet!");
        return;
      }
      if (!formData.maxCapacity) {
        toast.error("Mohon isi Kapasitas Maksimal!");
        return;
      }
      if (!formData.description.trim()) {
        toast.error("Mohon isi Deskripsi Acara!");
        return;
      }
      if (!formData.regOpenDate) {
        toast.error("Mohon isi Tanggal Pendaftaran Buka!");
        return;
      }
      if (!formData.regCloseDate) {
        toast.error("Mohon isi Tanggal Pendaftaran Tutup!");
        return;
      }
    }
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setStep(prev => prev - 1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="h-14 w-14 border-[5px] border-primary/10 border-t-primary rounded-full animate-spin mb-6" />
        <p className="text-neutral text-sm font-bold tracking-wide uppercase">Memuat Data Acara...</p>
      </div>
    );
  }

const labelClass = "text-[11px] font-black text-dark uppercase tracking-widest flex items-center gap-2";
  // Reusable input class
  const inputClass = "w-full bg-white border border-gray-200 rounded-xl px-5 py-3.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all shadow-sm placeholder:text-gray-300";
  const inputWithIconClass = "w-full bg-white border border-gray-200 rounded-xl pl-11 pr-5 py-3.5 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 transition-all shadow-sm";

  const steps = [
    { id: 1, label: "Informasi Dasar", icon: Info, color: "text-primary", bg: "bg-primary" },
    { id: 2, label: "Detail Acara", icon: LayoutGrid, color: "text-secondary", bg: "bg-secondary" },
    { id: 3, label: "Media & Poster", icon: ImageIcon, color: "text-accent", bg: "bg-accent" },
  ];

  return (
    <div className="space-y-6 pb-10">
      

      {/* Header */}
      <div className="bg-gradient-to-r from-primary-900 via-primary to-secondary rounded-2xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-primary/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary/20 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
          <Link href="/organizer/events" className="flex items-center justify-center bg-red-500/90 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all backdrop-blur-sm border border-red-400/30 gap-2 shadow-xl">
            <X className="h-4 w-4" /> Batal Edit
          </Link>
        </div>
<div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-accent text-xs font-bold uppercase tracking-widest">Form Pengajuan</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Edit Acara</h1>
          <p className="text-white/70 text-sm mt-1">Ubah rincian acara Anda di bawah. Acara akan diajukan ulang untuk verifikasi admin.</p>
        </div>
      </div>

      {/* Stepper */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex">
          {steps.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone = step > s.id;
            return (
              <button
                key={s.id}
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={`flex-1 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-3 py-4 px-3 text-xs md:text-sm font-bold transition-all border-b-2 ${isActive
                    ? `border-primary bg-primary/5 text-primary`
                    : isDone
                      ? "border-green-400 bg-green-50/50 text-green-600 cursor-pointer"
                      : "border-transparent text-neutral/40 cursor-not-allowed"
                  }`}
              >
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 ${isActive ? `${s.bg} text-white shadow-md` : isDone ? "bg-green-500 text-white" : "bg-gray-100 text-neutral/40"
                  }`}>
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-500"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content */}
      <div className="space-y-5">

        {/* STEP 1: INFORMASI DASAR */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Section: Nama & Waktu */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                  <Info className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-primary">Identitas Acara</p>
                  <p className="text-[11px] text-primary/60">Nama, tanggal, dan waktu pelaksanaan</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-1.5">
                  <label className={labelClass}>
                    Nama Acara <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    placeholder="Seminar Nasional Teknologi 2026"
                    value={formData.title}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Tanggal Mulai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Tanggal Selesai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Jam Mulai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/70" />
                    <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Jam Selesai <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/70" />
                    <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} className={inputWithIconClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Kategori */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-secondary/10 to-secondary/5 border-b border-secondary/10">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shadow-sm">
                  <Tag className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-secondary">Kategori Acara</p>
                  <p className="text-[11px] text-secondary/60">Pilih satu atau lebih kategori yang sesuai</p>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex flex-wrap gap-2.5">
                  {availableCategories.map((cat) => {
                    const isSelected = formData.category.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 border ${isSelected
                            ? "bg-secondary border-secondary text-white shadow-md shadow-secondary/20"
                            : "bg-white border-gray-200 text-neutral hover:border-secondary/40 hover:text-secondary hover:bg-secondary/5"
                          }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>
                <div className="flex gap-2 max-w-sm">
                  <input
                    type="text"
                    placeholder="Tambah kategori kustom..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomCategory(); } }}
                    className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-dark focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all shadow-sm placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="bg-secondary hover:bg-secondary/90 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah
                  </button>
                </div>
              </div>
            </div>

            {/* Section: Penyelenggara */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-accent/10 to-accent/5 border-b border-accent/10">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shadow-sm">
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-accent">Penyelenggara</p>
                  <p className="text-[11px] text-accent/60">Pilih program studi / unit penyelenggara</p>
                </div>
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2.5">
                  {[
                    "Universitas",
                    "FEB — Manajemen",
                    "FFP — Ilmu Komunikasi",
                    "FFP — Hubungan Internasional",
                    "FFP — Psikologi",
                    "FFP — Falsafah Agama",
                    "FIR — DKV",
                    "FIR — TI",
                    "FIR — DP"
                  ].map((prodi) => {
                    const isSelected = formData.organizerProdi.includes(prodi);
                    return (
                      <button
                        key={prodi}
                        type="button"
                        onClick={() => handleToggleProdi(prodi)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 border ${isSelected
                            ? "bg-accent border-accent text-white shadow-md shadow-accent/20"
                            : "bg-white border-gray-200 text-neutral hover:border-accent/40 hover:text-accent hover:bg-accent/5"
                          }`}
                      >
                        {prodi}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Section: Biaya & Lokasi */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary/10 to-secondary/5 border-b border-primary/10">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-primary">Lokasi & Kapasitas</p>
                  <p className="text-[11px] text-primary/60">Tempat pelaksanaan dan jumlah peserta</p>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-1.5">
                  <label className={labelClass}>Biaya Pendaftaran</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      disabled
                      value="Gratis (Default)"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-5 py-3.5 text-sm text-neutral cursor-not-allowed font-bold shadow-sm"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className={labelClass}>Lokasi Kampus <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <select
                      name="campusLocation"
                      value={formData.campusLocation}
                      onChange={handleChange}
                      className={`${inputWithIconClass} appearance-none cursor-pointer`}
                    >
                      <option value="">-- Pilih Lokasi Kampus --</option>
                      <option>Kampus Cipayung, Jakarta Timur</option>
                      <option>Kampus Cikarang, Kab. Bekasi</option>
                      <option>Kampus Kuningan (Trinity Tower Lt.45), Jakarta Selatan</option>
                      <option>Online</option>
                    </select>
                  </div>
                </div>

                {formData.campusLocation === "Online" && (
                  <div className="md:col-span-2 space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className={labelClass}>Link Zoom / GMeet <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/70" />
                      <input
                        type="url"
                        name="meetingLink"
                        placeholder="https://zoom.us/j/..."
                        value={formData.meetingLink}
                        onChange={handleChange}
                        className={inputWithIconClass}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className={labelClass}>Ruangan / Venue <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                    <input
                      type="text"
                      name="venue"
                      placeholder="Aula Firmanzah Lt.8"
                      value={formData.venue}
                      onChange={handleChange}
                      className={inputWithIconClass}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Kapasitas Maksimal <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/70" />
                    <input
                      type="number"
                      name="maxCapacity"
                      placeholder="300"
                      value={formData.maxCapacity}
                      onChange={handleChange}
                      className={inputWithIconClass}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: DETAIL ACARA */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Deskripsi & Info */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-secondary/10 to-secondary/5 border-b border-secondary/10">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shadow-sm">
                  <FileText className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-secondary">Informasi Detail</p>
                  <p className="text-[11px] text-secondary/60">Deskripsi, benefit, dan target peserta</p>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <label className={labelClass}>Deskripsi Acara <span className="text-red-500">*</span></label>
                  <textarea
                    name="description"
                    rows={4}
                    placeholder="Seminar nasional yang membahas perkembangan teknologi terkini..."
                    value={formData.description}
                    onChange={handleChange}
                    className={`${inputClass} resize-none`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Benefit Acara <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Award className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-accent/70" />
                      <input
                        type="text"
                        name="benefits"
                        placeholder="Contoh: Snack, Sertifikat (SKPI)"
                        value={formData.benefits}
                        onChange={handleChange}
                        className={inputWithIconClass}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Target Peserta <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary/70" />
                      <input
                        type="text"
                        name="targetAudience"
                        placeholder="Contoh: Mahasiswa Umum, Mahasiswa Informatika"
                        value={formData.targetAudience}
                        onChange={handleChange}
                        className={inputWithIconClass}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Pendaftaran Buka <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                      <input type="date" name="regOpenDate" value={formData.regOpenDate} onChange={handleChange} className={inputWithIconClass} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Pendaftaran Tutup <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/60" />
                      <input type="date" name="regCloseDate" value={formData.regCloseDate} onChange={handleChange} className={inputWithIconClass} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Apa yang Didapat */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-primary/10">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                  <CheckCircle2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-primary">Yang Akan Didapatkan</p>
                  <p className="text-[11px] text-primary/60">Wawasan dan kompetensi yang diperoleh peserta <span className="text-neutral/50 font-normal normal-case tracking-normal">(opsional)</span></p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {formData.whatYouWillGet.length === 0 ? (
                  <div className="bg-gray-50/50 rounded-xl p-5 text-center border border-dashed border-gray-200">
                    <p className="text-xs text-neutral/50 italic">Tidak ada item yang ditambahkan.</p>
                  </div>
                ) : (
                  formData.whatYouWillGet.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-black text-primary shrink-0 border border-primary/10">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: Pemahaman dasar AI, Relasi baru, Sertifikat resmi"
                        value={item}
                        onChange={(e) => handleWhatYouWillGetChange(idx, e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-dark focus:ring-2 focus:ring-primary/20 outline-none shadow-sm transition-all"
                      />
                      <button type="button" onClick={() => removeWhatYouWillGetItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={addWhatYouWillGetItem}
                  className="flex items-center gap-2 text-xs font-bold text-primary px-4 py-2.5 bg-primary/5 rounded-xl hover:bg-primary/10 transition-all border border-primary/10"
                >
                  <Plus className="h-4 w-4" /> Tambah Item
                </button>
              </div>
            </div>

            {/* Syarat & Ketentuan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shadow-sm">
                  <Info className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-accent">Syarat & Ketentuan</p>
                  <p className="text-[11px] text-accent/60">Persyaratan yang berlaku bagi peserta <span className="text-neutral/50 font-normal normal-case tracking-normal">(opsional)</span></p>
                </div>
              </div>
              <div className="p-6 space-y-3">
                {formData.termsAndConditions.length === 0 ? (
                  <div className="bg-gray-50/50 rounded-xl p-5 text-center border border-dashed border-gray-200">
                    <p className="text-xs text-neutral/50 italic">Tidak ada syarat yang ditambahkan.</p>
                  </div>
                ) : (
                  formData.termsAndConditions.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center animate-in fade-in duration-300">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-accent/10 text-[11px] font-black text-accent shrink-0 border border-accent/10">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: Peserta wajib membawa laptop pribadi"
                        value={item}
                        onChange={(e) => handleTermsChange(idx, e.target.value)}
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-dark focus:ring-2 focus:ring-accent/20 outline-none shadow-sm transition-all"
                      />
                      <button type="button" onClick={() => removeTermsItem(idx)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={addTermsItem}
                  className="flex items-center gap-2 text-xs font-bold text-accent px-4 py-2.5 bg-accent/5 rounded-xl hover:bg-accent/10 transition-all border border-accent/10 w-fit"
                >
                  <Plus className="h-4 w-4" /> Tambah Syarat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: MEDIA & POSTER */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Poster Utama */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-accent/10 to-amber-50 border-b border-accent/10">
                <div className="h-8 w-8 rounded-lg bg-accent flex items-center justify-center shadow-sm">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-accent">Poster Utama / Banner</p>
                  <p className="text-[11px] text-accent/60">Gambar utama yang ditampilkan di halaman acara <span className="text-red-500 font-black">*</span></p>
                </div>
              </div>
              <div className="p-6">
                <div className="relative group">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="h-64 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-gray-50 to-white group-hover:from-accent/5 group-hover:to-amber-50/30 group-hover:border-accent/30 transition-all">
                    {bannerPreview ? (
                      <div className="flex flex-col items-center">
                        <div className="h-40 w-64 rounded-2xl overflow-hidden mb-3 shadow-md border border-white">
                          <img src={bannerPreview} alt="Preview" className="h-full w-full object-cover" />
                        </div>
                        <span className="text-xs font-bold text-accent bg-accent/10 px-3 py-1 rounded-full">{formData.bannerPoster?.name}</span>
                      </div>
                    ) : (
                      <>
                        <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 group-hover:border-accent/20 transition-colors">
                          <Upload className="h-7 w-7 text-accent" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-dark">Klik atau drag foto di sini</p>
                          <p className="text-[10px] text-neutral mt-1 uppercase tracking-wider">JPG, PNG, maks. 10MB</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Media Tambahan */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-secondary/10 to-secondary/5 border-b border-secondary/10">
                <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shadow-sm">
                  <ImageIcon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-black text-sm text-secondary">Media Tambahan</p>
                  <p className="text-[11px] text-secondary/60">Foto pendukung acara, maksimal 5 foto</p>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 md:grid-cols-5 gap-4">
                  {additionalMediaPreviews.map((url, idx) => (
                    <div key={idx} className="aspect-square rounded-2xl border border-gray-100 overflow-hidden relative group shadow-sm">
                      <img src={url} alt="Media" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeAdditionalMedia(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                  {formData.additionalMedia.length < 5 && (
                    <div className="relative aspect-square">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleMediaUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="h-full border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-secondary/5 hover:border-secondary/30 transition-all">
                        <Plus className="h-6 w-6 text-secondary/50" />
                        <p className="text-[10px] font-bold text-neutral/50 mt-1">Tambah</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={prevStep}
          disabled={step === 1 || isLoading}
          className={`flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all ${step === 1 ? "opacity-0 invisible" : "bg-white border border-gray-200 text-dark hover:bg-gray-50 shadow-sm"
            }`}
        >
          <ChevronLeft className="h-4 w-4" /> Sebelumnya
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isLoading || isSaving}
            className="hidden md:block text-sm font-bold text-neutral hover:text-dark px-6 py-3.5 rounded-xl transition-all disabled:opacity-50 hover:bg-gray-100"
          >
            Simpan Draft
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-10 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              Lanjut <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading || isSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-10 py-3.5 rounded-xl font-bold text-sm hover:opacity-90 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? "Mengirim..." : "Submit Acara"} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
