"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { Footer } from "@/components/layout/Footer";

export default function TentangPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white font-sans">
      <PublicNavbar />

      {/* Banner Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden bg-slate-900">
        {/* Background Image */}
        <div 
          className="absolute inset-0 opacity-30 mix-blend-overlay bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070')" }}
        />
        
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 z-10">

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4 uppercase">
            TENTANG CAVENT
          </h1>
          <p className="text-base md:text-lg text-white/90 max-w-3xl leading-relaxed">
            CAVENT, platform manajemen acara kampus terpadu yang membawa misi kemudahan pengelolaan dan partisipasi acara bagi seluruh civitas akademika.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <main className="flex-1 py-12 md:py-20 px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-dark space-y-6 text-[15px] md:text-base leading-relaxed">
          <p>
            CAVENT adalah platform Campus Event Management System yang memiliki teknologi unggul dalam mendukung penyelenggara acara kampus mulai dari publikasi, manajemen pendaftaran, hingga penyediaan laporan kehadiran dan analitik di akhir acara.
          </p>
          <p>
            Beberapa fitur yang kami sediakan siap untuk memfasilitasi penyelenggara acara (organizer) dan audiens dalam setiap tahap yang meliputi:
          </p>
          <ul className="list-disc pl-6 space-y-3 mt-4 text-gray-700">
            <li>
              <strong>Publikasi acara terpusat</strong> yang memudahkan audiens untuk mengeksplorasi dan menemukan berbagai kegiatan menarik di kampus.
            </li>
            <li>
              <strong>Sistem pendaftaran dan ticketing yang mudah</strong> memberikan kenyamanan bagi calon peserta, meminimalisir proses manual, dan mendapatkan konversi partisipasi yang lebih tinggi.
            </li>
            <li>
              <strong>Manajemen absensi berbasis QR Code</strong> yang paling aman dan cepat untuk akses saat acara berlangsung. Sehingga, acara dengan jumlah peserta yang besar dapat ditangani dengan efisien.
            </li>
            <li>
              <strong>Sistem laporan dan analitik data</strong> yang komprehensif setelah acara berlangsung untuk memudahkan penyelenggara acara dan pihak kampus dalam mengevaluasi strategi acara selanjutnya.
            </li>
          </ul>
          <p className="pt-4">
            Sudah ada berbagai acara kampus yang terbantu dengan sistem kami. Kini, saatnya perkenalkan acara organisasi Anda pada seluruh audiens untuk membawa peserta yang lebih banyak lagi bersama CAVENT!
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
