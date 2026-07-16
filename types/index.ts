// ============================================================
// Tipe Data Utama Cavent
// ============================================================

export type UserRole = 'admin' | 'organizer' | 'audiens'

export interface UserProfile {
  uid: string
  email: string
  displayName: string
  nim?: string          // Khusus audiens
  role: UserRole
  photoURL?: string
  createdAt: Date
}

export type EventStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface Event {
  id: string
  title: string
  description: string
  posterUrl?: string    // URL dari Cloudinary
  location: string
  startDate: Date
  endDate: Date
  capacity: number
  registeredCount: number
  status: EventStatus
  organizerId: string
  organizerName: string
  category: string
  tags: string[]
  // Tambahan untuk Task 8
  speakers?: string[]
  agenda?: { time: string; description: string }[]
  isFree: boolean
  price?: number
  registrationDeadline?: Date
  documentation?: {
    photos?: string[]
    video?: string
    gdriveLink?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface Registration {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  nim?: string
  status: 'registered' | 'attended' | 'cancelled'
  qrCode?: string
  registeredAt: Date
  attendedAt?: Date
}
