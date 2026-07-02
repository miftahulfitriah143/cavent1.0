"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer id="kontak" className="bg-primary-900 text-white/70 py-8 md:py-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-8 mb-8">
          {/* Kolom 1: Branding */}
          <div className="col-span-2 md:col-span-2 md:pr-10">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative h-6 w-32 md:h-8 md:w-40">
                <Image src="/CAVENT5.svg" alt="Cavent Logo" fill className="object-contain object-left" />
              </div>
            </div>
            <p className="text-[11px] leading-relaxed text-white/50">
              Platform manajemen acara kampus terpadu untuk seluruh sivitas akademika Universitas Paramadina.
            </p>
          </div>

          {/* Kolom 2: Platform */}
          <div>
            <h4 className="text-white font-bold text-xs mb-3">PLATFORM</h4>
            <ul className="space-y-1.5 text-[11px]">
              {["Buat Acara", "Temukan Acara", "Dashboard", "Analitik"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 3: Dukungan */}
          <div>
            <h4 className="text-white font-bold text-xs mb-3">Dukungan</h4>
            <ul className="space-y-1.5 text-[11px]">
              {["Panduan Pengguna", "FAQ", "Hubungi Kami", "Laporan Bug"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kolom 4: Institusi */}
          <div>
            <h4 className="text-white font-bold text-xs mb-3">Institusi</h4>
            <ul className="space-y-1.5 text-[11px]">
              {["Tentang Kami", "Kebijakan Privasi", "Syarat & Ketentuan"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-white transition-colors">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <p className="text-center text-[10px] text-white/40">
            © {new Date().getFullYear()} CAVENT — Universitas Paramadina. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
