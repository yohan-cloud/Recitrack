export type Section = {
  id: string
  name: string
  gradeLevel: string
  createdAt: string
  _count?: {
    students: number
    classes: number
  }
}

export type TeacherClass = {
  id: string
  sectionId: string
  subjectName: string
  scheduleDay: string
  scheduleTime: string
  createdAt: string
  section: Section
  _count?: {
    classStudents: number
    recitations: number
  }
}

export type Announcement = {
  id: string
  teacherId: string
  classId: string
  sectionId: string
  title: string
  message: string
  type: 'NORMAL' | 'IMPORTANT' | 'REMINDER' | 'ASSIGNMENT'
  expiresAt: string | null
  readCount?: number
  unreadCount?: number
  createdAt: string
  updatedAt: string
  class: TeacherClass
  section: Section
}

export type AnnouncementPayload = {
  classId: string
  title: string
  message: string
  type: 'NORMAL' | 'IMPORTANT' | 'REMINDER' | 'ASSIGNMENT'
  expiresAt: string
}

export type ClassDashboard = {
  class: TeacherClass
  stats: {
    totalStudents: number
    todayRecitations: number
    participationRate: number
    mostActiveStudent: null | {
      id: string
      name: string
      recitations: number
      points: number
    }
  }
  recentRecitations: Array<{
    id: string
    points: number
    remarks: string | null
    recitationDate: string
    student: {
      firstName: string
      lastName: string
    }
  }>
}

export type ClassStudent = {
  id: string
  student: {
    id: string
    studentNumber: string
    firstName: string
    lastName: string
    sectionId: string
    section?: Section
  }
}

export type ClassDetails = TeacherClass & {
  classStudents: ClassStudent[]
  recitations: Recitation[]
}

export type Recitation = {
  id: string
  studentId: string
  classId: string
  teacherId: string
  points: number
  remarks: string | null
  recitationDate: string
  createdAt: string
  student: {
    id: string
    firstName: string
    lastName: string
    studentNumber: string
  }
}

export type TeacherStudent = {
  id: string
  userId: string
  studentNumber: string
  firstName: string
  lastName: string
  email: string | null
  sectionId: string
  user: {
    id: string
    username: string
    isFirstLogin: boolean
    createdAt?: string
  }
  section: Section
  classStudents: Array<{
    id: string
    class: TeacherClass
  }>
}

export type StudentCreatePayload = {
  username: string
  studentNumber: string
  firstName: string
  lastName: string
  email?: string
  sectionId: string
  classIds: string[]
}

export type StudentUpdatePayload = {
  studentNumber?: string
  firstName?: string
  lastName?: string
  email?: string | null
  sectionId?: string
  classIds?: string[]
}

export type StudentCreateResponse = {
  temporaryPassword: string
  student: {
    id: string
    userId: string
    studentNumber: string
    firstName: string
    lastName: string
    email: string | null
    sectionId: string
  }
  user: {
    id: string
    username: string
    isFirstLogin: boolean
  }
}

export type SectionPayload = {
  name: string
  gradeLevel: string
}

export type ClassPayload = {
  sectionId: string
  subjectName: string
  scheduleDay: string
  scheduleTime: string
}

export type ClassReport = {
  class: TeacherClass
  stats: {
    totalStudents: number
    totalRecitations: number
    totalPoints: number
    participationRate: number
    inactiveStudents: number
  }
  dailyTrend: Array<{
    date: string
    recitations: number
    points: number
  }>
  topStudents: ReportStudentRow[]
  inactiveStudents: ReportStudentRow[]
  students: ReportStudentRow[]
}

export type ReportStudentRow = {
  studentId: string
  studentNumber: string
  name: string
  recitations: number
  points: number
  lastRecitationDate: string | null
  rank: number
}

export type StudentReport = {
  student: TeacherStudent
  stats: {
    totalRecitations: number
    totalPoints: number
    classesWithRecords: number
  }
  recitations: Array<Recitation & { class: TeacherClass }>
}

export type TeacherPreferences = {
  sorting: 'alphabetical' | 'studentNumber' | 'mostRecitations'
  dashboardView: 'today' | 'total'
  excludeAbsent: boolean
  avoidConsecutive: boolean
  excludeRecent: boolean
  resetDaily: boolean
  notificationDuration: number
  theme: 'light' | 'dark'
  animations: boolean
}

export type TeacherSettings = {
  firstName: string
  lastName: string
  email: string
  school: string
  preferences: TeacherPreferences
}
