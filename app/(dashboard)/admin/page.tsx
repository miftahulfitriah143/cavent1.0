"use client"

import { useEffect, useState } from 'react'
import { db } from '@/lib/firebase'
import { collection, query, onSnapshot, orderBy, limit, where } from 'firebase/firestore'
import { CalendarDays, GraduationCap, Building, Clock, CheckCircle, Ticket, BarChart3, Users, Bell, FileText, ChevronRight, CheckCircle2, XCircle } from 'lucide-react'
import { Event, UserProfile } from '@/types'
import Link from 'next/link'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalEvents: 0,
    ongoingEvents: 0,
    pendingEvents: 0,
    totalStudents: 0,
    totalOrganizers: 0,
    totalRegistrations: 0,
  })
  
  const [events, setEvents] = useState<any[]>([])
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [recentUsers, setRecentUsers] = useState<any[]>([])
  const [recentNotifications, setRecentNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Fetch all events for stats & chart
    const qEvents = query(collection(db, 'events'))
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
      setEvents(allEvents)
      
      // Calculate Event Stats
      let total = 0
      let ongoing = 0
      let pending = 0
      let totalReg = 0
      const now = new Date()

      allEvents.forEach(data => {
        total++
        if (data.status === 'pending') pending++
        
        const endDate = data.endDate instanceof Date 
          ? data.endDate 
          : (data.endDate?.toDate?.() || new Date(0))
          
        if (data.status === 'approved' || data.status === 'published') {
          if (endDate >= now) ongoing++
        }

        if (data.registeredCount) {
          totalReg += data.registeredCount
        }
      })

      // Update Recent Events (sort manually since we fetch all for stats)
      const sortedEvents = [...allEvents].sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      }).slice(0, 5)
      
      setRecentEvents(sortedEvents)

      setStats(prev => ({
        ...prev,
        totalEvents: total,
        ongoingEvents: ongoing,
        pendingEvents: pending,
        totalRegistrations: totalReg
      }))
    })

    // 2. Fetch all users for stats & recent
    const qUsers = query(collection(db, 'users'))
    const unsubUsers = onSnapshot(qUsers, (snapshot) => {
      let students = 0
      let organizers = 0
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
      
      allUsers.forEach(data => {
        if (data.role === 'mahasiswa') students++
        if (data.role === 'organizer') organizers++
      })

      const sortedUsers = [...allUsers].sort((a, b) => {
        const dateA = a.createdAt?.seconds || 0
        const dateB = b.createdAt?.seconds || 0
        return dateB - dateA
      }).slice(0, 5)

      setRecentUsers(sortedUsers)

      setStats(prev => ({
        ...prev,
        totalStudents: students,
        totalOrganizers: organizers
      }))
    })

    // 3. Fetch Recent Notifications
    const qNotifs = query(collection(db, 'notifications'), where("targetRole", "==", "admin"))
    const unsubNotifs = onSnapshot(qNotifs, (snapshot) => {
       const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
       const sortedNotifs = notifs.sort((a, b) => {
         const dateA = a.createdAt?.seconds || 0
         const dateB = b.createdAt?.seconds || 0
         return dateB - dateA
       }).slice(0, 5)
       setRecentNotifications(sortedNotifs)
       setLoading(false)
    })

    return () => {
      unsubEvents()
      unsubUsers()
      unsubNotifs()
    }
  }, [])

  // --- Bar Chart Calculation ---
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"]
  const eventsPerMonthMap: Record<string, any> = {}

  monthNames.forEach((month) => {
    eventsPerMonthMap[month] = { name: month, total: 0 }
  })

  events.forEach((event) => {
    if (event.createdAt) {
      const date = event.createdAt.seconds
        ? new Date(event.createdAt.seconds * 1000)
        : new Date(event.createdAt)

      const monthIdx = date.getMonth()
      const monthName = monthNames[monthIdx]
      if (eventsPerMonthMap[monthName]) {
        eventsPerMonthMap[monthName].total += 1
      }
    }
  })

  const barChartData = Object.values(eventsPerMonthMap)

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto pb-10 space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Admin</h1>
        <p className="mt-2 text-neutral">Ringkasan statistik dan aktivitas platform Cavent secara real-time.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <CalendarDays className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Total Acara</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.totalEvents}</h3>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 shrink-0">
            <CheckCircle className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Acara Berjalan</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.ongoingEvents}</h3>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600 shrink-0">
            <Clock className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Menunggu Persetujuan</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.pendingEvents}</h3>
          </div>
        </div>
        
        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 shrink-0">
            <Ticket className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Total Pendaftaran</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.totalRegistrations}</h3>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-sm border border-neutral-100 p-6 flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-14 w-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
            <GraduationCap className="h-7 w-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral">Total Mahasiswa</p>
            <h3 className="text-3xl font-bold text-foreground">{stats.totalStudents}</h3>
          </div>
        </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Chart & Latest Events) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Chart */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark">Tren Pengajuan Acara</h3>
                  <p className="text-xs text-neutral">Total acara diajukan per bulan</p>
                </div>
              </div>
              <Link href="/admin/analytics" className="text-sm font-bold text-primary hover:text-primary-600 flex items-center gap-1 transition-colors">
                Detail <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <RechartsTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="total" name="Total Acara" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Latest Events */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark">Acara Terbaru</h3>
                  <p className="text-xs text-neutral">Pengajuan acara terakhir</p>
                </div>
              </div>
              <Link href="/admin/approval" className="text-sm font-bold text-primary hover:text-primary-600 flex items-center gap-1 transition-colors">
                Approval <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white border-b border-gray-100 text-[10px] font-bold text-neutral uppercase tracking-wider">
                    <th className="p-4">Acara</th>
                    <th className="p-4">Penyelenggara</th>
                    <th className="p-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentEvents.length > 0 ? (
                    recentEvents.map(event => (
                      <tr key={event.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-dark text-sm max-w-[200px] truncate">{event.title}</td>
                        <td className="p-4 text-xs text-neutral">{event.organizerName || '-'}</td>
                        <td className="p-4">
                          {event.status === "published" || event.status === "approved" ? (
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">Disetujui</span>
                          ) : event.status === "pending" ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full">Menunggu</span>
                          ) : event.status === "rejected" ? (
                            <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-full">Ditolak</span>
                          ) : (
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full">Draft</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-sm text-neutral">Belum ada acara</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
        </div>

        {/* Right Column (Users & Notifications) */}
        <div className="lg:col-span-1 space-y-8">
          
          {/* Notifications Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Bell className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark">Aktivitas Baru</h3>
                  <p className="text-xs text-neutral">Notifikasi sistem</p>
                </div>
              </div>
              <Link href="/admin/notifications" className="text-sm font-bold text-primary hover:text-primary-600 flex items-center gap-1 transition-colors">
                Semua <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-4">
              {recentNotifications.length > 0 ? (
                recentNotifications.map(notif => (
                  <div key={notif.id} className="flex gap-3 items-start">
                    <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    <div>
                      <p className="text-sm font-bold text-dark leading-tight mb-1">{notif.title}</p>
                      <p className="text-xs text-neutral line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-neutral py-4">Belum ada notifikasi.</p>
              )}
            </div>
          </div>

          {/* Users Widget */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Users className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark">Pengguna Baru</h3>
                  <p className="text-xs text-neutral">Pendaftar terbaru</p>
                </div>
              </div>
              <Link href="/admin/users" className="text-sm font-bold text-primary hover:text-primary-600 flex items-center gap-1 transition-colors">
                Kelola <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="p-4 space-y-4">
              {recentUsers.length > 0 ? (
                recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt={u.displayName} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-primary text-white font-bold text-sm">
                          {u.displayName ? u.displayName.charAt(0).toUpperCase() : "U"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-bold text-dark truncate">{u.displayName || "Tanpa Nama"}</p>
                      <p className="text-xs text-neutral truncate">{u.email}</p>
                    </div>
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        u.role === 'organizer' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role || 'mahasiswa'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-sm text-neutral py-4">Belum ada pengguna.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
