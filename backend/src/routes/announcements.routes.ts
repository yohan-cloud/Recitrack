import { Router } from 'express'
import { createAnnouncement, deleteAnnouncement, listAnnouncements, updateAnnouncement } from '../controllers/announcements.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { announcementCreateSchema, announcementUpdateSchema } from '../validators/announcements.js'

export const announcementsRouter = Router()

announcementsRouter.use(authenticate, authorize('TEACHER'))
announcementsRouter.get('/', listAnnouncements)
announcementsRouter.post('/', validate(announcementCreateSchema), createAnnouncement)
announcementsRouter.put('/:id', validate(announcementUpdateSchema), updateAnnouncement)
announcementsRouter.delete('/:id', deleteAnnouncement)

