const fs = require('fs');

const newFile = fs.readFileSync('app/(dashboard)/organizer/events/new/page.tsx', 'utf8');
const editFile = fs.readFileSync('app/(dashboard)/organizer/events/[id]/edit/page.tsx', 'utf8');

const returnRegex = /return \(\s*<div[\s\S]*?<\/div>\s*\);\s*}\s*$/;
const newMatch = newFile.match(returnRegex);
const editMatch = editFile.match(returnRegex);

if (newMatch && editMatch) {
  let newJsx = newMatch[0];
  
  // Replace the header properly without regex errors
  const headerSearch = `<h1 className="text-3xl font-black text-dark tracking-tight">Buat Acara Baru</h1>`;
  const headerReplace = `<Link href="/organizer/events" className="inline-flex items-center gap-2 text-accent hover:text-accent-600 mb-4 font-bold text-sm transition-colors"><ChevronLeft className="h-4 w-4" /> Batal & Kembali</Link><h1 className="text-3xl font-black text-dark tracking-tight">Edit Acara</h1><p className="text-neutral text-xs font-medium mt-1">Ubah rincian acara Anda di bawah. Acara akan diajukan ulang untuk verifikasi admin.</p>`;
  newJsx = newJsx.replace(headerSearch, headerReplace);
  
  newJsx = newJsx.replace(/<p className="text-neutral text-sm mt-1">Isi informasi acara dengan lengkap dan akurat<\/p>/, "");

  newJsx = newJsx.replace(/Ajukan Acara/g, 'Simpan Perubahan');
  newJsx = newJsx.replace(/Mengajukan\.\.\./g, 'Menyimpan...');
  
  newJsx = newJsx.replace(/\{formData\.bannerPoster\?\.name\}/g, '{formData.bannerPoster ? formData.bannerPoster.name : "Menggunakan Poster Terdaftar"}');

  const newContent = editFile.replace(returnRegex, newJsx);
  fs.writeFileSync('app/(dashboard)/organizer/events/[id]/edit/page.tsx', newContent);
  console.log('Success');
} else {
  console.log('Failed to match regex');
}
