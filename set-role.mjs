import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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

async function setRole() {
  console.log("Mencari user dengan email mita@paramadina.ac.id...");
  try {
    const q = query(collection(db, "users"), where("email", "==", "mita@paramadina.ac.id"));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log("❌ Akun belum ada di Firestore! Silakan daftar (Register) dulu di web dengan email ini.");
    } else {
      querySnapshot.forEach(async (document) => {
        const userRef = doc(db, "users", document.id);
        await updateDoc(userRef, {
          role: "organizer",
          emailVerified: true
        });
        console.log(`✅ Berhasil! Akun ${document.id} sekarang memiliki role: organizer dan sudah terverifikasi.`);
      });
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

setRole();
