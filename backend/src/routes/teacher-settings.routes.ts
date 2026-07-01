import { Router } from 'express'
import { getTeacherSettings, updateTeacherSettings } from '../controllers/teacher-settings.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { teacherSettingsUpdateSchema } from '../validators/teacher-settings.js'

export const teacherSettingsRouter = Router()

teacherSettingsRouter.use(authenticate, authorize('TEACHER'))
teacherSettingsRouter.get('/', getTeacherSettings)
teacherSettingsRouter.put('/', validate(teacherSettingsUpdateSchema), updateTeacherSettings)

