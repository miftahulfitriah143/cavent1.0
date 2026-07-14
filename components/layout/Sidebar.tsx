"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import {
  Home,
  Calendar,
  Users,
  Settings,
  FileText,
  BarChart,
  QrCode,
  LogOut,
  Menu,
  X,
  Bell,
  LayoutGrid,
  Plus,
  Globe
} from "lucide-react";
import { useState, useEffect } from "react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);

  // Auto-close sidebar di mobile kalau rute berubah
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Real-time Badge Counts
  useEffect(() => {
    if (!user) return;

    let unsubNotif = () => { };
    let unsubApproval = () => { };

    // Notifications Count Listener
    if (role === "admin") {
      const notifQuery = query(collection(db, "notifications"), where("targetRole", "==", "admin"), where("status", "==", "unread"));
      unsubNotif = onSnapshot(notifQuery, (snapshot) => {
        setUnreadNotifCount(snapshot.docs.length);
      });

      // Approval Count Listener (only for admin)
      const approvalQuery = query(collection(db, "events"), where("status", "==", "pending"));
      unsubApproval = onSnapshot(approvalQuery, (snapshot) => {
        setPendingApprovalCount(snapshot.docs.length);
      });
    } else if (role === "organizer") {
      const notifQuery = query(collection(db, "notifications"), where("userId", "==", user.uid), where("status", "==", "unread"));
      unsubNotif = onSnapshot(notifQuery, (snapshot) => {
        setUnreadNotifCount(snapshot.docs.length);
      });
    }

    return () => {
      unsubNotif();
      unsubApproval();
    };
  }, [user, role]);

  const adminGroups: NavGroup[] = [
    {
      label: "MENU UTAMA",
      items: [
        { name: "Dasbor", href: "/admin", icon: <Home className="h-4 w-4" /> },
        { name: "Approval Acara", href: "/admin/approval", icon: <FileText className="h-4 w-4" />, badge: pendingApprovalCount },
        { name: "Manajemen Akun", href: "/admin/users", icon: <Users className="h-4 w-4" /> },
      ]
    },
    {
      label: "LAPORAN",
      items: [
        { name: "Analitik", href: "/admin/analytics", icon: <BarChart className="h-4 w-4" /> },
      ]
    },
    {
      label: "LAINNYA",
      items: [
        { name: "Beranda Acara", href: "/", icon: <Globe className="h-4 w-4" /> },
        { name: "Notifikasi", href: "/admin/notifications", icon: <Bell className="h-4 w-4" />, badge: unreadNotifCount },
        { name: "Pengaturan", href: "/admin/settings", icon: <Settings className="h-4 w-4" /> },
      ]
    }
  ];

  const organizerGroups: NavGroup[] = [
    {
      label: "MENU UTAMA",
      items: [
        { name: "Dashboard", href: "/organizer", icon: <LayoutGrid className="h-4 w-4" /> },
        { name: "Buat Acara", href: "/organizer/events/new", icon: <Plus className="h-4 w-4" /> },
        { name: "Acara Saya", href: "/organizer/events", icon: <Calendar className="h-4 w-4" /> },
      ]
    },
    {
      label: "LAPORAN",
      items: [
        { name: "Analitik", href: "/organizer/analytics", icon: <BarChart className="h-4 w-4" /> },
        { name: "Peserta", href: "/organizer/attendees", icon: <Users className="h-4 w-4" /> },
      ]
    },
    {
      label: "LAINNYA",
      items: [
        { name: "Beranda Acara", href: "/", icon: <Globe className="h-4 w-4" /> },
        { name: "Notifikasi", href: "/organizer/notifications", icon: <Bell className="h-4 w-4" />, badge: unreadNotifCount },
        { name: "Pengaturan", href: "/organizer/settings", icon: <Settings className="h-4 w-4" /> },
      ]
    }
  ];

  const mahasiswaGroups: NavGroup[] = [
    {
      label: "MENU UTAMA",
      items: [
        { name: "Eksplor Acara", href: "/mahasiswa", icon: <Home className="h-4 w-4" /> },
        { name: "Tiket Saya", href: "/mahasiswa/tickets", icon: <Calendar className="h-4 w-4" /> },
        { name: "Scan QR Absensi", href: "/mahasiswa/scan", icon: <QrCode className="h-4 w-4" /> },
      ]
    }
  ];

  let groups: NavGroup[] = [];
  if (role === "admin") groups = adminGroups;
  else if (role === "organizer") groups = organizerGroups;
  else if (role === "mahasiswa") groups = mahasiswaGroups;

  // Mapping role ke label
  const roleLabels: Record<string, string> = {
    admin: "Admin",
    organizer: "Penyelenggara",
    mahasiswa: "Mahasiswa",
  };
  const displayRole = role ? roleLabels[role] || role : "Pengguna";

  return (
    <>
      {/* Mobile Menu Button - Diposisikan di Navbar */}
      <div className="lg:hidden fixed top-0 left-0 z-[60] h-16 flex items-center pl-4 pr-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1.5 rounded-md bg-white border border-gray-200 shadow-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Overlay untuk Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-100 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex h-full flex-col">

          {/* User Profile Area */}
          <div className="flex items-center gap-4 px-6 py-8 border-b border-gray-100">
            {/* Avatar */}
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-secondary">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-white font-bold text-lg">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            {/* Name & Role */}
            <div className="flex flex-col">
              <span className="font-bold text-dark text-sm truncate w-36">
                {user?.displayName || "Pengguna"}
              </span>
              <span className="text-xs text-neutral capitalize">
                {displayRole}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            {groups.map((group, idx) => (
              <div key={idx} className="mb-8">
                <h3 className="px-3 mb-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {group.label}
                </h3>
                <nav className="space-y-1">
                  {group.items.map((link) => {
                    // Kumpulkan semua item dari semua grup untuk pengecekan nested routes yang akurat
                    const allItems = groups.flatMap(g => g.items);
                    
                    const isActive = pathname === link.href ||
                      (pathname.startsWith(link.href + "/") &&
                        !allItems.some(other => 
                          other.href !== link.href && 
                          other.href.length > link.href.length && 
                          pathname.startsWith(other.href)
                        ));

                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                          ${isActive
                            ? "bg-primary-50 text-primary shadow-sm"
                            : "text-neutral hover:bg-gray-50 hover:text-dark"
                          }
                        `}
                      >
                        <div className={`${isActive ? "text-primary" : "text-gray-400"}`}>
                          {link.icon}
                        </div>
                        <span className="flex-1">{link.name}</span>
                        {link.badge !== undefined && link.badge > 0 && (
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center shrink-0">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-100 mb-4">
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
