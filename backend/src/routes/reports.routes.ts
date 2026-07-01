import { Router } from 'express'
import { getClassReport, getStudentReport } from '../controllers/reports.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'

export const reportsRouter = Router()

reportsRouter.use(authenticate, authorize('TEACHER'))
reportsRouter.get('/class/:classId', getClassReport)
reportsRouter.get('/student/:studentId', getStudentReport)
