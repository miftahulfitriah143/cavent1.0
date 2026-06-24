import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';

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
const auth = getAuth(app);

async function resetPassword() {
  console.log("Mengirimkan email reset password ke mita@paramadina.ac.id...");
  try {
    await sendPasswordResetEmail(auth, "mita@paramadina.ac.id");
    console.log("✅ Email reset password berhasil dikirim!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Gagal mengirim email reset password:", error.message);
    process.exit(1);
  }
}

resetPassword();
