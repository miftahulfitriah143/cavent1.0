import { NextResponse } from "next/server";
import { collection, getDocs, deleteDoc, doc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    const eventsRef = collection(db, "events");
    const snapshot = await getDocs(eventsRef);
    
    // Delete existing events
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "events", d.id)));
    await Promise.all(deletePromises);

    // Add new events
    const eventsToAdd = [
      {
        title: "FutureCanvas 2026: UI/UX Design Mastery Workshop",
        category: "Workshop",
        venue: "Ruang Damaskus",
        startDate: "2026-05-21",
        startTime: "09:00",
        endTime: "15:00",
        maxCapacity: 50,
        feeType: "Gratis",
        status: "published",
        bannerUrl: "https://images.unsplash.com/photo-1542744094-24638ea0bc40?q=80&w=2070&auto=format&fit=crop",
        createdAt: new Date().toISOString()
      },
      {
        title: "Seminar Nasional Teknologi 2026",
        category: "Seminar",
        venue: "Aula Firmanzah Lt.8",
        startDate: "2026-05-25",
        startTime: "08:00",
        endTime: "12:00",
        maxCapacity: 300,
        feeType: "Gratis",
        status: "published",
        bannerUrl: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?q=80&w=2012&auto=format&fit=crop",
        createdAt: new Date().toISOString()
      },
      {
        title: "Workshop UI/UX Design Thinking",
        category: "Workshop",
        venue: "Lab Komputer",
        startDate: "2026-06-30",
        startTime: "13:00",
        endTime: "16:00",
        maxCapacity: 50,
        feeType: "Gratis",
        status: "published",
        bannerUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2070&auto=format&fit=crop",
        createdAt: new Date().toISOString()
      }
    ];

    for (const evt of eventsToAdd) {
      await addDoc(eventsRef, evt);
    }

    return NextResponse.json({ success: true, message: "Database seeded successfully!" });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
