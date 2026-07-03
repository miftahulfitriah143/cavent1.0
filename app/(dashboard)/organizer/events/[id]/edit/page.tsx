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
  Award
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { uploadImage } from "@/lib/cloudinary";

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [availableCategories, setAvailableCategories] = useState([
    "Seminar",
    "Workshop",
    "Competition",
    "Webinar"
  ]);
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
    registrationStatus: "Terbuka",
    isProdiOnly: false,
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
            registrationStatus: eventData.registrationStatus || "Terbuka",
            isProdiOnly: eventData.isProdiOnly || false,
            regOpenDate: eventData.regOpenDate || "",
            regCloseDate: eventData.regCloseDate || "",
            bannerPoster: null,
            additionalMedia: [],
          });

          // Set custom categories if any aren't in available default lists
          if (eventData.category) {
            eventData.category.forEach((cat: string) => {
              if (!availableCategories.includes(cat)) {
                setAvailableCategories(prev => [...prev, cat]);
              }
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

  const handleAddCustomCategory = () => {
    const trimmed = customCategoryInput.trim();
    if (!trimmed) return;

    const formatted = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    if (!availableCategories.includes(formatted)) {
      setAvailableCategories(prev => [...prev, formatted]);
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
        maxCapacity: parseInt(formData.maxCapacity) || 0,
        description: formData.description,
        benefits: formData.benefits,
        targetAudience: formData.targetAudience,
        whatYouWillGet: formData.whatYouWillGet.filter(item => item.trim() !== ''),
        termsAndConditions: formData.termsAndConditions.filter(item => item.trim() !== ''),
        registrationStatus: formData.registrationStatus,
        isProdiOnly: formData.isProdiOnly,
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
        maxCapacity: parseInt(formData.maxCapacity) || 0,
        description: formData.description,
        benefits: formData.benefits,
        targetAudience: formData.targetAudience,
        whatYouWillGet: formData.whatYouWillGet.filter(item => item.trim() !== ""),
        termsAndConditions: formData.termsAndConditions.filter(item => item.trim() !== ""),
        organizerProdi: formData.organizerProdi,
        registrationStatus: formData.registrationStatus,
        isProdiOnly: formData.isProdiOnly,
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
      if (!formData.venue.trim()) {
        toast.error("Mohon isi Venue / Ruangan Acara!");
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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/organizer/events" className="inline-flex lg:hidden items-center gap-2 text-accent hover:text-accent-600 mb-4 font-bold text-sm transition-colors"><ChevronLeft className="h-4 w-4" /> Batal & Kembali</Link><h1 className="text-3xl font-black text-dark tracking-tight">Edit Acara</h1><p className="text-neutral text-xs font-medium mt-1">Ubah rincian acara Anda di bawah. Acara akan diajukan ulang untuk verifikasi admin.</p>
          
        </div>
      </div>


      {/* Stepper */}
      <div className="bg-white rounded-xl p-1 mb-8 shadow-sm border border-gray-100 flex overflow-hidden">
        {[
          { id: 1, label: "Informasi Dasar", icon: Info },
          { id: 2, label: "Detail Acara", icon: LayoutGrid },
          { id: 3, label: "Media & Poster", icon: ImageIcon }
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => s.id < step && setStep(s.id)}
            disabled={s.id > step}
            className={`flex-1 flex items-center justify-center gap-3 py-4 text-sm font-bold transition-all ${step === s.id
              ? "bg-primary/5 text-primary"
              : step > s.id
                ? "text-green-600"
                : "text-neutral/40"
              }`}
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] ${step === s.id ? "bg-primary text-white" : step > s.id ? "bg-green-600 text-white" : "bg-gray-100 text-neutral"
              }`}>
              {step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}
            </div>
            <span className="hidden md:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-gray-100 min-h-[500px]">

        {/* STEP 1: INFORMASI DASAR */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Nama Acara <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  placeholder="Seminar Nasional Teknologi 2026"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Jam Mulai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Jam Selesai <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Kategori Acara (Pilih satu atau lebih) <span className="text-red-500">*</span>
                </label>

                {/* Predefined & Custom Categories Grid */}
                <div className="flex flex-wrap gap-2.5">
                  {availableCategories.map((cat) => {
                    const isSelected = formData.category.includes(cat);
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => handleToggleCategory(cat)}
                        className={`px-5 py-3 rounded-full text-xs font-bold transition-all duration-300 active:scale-95 border ${isSelected
                          ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                          : "bg-gray-50 border-gray-100 text-neutral hover:bg-gray-100"
                          }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Category Input */}
                <div className="flex gap-2 max-w-md">
                  <input
                    type="text"
                    placeholder="Tambah kategori kustom..."
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomCategory();
                      }
                    }}
                    className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomCategory}
                    className="bg-primary hover:bg-primary-900 text-white font-bold px-4 py-3 rounded-xl text-xs transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Tambah
                  </button>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Biaya Pendaftaran
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="text"
                    disabled
                    value="Gratis (Default)"
                    className="w-full bg-gray-100 border border-gray-200 rounded-2xl pl-12 pr-5 py-4 text-sm text-neutral cursor-not-allowed font-bold"
                  />
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Penyelenggara / Program Studi (Bisa pilih lebih dari satu) <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2.5 mt-2">
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
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 border ${isSelected
                          ? "bg-primary border-primary text-white shadow-md shadow-primary/20"
                          : "bg-white border-gray-200 text-neutral hover:bg-gray-50"
                          }`}
                      >
                        {prodi}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Lokasi Kampus <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <select
                    name="campusLocation"
                    value={formData.campusLocation}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
                  >
                    <option>Kampus Cipayung, Jakarta Timur</option>
                    <option>Kampus Cikarang, Kab. Bekasi</option>
                    <option>Kampus Kuningan (Trinity Tower Lt.45), Jakarta Selatan</option>
                    <option>Online</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Ruangan / Venue <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="text"
                    name="venue"
                    placeholder="Aula Firmanzah Lt.8"
                    value={formData.venue}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Kapasitas Maksimal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="number"
                    name="maxCapacity"
                    placeholder="300"
                    value={formData.maxCapacity}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
                </div>
              </div>
        )}

        {/* STEP 2: DETAIL ACARA */}
        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-2">
              <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                Deskripsi Acara <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                rows={4}
                placeholder="Seminar nasional yang membahas perkembangan teknologi terkini..."
                value={formData.description}
                onChange={handleChange}
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Benefit Acara <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral animate-pulse" />
                  <input
                    type="text"
                    name="benefits"
                    placeholder="Contoh: Snack, Sertifikat (SKPI)"
                    value={formData.benefits}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Target Peserta <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="text"
                    name="targetAudience"
                    placeholder="Contoh: Mahasiswa Umum, Mahasiswa Informatika"
                    value={formData.targetAudience}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Apa saja yang akan kamu dapatkan <span className="text-neutral-400 text-[10px] font-normal lowercase tracking-normal">(opsional)</span>
                </label>
                <p className="text-[11px] text-neutral/70 mt-1 font-medium leading-relaxed">
                  Tuliskan wawasan, kompetensi, atau hal-hal berharga yang akan didapatkan peserta dari acara ini.
                </p>
              </div>
              <div className="space-y-3">
                {formData.whatYouWillGet.length === 0 ? (
                  <div className="bg-gray-50/50 rounded-2xl p-6 text-center border border-dashed border-gray-100">
                    <p className="text-xs text-neutral/60 italic">Tidak ada item yang ditambahkan.</p>
                  </div>
                ) : (
                  formData.whatYouWillGet.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <input
                        type="text"
                        placeholder="Contoh: Pemahaman dasar AI, Relasi baru, Sertifikat resmi"
                        value={item}
                        onChange={(e) => handleWhatYouWillGetChange(idx, e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-dark w-full focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeWhatYouWillGetItem(idx)}
                        className="p-3 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={addWhatYouWillGetItem}
                  className="flex items-center gap-2 text-xs font-bold text-primary px-4 py-2 bg-primary/5 rounded-xl hover:bg-primary/10 transition-all"
                >
                  <Plus className="h-4 w-4" /> Tambah Item
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-dark uppercase tracking-widest flex items-center gap-2">
                  Syarat & Ketentuan <span className="text-neutral-400 text-[10px] font-normal lowercase tracking-normal">(opsional)</span>
                </label>
                <p className="text-[11px] text-neutral/70 mt-1 font-medium leading-relaxed">
                  Tuliskan poin-poin persyaratan atau ketentuan yang berlaku bagi peserta acara ini.
                </p>
              </div>
              <div className="space-y-3">
                {formData.termsAndConditions.length === 0 ? (
                  <div className="bg-gray-50/50 rounded-2xl p-6 text-center border border-dashed border-gray-100">
                    <p className="text-xs text-neutral/60 italic">Tidak ada syarat yang ditambahkan.</p>
                  </div>
                ) : (
                  formData.termsAndConditions.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center animate-in fade-in duration-300">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-xs font-black text-red-500 shrink-0 border border-red-100/50">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        placeholder="Contoh: Peserta wajib membawa laptop pribadi, Menggunakan kemeja rapi"
                        value={item}
                        onChange={(e) => handleTermsChange(idx, e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-xs text-dark w-full focus:ring-2 focus:ring-primary/20 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => removeTermsItem(idx)}
                        className="p-3 text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={addTermsItem}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 px-4 py-2 bg-red-50 rounded-xl hover:bg-red-100 transition-all border border-red-100/50 w-fit"
                >
                  <Plus className="h-4 w-4" /> Tambah Syarat
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest">Status Pendaftaran *</label>
                <select
                  name="registrationStatus"
                  value={formData.registrationStatus}
                  onChange={handleChange}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none transition-all cursor-pointer"
                >
                  <option>Terbuka</option>
                  <option>Segera Hadir</option>
                  <option>Selesai</option>
                </select>
              </div>

              <div className="flex items-center gap-3 md:mt-8">
                <input
                  type="checkbox"
                  name="isProdiOnly"
                  id="isProdiOnly"
                  checked={formData.isProdiOnly}
                  onChange={handleChange}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isProdiOnly" className="text-sm font-bold text-dark cursor-pointer">
                  Khusus Mahasiswa Prodi Teknik Informatika
                </label>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest">Pendaftaran Buka *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="date"
                    name="regOpenDate"
                    value={formData.regOpenDate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-dark uppercase tracking-widest">Pendaftaran Tutup *</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral" />
                  <input
                    type="date"
                    name="regCloseDate"
                    value={formData.regCloseDate}
                    onChange={handleChange}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-5 py-4 text-sm text-dark focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: MEDIA & POSTER */}
        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <label className="text-xs font-black text-dark uppercase tracking-widest">Poster Utama / Banner</label>
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleBannerUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="h-64 border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 bg-gray-50/50 group-hover:bg-primary/5 group-hover:border-primary/20 transition-all">
                  {bannerPreview ? (
                    <div className="flex flex-col items-center">
                      <div className="h-40 w-64 rounded-2xl overflow-hidden mb-2">
                        <img src={bannerPreview} alt="Preview" className="h-full w-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-primary">{formData.bannerPoster ? formData.bannerPoster.name : "Menggunakan Poster Terdaftar"}</span>
                    </div>
                  ) : (
                    <>
                      <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                        <Upload className="h-8 w-8 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-dark">Tambah Foto</p>
                        <p className="text-[10px] text-neutral mt-1 uppercase tracking-wider">JPG, PNG, max 10MB per foto</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-black text-dark uppercase tracking-widest">Media (Maks 5 Foto)</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Preview existing media */}
                {additionalMediaPreviews.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-2xl border border-gray-100 overflow-hidden relative group">
                    <img src={url} alt="Media" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalMedia(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                      title="Hapus Media"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Upload Slot */}
                {formData.additionalMedia.length < 5 && (
                  <div className="relative aspect-square">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleMediaUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="h-full border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all">
                      <Plus className="h-6 w-6 text-neutral" />
                      <p className="text-[10px] font-bold text-neutral mt-1">Tambah</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={step === 1 || isLoading}
          className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-bold text-sm transition-all ${step === 1 ? "opacity-0 invisible" : "bg-white border border-gray-200 text-dark hover:bg-gray-50"
            }`}
        >
          <ChevronLeft className="h-4 w-4" /> Sebelumnya
        </button>

        <div className="flex items-center gap-4">
          <button type="button" onClick={handleSaveDraft} disabled={isLoading} className="hidden md:block text-sm font-bold text-neutral hover:text-dark px-6 py-3.5 rounded-2xl transition-all disabled:opacity-50">
            Simpan Draft
          </button>

          {step < 3 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 bg-primary text-white px-10 py-3.5 rounded-2xl font-bold text-sm hover:bg-primary-900 shadow-lg shadow-primary/20 transition-all active:scale-[0.98]"
            >
              Lanjut <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center gap-2 bg-primary text-white px-10 py-3.5 rounded-2xl font-bold text-sm hover:bg-primary-900 shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? "Mengirim..." : "Submit Acara"} <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

