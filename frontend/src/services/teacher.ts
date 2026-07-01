import { api } from './api'
import type {
  Announcement,
  AnnouncementPayload,
  ClassDashboard,
  ClassDetails,
  Recitation,
  Section,
  ClassPayload,
  ClassReport,
  SectionPayload,
  StudentCreatePayload,
  StudentCreateResponse,
  StudentReport,
  StudentUpdatePayload,
  TeacherClass,
  TeacherSettings,
  TeacherStudent
} from '../types/teacher'

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` }
}

export async function getSections(accessToken: string) {
  const response = await api.get<Section[]>('/sections', {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function createSection(accessToken: string, payload: SectionPayload) {
  const response = await api.post<Section>('/sections', payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function updateSection(accessToken: string, sectionId: string, payload: Partial<SectionPayload>) {
  const response = await api.put<Section>(`/sections/${sectionId}`, payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function deleteSection(accessToken: string, sectionId: string) {
  await api.delete(`/sections/${sectionId}`, {
    headers: authHeaders(accessToken)
  })
}

export async function getClasses(accessToken: string, sectionId?: string) {
  const response = await api.get<TeacherClass[]>('/classes', {
    headers: authHeaders(accessToken),
    params: sectionId ? { sectionId } : undefined
  })
  return response.data
}

export async function createClass(accessToken: string, payload: ClassPayload) {
  const response = await api.post<TeacherClass>('/classes', payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function updateClass(accessToken: string, classId: string, payload: Partial<ClassPayload>) {
  const response = await api.put<TeacherClass>(`/classes/${classId}`, payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function deleteClass(accessToken: string, classId: string) {
  await api.delete(`/classes/${classId}`, {
    headers: authHeaders(accessToken)
  })
}

export async function getClassDashboard(accessToken: string, classId: string) {
  const response = await api.get<ClassDashboard>(`/classes/${classId}/dashboard`, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function getClassDetails(accessToken: string, classId: string) {
  const response = await api.get<ClassDetails>(`/classes/${classId}`, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function getClassRecitations(accessToken: string, classId: string) {
  const response = await api.get<Recitation[]>(`/recitations/class/${classId}`, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function addRecitation(accessToken: string, payload: { classId: string; studentId: string; points?: number; remarks?: string }) {
  const response = await api.post<Recitation>('/recitations', payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function deleteRecitation(accessToken: string, recitationId: string) {
  await api.delete(`/recitations/${recitationId}`, {
    headers: authHeaders(accessToken)
  })
}

export async function getStudents(accessToken: string, params?: { sectionId?: string; classId?: string }) {
  const response = await api.get<TeacherStudent[]>('/students', {
    headers: authHeaders(accessToken),
    params
  })
  return response.data
}

export async function createStudent(accessToken: string, payload: StudentCreatePayload) {
  const response = await api.post<StudentCreateResponse>('/students', payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function updateStudent(accessToken: string, studentId: string, payload: StudentUpdatePayload) {
  const response = await api.put<TeacherStudent>(`/students/${studentId}`, payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function deleteStudent(accessToken: string, studentId: string) {
  await api.delete(`/students/${studentId}`, {
    headers: authHeaders(accessToken)
  })
}

export async function getClassReport(accessToken: string, classId: string, params?: { startDate?: string; endDate?: string }) {
  const response = await api.get<ClassReport>(`/reports/class/${classId}`, {
    headers: authHeaders(accessToken),
    params
  })
  return response.data
}

export async function getStudentReport(accessToken: string, studentId: string, params?: { classId?: string; startDate?: string; endDate?: string }) {
  const response = await api.get<StudentReport>(`/reports/student/${studentId}`, {
    headers: authHeaders(accessToken),
    params
  })
  return response.data
}

export async function getTeacherSettings(accessToken: string) {
  const response = await api.get<TeacherSettings>('/teacher/settings', {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function getAnnouncements(accessToken: string, classId?: string) {
  const response = await api.get<Announcement[]>('/announcements', {
    headers: authHeaders(accessToken),
    params: classId ? { classId } : undefined
  })
  return response.data
}

export async function createAnnouncement(accessToken: string, payload: AnnouncementPayload) {
  const response = await api.post<Announcement>('/announcements', payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function updateAnnouncement(accessToken: string, announcementId: string, payload: Partial<AnnouncementPayload>) {
  const response = await api.put<Announcement>(`/announcements/${announcementId}`, payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function deleteAnnouncement(accessToken: string, announcementId: string) {
  await api.delete(`/announcements/${announcementId}`, {
    headers: authHeaders(accessToken)
  })
}

export async function updateTeacherSettings(accessToken: string, payload: TeacherSettings) {
  const response = await api.put<TeacherSettings>('/teacher/settings', payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}
