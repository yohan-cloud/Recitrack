import { Router } from 'express'
import { createStudent, deleteStudent, getStudent, listStudents, updateStudent } from '../controllers/students.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { studentCreateSchema, studentUpdateSchema } from '../validators/students.js'

export const studentsRouter = Router()

studentsRouter.use(authenticate, authorize('TEACHER'))
studentsRouter.get('/', listStudents)
studentsRouter.post('/', validate(studentCreateSchema), createStudent)
studentsRouter.get('/:id', getStudent)
studentsRouter.put('/:id', validate(studentUpdateSchema), updateStudent)
studentsRouter.delete('/:id', deleteStudent)
