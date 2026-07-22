import { db } from "@/lib/firebase";
import { doc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";

/**
 * Memeriksa daftar acara. Jika ada acara berstatus "pending" (menunggu persetujuan)
 * yang tanggal pelaksanaannya sudah terlewat (lebih kecil dari hari ini),
 * sistem akan mengembalikannya secara otomatis ke penyelenggara dengan status "rejected".
 */
export async function checkAndExpirePendingEvents(events: any[]) {
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Mulai dari awal hari ini

  for (const event of events) {
    if (event.status === "pending" && event.startDate) {
      const eventDate = new Date(event.startDate);
      
      // Jika format tanggal valid dan acara tersebut terjadi di masa lalu
      if (!isNaN(eventDate.getTime()) && eventDate < now) {
        try {
          // 1. Update status acara menjadi expired
          await updateDoc(doc(db, "events", event.id), {
            status: "expired",
            rejectionReason: "Tanggal pelaksanaan acara sudah terlewat sebelum mendapatkan persetujuan dari Admin.",
            rejectedAt: serverTimestamp()
          });

          // 2. Buat Notifikasi ke penyelenggara
          if (event.organizerId) {
            await addDoc(collection(db, "notifications"), {
              type: "EVENT_EXPIRED",
              title: "Acara Kedaluwarsa",
              message: `Pengajuan acara "${event.title}" telah kedaluwarsa secara otomatis karena tanggal pelaksanaannya telah terlewat. Silakan sesuaikan kembali tanggal acara Anda.`,
              eventId: event.id,
              status: "unread",
              createdAt: serverTimestamp(),
              userId: event.organizerId,
              targetRole: "organizer"
            });
          }
        } catch (error) {
          console.error("Gagal melakukan auto-expire pada acara:", error);
        }
      }
    }
  }
}
