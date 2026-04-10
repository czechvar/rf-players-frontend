// ===== User / Auth Types =====

export type UserRole = 'admin' | 'trainer' | 'player' | 'parent'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
  firstName?: string
  lastName?: string
}

export interface PlayerPhoto {
  id: string
  url: string
  filename: string
}

export interface UserDoc {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  dateOfBirth?: string
  phoneNumber?: string
  active: boolean
  isApproved: boolean
  parentId?: string | UserDoc
  playerIds?: string[] | UserDoc[]
  photo?: PlayerPhoto
  createdAt: string
  updatedAt: string
}

/** Alias kept for backward-compat — same shape as UserDoc filtered to role=player */
export type PlayerDoc = UserDoc

// ===== Event Types =====

export type EventType = 'practice' | 'game' | 'tournament' | 'meeting'

export interface EventDoc {
  id: string
  name: string
  date: string
  type: EventType
  location: string
  description?: string
  locked: boolean
  createdAt: string
  updatedAt: string
}

// ===== Attendance Types =====

export type AttendanceStatus = 'pending' | 'attending' | 'declined' | 'attended' | 'excused'

export interface AttendanceRecord {
  id: string
  eventId: string | EventDoc
  playerId: string | PlayerDoc
  status: AttendanceStatus
  notes?: string
  updatedBy: string
  updatedAt: string
}

// ===== API Response Types =====

export interface PaginatedResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  pagingCounter: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface LockResponse {
  success: boolean
  message: string
  event: EventDoc
}
