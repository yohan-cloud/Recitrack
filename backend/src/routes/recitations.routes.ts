import { Router } from 'express'
import { createRecitation, deleteRecitation, listClassRecitations } from '../controllers/recitations.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { recitationCreateSchema } from '../validators/recitations.js'

export const recitationsRouter = Router()

recitationsRouter.use(authenticate, authorize('TEACHER'))
recitationsRouter.post('/', validate(recitationCreateSchema), createRecitation)
recitationsRouter.delete('/:id', deleteRecitation)
recitationsRouter.get('/class/:classId', listClassRecitations)
