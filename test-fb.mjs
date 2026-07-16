import { initializeApp } from 'firebase/app'; 
import { getFirestore, getDoc, doc, collection, query, where, getDocs } from 'firebase/firestore'; 
const app = initializeApp({ 
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY, 
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID 
}); 
const db = getFirestore(app); 

async function run() {
  try {
    const d = await getDoc(doc(db, 'users', 'cJbe8LlwZWPYMWrL6T0JkaILEE72'));
    console.log("Doc Exists:", d.exists());
    if (d.exists()) console.log("Doc Data:", d.data());
  } catch(e) {
    console.error("Doc Error:", e.message);
  }

  try {
    const q = query(collection(db, 'users'), where("role", "==", "organizer"));
    const snap = await getDocs(q);
    console.log("Query count:", snap.size);
    snap.forEach(s => console.log(s.id, s.data()));
  } catch(e) {
    console.error("Query Error:", e.message);
  }
}
run();
