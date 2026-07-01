import { Router } from 'express'
import {
  createClass,
  deleteClass,
  getClass,
  getClassDashboard,
  listClasses,
  updateClass
} from '../controllers/classes.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { classCreateSchema, classUpdateSchema } from '../validators/classes.js'

export const classesRouter = Router()

classesRouter.use(authenticate, authorize('TEACHER'))
classesRouter.get('/', listClasses)
classesRouter.post('/', validate(classCreateSchema), createClass)
classesRouter.get('/:id', getClass)
classesRouter.get('/:id/dashboard', getClassDashboard)
classesRouter.put('/:id', validate(classUpdateSchema), updateClass)
classesRouter.delete('/:id', deleteClass)
