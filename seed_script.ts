import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Starting seed...");
  try {
    const eventsRef = collection(db, "events");
    const snapshot = await getDocs(eventsRef);
    
    console.log(`Found ${snapshot.docs.length} existing events to delete.`);
    const deletePromises = snapshot.docs.map(d => deleteDoc(doc(db, "events", d.id)));
    await Promise.all(deletePromises);
    console.log("Deleted old events.");

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
    console.log("Seeded new events successfully!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
