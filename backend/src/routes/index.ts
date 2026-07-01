import { Router } from 'express'
import { authRouter } from './auth.routes.js'
import { announcementsRouter } from './announcements.routes.js'
import { classesRouter } from './classes.routes.js'
import { recitationsRouter } from './recitations.routes.js'
import { reportsRouter } from './reports.routes.js'
import { sectionsRouter } from './sections.routes.js'
import { studentMeRouter } from './student-me.routes.js'
import { studentsRouter } from './students.routes.js'
import { teacherSettingsRouter } from './teacher-settings.routes.js'

export const apiRouter = Router()

apiRouter.use('/auth', authRouter)
apiRouter.use('/announcements', announcementsRouter)
apiRouter.use('/sections', sectionsRouter)
apiRouter.use('/classes', classesRouter)
apiRouter.use('/students/me', studentMeRouter)
apiRouter.use('/students', studentsRouter)
apiRouter.use('/recitations', recitationsRouter)
apiRouter.use('/reports', reportsRouter)
apiRouter.use('/teacher/settings', teacherSettingsRouter)
