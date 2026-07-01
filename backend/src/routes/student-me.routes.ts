import { Router } from 'express'
import { getMyDashboard, getMyUnreadAnnouncementCount, listMyAnnouncements, listMyClasses, listMyRecitations, markMyAnnouncementsRead } from '../controllers/student-me.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { markAnnouncementsReadSchema } from '../validators/student-announcements.js'

export const studentMeRouter = Router()

studentMeRouter.use(authenticate, authorize('STUDENT'))
studentMeRouter.get('/classes', listMyClasses)
studentMeRouter.get('/dashboard/:classId', getMyDashboard)
studentMeRouter.get('/recitations', listMyRecitations)
studentMeRouter.get('/announcements', listMyAnnouncements)
studentMeRouter.get('/announcements/unread-count', getMyUnreadAnnouncementCount)
studentMeRouter.post('/announcements/read', validate(markAnnouncementsReadSchema), markMyAnnouncementsRead)
