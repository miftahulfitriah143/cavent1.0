"use client"

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { CalendarDays, GraduationCap, Building, Clock, CheckCircle, Ticket } from 'lucide-react'
import { Event, UserProfile } from '@/types'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    ongoingEvents: 0,
    pendingEvents: 0,
    totalStudents: 0,
    totalOrganizers: 0,
    totalRegistrations: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        
        // Fetch Users
        const usersSnapshot = await getDocs(collection(db, 'users'))
        let students = 0
        let organizers = 0
        usersSnapshot.forEach(doc => {
          const data = doc.data() as UserProfile
          if (data.role === 'mahasiswa') students++
          if (data.role === 'organizer') organizers++
        })

        // Fetch Events
        const eventsSnapshot = await getDocs(collection(db, 'events'))
        let total = 0
        let ongoing = 0
        let pending = 0
        let totalReg = 0
        const now = new Date()

        eventsSnapshot.forEach(doc => {
          const data = doc.data() as Event
          total++
          
          if (data.status === 'pending') pending++
          
          // Consider ongoing if status is approved and endDate is in the future
          const endDate = data.endDate instanceof Date 
            ? data.endDate 
            : (data.endDate as any)?.toDate?.() || new Date(0)
            
          if (data.status === 'approved' && endDate >= now) {
             ongoing++
          }

          if (data.registeredCount) {
             totalReg += data.registeredCount
          }
        })

        setStats({
          totalEvents: total,
          ongoingEvents: ongoing,
          pendingEvents: pending,
          totalStudents: students,
          totalOrganizers: organizers,
          totalRegistrations: totalReg
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Admin</h1>
        <p className="mt-2 text-neutral">Ringkasan statistik dan aktivitas platform Cavent secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {/* Card Total Events */}
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarDays className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Total Acara</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.totalEvents}</h3>
          </div>
        </div>

        {/* Card Ongoing Events */}
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Acara Berjalan</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.ongoingEvents}</h3>
          </div>
        </div>

        {/* Card Pending Events */}
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Menunggu Persetujuan</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.pendingEvents}</h3>
          </div>
        </div>
        
        {/* Card Total Registrations */}
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
            <Ticket className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Total Pendaftaran</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.totalRegistrations}</h3>
          </div>
        </div>

        {/* Card Total Students */}
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Total Mahasiswa</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.totalStudents}</h3>
          </div>
        </div>

        {/* Card Total Organizers */}
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Building className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Total Penyelenggara</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.totalOrganizers}</h3>
          </div>
        </div>
      </div>

      {/* Suggestions Section */}
      <div className="mt-8 bg-primary-50 rounded-2xl p-8 border border-primary-100">
        <h2 className="text-2xl font-bold mb-6 text-primary-900">Saran Pengembangan Dashboard Admin (Next Steps)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-primary-100">
            <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Grafik Analitik
            </h3>
            <p className="text-neutral text-sm">
              Tambahkan chart (misal menggunakan Recharts atau Chart.js) untuk menampilkan tren pendaftaran acara per bulan dan pertumbuhan jumlah pengguna baru.
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-primary-100">
            <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Tabel Acara Terbaru
            </h3>
            <p className="text-neutral text-sm">
              Tampilkan 5 acara terakhir yang diajukan beserta status persetujuannya agar admin dapat langsung melakukan tindakan persetujuan (Approve/Reject) dari dashboard.
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-primary-100">
            <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Manajemen Pengguna Terpadu
            </h3>
            <p className="text-neutral text-sm">
              Buat tabel yang menampilkan daftar mahasiswa dan penyelenggara terbaru, dengan opsi pencarian, pemfilteran, dan kemampuan menonaktifkan akun yang melanggar.
            </p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-primary-100">
            <h3 className="font-semibold text-lg text-primary flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Log Aktivitas & Notifikasi
            </h3>
            <p className="text-neutral text-sm">
              Timeline atau log sederhana yang mencatat aktivitas penting, seperti &quot;Penyelenggara X baru saja membuat Acara Y&quot; untuk pemantauan keamanan.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
