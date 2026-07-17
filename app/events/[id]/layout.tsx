import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  
  try {
    // Menggunakan Firebase REST API agar aman berjalan di Next.js Server Component
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    if (projectId) {
      const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events/${id}`;
      const res = await fetch(url, { next: { revalidate: 60 } }); // Cache 60 detik
      
      if (res.ok) {
        const data = await res.json();
        const fields = data.fields;
        
        if (fields) {
          const title = fields.title?.stringValue || "Event";
          const tagline = fields.tagline?.stringValue || "";
          const description = fields.description?.stringValue || "";
          const bannerUrl = fields.bannerUrl?.stringValue || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop";

          return {
            title: `${title} - Cavent`,
            description: tagline || `Ikuti acara ${title} di Cavent. ${description.substring(0, 100)}...`,
            openGraph: {
              title: title,
              description: tagline || `Ikuti acara ${title} di Cavent.`,
              images: [
                {
                  url: bannerUrl,
                  width: 1200,
                  height: 630,
                  alt: title,
                },
              ],
            },
          };
        }
      }
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  // Fallback (Kembali ke tulisan asli jika gagal)
  return {
    title: "Cavent - Pusat Informasi Kegiatan Universitas Paramadina",
    description: "Platform satu pintu untuk manajemen acara kampus.",
  };
}

export default function EventLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
