import { api } from './api'
import type { StudentAnnouncement, StudentClass, StudentDashboard, StudentRecitation } from '../types/student'

function authHeaders(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` }
}

export async function getMyClasses(accessToken: string) {
  const response = await api.get<StudentClass[]>('/students/me/classes', {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function getMyDashboard(accessToken: string, classId: string) {
  const response = await api.get<StudentDashboard>(`/students/me/dashboard/${classId}`, {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function getMyRecitations(accessToken: string, classId?: string) {
  const response = await api.get<StudentRecitation[]>('/students/me/recitations', {
    headers: authHeaders(accessToken),
    params: classId ? { classId } : undefined
  })
  return response.data
}

export async function getMyAnnouncements(accessToken: string, classId: string) {
  const response = await api.get<StudentAnnouncement[]>('/students/me/announcements', {
    headers: authHeaders(accessToken),
    params: { classId }
  })
  return response.data
}

export async function getMyUnreadAnnouncementCount(accessToken: string) {
  const response = await api.get<{ unreadCount: number }>('/students/me/announcements/unread-count', {
    headers: authHeaders(accessToken)
  })
  return response.data
}

export async function markMyAnnouncementsRead(accessToken: string, payload: { classId: string; announcementIds?: string[] }) {
  const response = await api.post<{ markedRead: number }>('/students/me/announcements/read', payload, {
    headers: authHeaders(accessToken)
  })
  return response.data
}
