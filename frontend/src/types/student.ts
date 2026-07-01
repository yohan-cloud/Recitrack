import type { Announcement, Section } from './teacher'

export type StudentClass = {
  id: string
  sectionId: string
  subjectName: string
  scheduleDay: string
  scheduleTime: string
  createdAt: string
  section: Section
}

export type StudentRecitation = {
  id: string
  studentId: string
  classId: string
  teacherId: string
  points: number
  remarks: string | null
  recitationDate: string
  createdAt: string
  class: StudentClass
}

export type StudentDashboard = {
  class: StudentClass
  stats: {
    totalRecitations: number
    currentRank: number | null
    thisMonth: number
    classAverageParticipation: number
  }
  recentRecitations: StudentRecitation[]
}

export type StudentAnnouncement = Announcement & {
  isRead: boolean
  readAt: string | null
}
