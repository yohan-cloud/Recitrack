import { Router } from 'express'
import { createSection, deleteSection, listSections, updateSection } from '../controllers/sections.controller.js'
import { authenticate } from '../middleware/authenticate.js'
import { authorize } from '../middleware/authorize.js'
import { validate } from '../middleware/validate.js'
import { sectionCreateSchema, sectionUpdateSchema } from '../validators/sections.js'

export const sectionsRouter = Router()

sectionsRouter.use(authenticate, authorize('TEACHER'))
sectionsRouter.get('/', listSections)
sectionsRouter.post('/', validate(sectionCreateSchema), createSection)
sectionsRouter.put('/:id', validate(sectionUpdateSchema), updateSection)
sectionsRouter.delete('/:id', deleteSection)
