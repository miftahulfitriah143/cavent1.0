import { NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from "firebase/firestore";
import { sendEmail } from "@/lib/mailer";

export async function GET(request: Request) {
  try {
    // 1. Get current date information
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0]; // "YYYY-MM-DD"
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(now.getDate() - 3);

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(now.getDate() + 3);
    const targetStartDateStr = threeDaysFromNow.toISOString().split("T")[0];

    // ==========================================
    // CHECK 1: Admin Reminder for Pending Events > 3 days
    // ==========================================
    const qPending = query(
      collection(db, "events"),
      where("status", "==", "pending")
    );
    const pendingSnap = await getDocs(qPending);

    const adminUsers: string[] = [];
    const qAdmin = query(collection(db, "users"), where("role", "==", "admin"));
    const adminSnap = await getDocs(qAdmin);
    adminSnap.forEach(doc => {
      const data = doc.data();
      if (data.email) adminUsers.push(data.email);
    });

    let adminEmailsSent = 0;
    if (adminUsers.length > 0) {
      for (const eventDoc of pendingSnap.docs) {
        const data = eventDoc.data();
        if (data.adminReminderSent) continue;

        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
        if (createdAt && createdAt < threeDaysAgo) {
          // It's older than 3 days
          const subject = `[Cavent] Pengingat Admin: Acara Menunggu Persetujuan`;
          const html = `
            <h2>Halo Admin,</h2>
            <p>Ada acara yang telah menunggu persetujuan selama lebih dari 3 hari.</p>
            <p><strong>Judul Acara:</strong> ${data.title}</p>
            <p><strong>Penyelenggara:</strong> ${data.organizerName}</p>
            <p>Silakan login ke dashboard untuk segera meninjau acara ini.</p>
          `;
          await sendEmail(adminUsers, subject, html);
          await updateDoc(doc(db, "events", eventDoc.id), { adminReminderSent: true });
          adminEmailsSent++;
        }
      }
    }

    // ==========================================
    // FETCH PUBLISHED EVENTS
    // ==========================================
    const qPublished = query(
      collection(db, "events"),
      where("status", "==", "published")
    );
    const publishedSnap = await getDocs(qPublished);

    let participantEmailsSent = 0;
    let promoEmailsSent = 0;

    // Pre-fetch all audiens emails for promos
    const audienceEmails: string[] = [];
    const qAudiens = query(collection(db, "users"), where("role", "==", "audiens"));
    const audiensSnap = await getDocs(qAudiens);
    audiensSnap.forEach(doc => {
      const data = doc.data();
      if (data.email) audienceEmails.push(data.email);
    });

    for (const eventDoc of publishedSnap.docs) {
      const data = eventDoc.data();

      // ==========================================
      // CHECK 2: Reminder for Participants (H-3)
      // ==========================================
      if (!data.h3ReminderSent && data.startDate === targetStartDateStr) {
        // Fetch registered participants
        const qReg = query(collection(db, "registrations"), where("eventId", "==", eventDoc.id), where("status", "==", "registered"));
        const regSnap = await getDocs(qReg);
        
        const participantEmails: string[] = [];
        regSnap.forEach(regDoc => {
          const rData = regDoc.data();
          if (rData.userEmail) participantEmails.push(rData.userEmail);
        });

        if (participantEmails.length > 0) {
          const subject = `[Cavent] Pengingat Acara H-3: ${data.title}`;
          const html = `
            <h2>Halo Peserta,</h2>
            <p>Acara <strong>${data.title}</strong> yang Anda daftarkan akan dimulai 3 hari lagi!</p>
            <ul>
              <li><strong>Tanggal:</strong> ${data.startDate}</li>
              <li><strong>Waktu:</strong> ${data.startTime} WIB</li>
              <li><strong>Lokasi:</strong> ${data.campusLocation} - ${data.venue}</li>
            </ul>
            <p>Jangan lupa untuk mempersiapkan diri. Sampai jumpa di acara!</p>
          `;
          // Note: using bcc or sending individually is better, but joining for simplicity if under limit
          await sendEmail(participantEmails, subject, html);
          participantEmailsSent++;
        }
        await updateDoc(doc(db, "events", eventDoc.id), { h3ReminderSent: true });
      }

      // ==========================================
      // CHECK 3: Promo for 3 days published
      // ==========================================
      if (!data.promoEmailSent && audienceEmails.length > 0) {
        const approvedAt = data.approvedAt?.toDate ? data.approvedAt.toDate() : new Date(data.createdAt); // Fallback to createdAt if missing
        
        // If it was published more than 3 days ago
        if (approvedAt && approvedAt < threeDaysAgo) {
          const subject = `[Cavent] Rekomendasi Acara: ${data.title}`;
          const html = `
            <h2>Halo! Ada Acara Menarik Untukmu</h2>
            <p>Jangan lewatkan acara seru di kampus kita:</p>
            <h3>${data.title}</h3>
            <p>${data.description?.substring(0, 150)}...</p>
            <p><strong>Lokasi:</strong> ${data.venue}</p>
            <p><strong>Tanggal:</strong> ${data.startDate}</p>
            <p>Segera kunjungi Cavent untuk melihat detail dan mendaftar sebelum kehabisan kuota!</p>
          `;
          await sendEmail(audienceEmails, subject, html);
          await updateDoc(doc(db, "events", eventDoc.id), { promoEmailSent: true });
          promoEmailsSent++;
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Cron job executed successfully",
      stats: { adminEmailsSent, participantEmailsSent, promoEmailsSent } 
    });
  } catch (error: any) {
    console.error("Cron Job Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
