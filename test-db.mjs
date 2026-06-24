import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAgegHO8OzIuovTDYmRZFOdFcwhujto5bs",
  authDomain: "cavent-513a5.firebaseapp.com",
  projectId: "cavent-513a5",
  storageBucket: "cavent-513a5.firebasestorage.app",
  messagingSenderId: "966389062783",
  appId: "1:966389062783:web:835ff90e909f48f397734a",
  measurementId: "G-RH9H53BE22"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testConnection() {
  console.log("Mencoba membaca dari Firestore (Project: cavent-513a5)...");
  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    console.log("✅ BERHASIL! Ditemukan", querySnapshot.size, "dokumen di koleksi users.");
    console.log("Ini berarti Rules Firestore sudah benar dan terbuka.");
    process.exit(0);
  } catch (error) {
    console.error("❌ GAGAL! Error dari Firebase:", error.message);
    console.log("\nIni berarti Rules Firestore di project 'cavent-513a5' MASIH TERTUTUP.");
    process.exit(1);
  }
}

testConnection();
