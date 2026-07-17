import { Metadata } from "next";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    const docRef = doc(db, "events", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const event = docSnap.data();
      return {
        title: `${event.title} - Cavent`,
        description: event.tagline || `Ikuti acara ${event.title} di Cavent. ${event.description?.substring(0, 100)}...`,
        openGraph: {
          title: event.title,
          description: event.tagline || `Ikuti acara ${event.title} di Cavent.`,
          images: [
            {
              url: event.bannerUrl || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop",
              width: 1200,
              height: 630,
              alt: event.title,
            },
          ],
        },
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "Event - Cavent",
    description: "Detail acara di platform Cavent",
  };
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
