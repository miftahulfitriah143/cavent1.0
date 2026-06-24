"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useState } from "react";
import toast from "react-hot-toast";

export default function ForceRole() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const makeOrganizer = async () => {
    if (!user) return toast.error("Please login first");
    
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        role: "organizer"
      });
      toast.success("Role successfully changed to Organizer! Please logout and login again.");
    } catch (e: any) {
      toast.error(e.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Development Tool</h1>
      <p className="mb-4">Logged in as: {user ? user.email : "Not logged in"}</p>
      <button 
        onClick={makeOrganizer} 
        disabled={loading || !user}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        {loading ? "Updating..." : "Ubah Akun Ini Jadi Penyelenggara (Organizer)"}
      </button>
    </div>
  );
}
