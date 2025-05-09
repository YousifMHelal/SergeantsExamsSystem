import cors from 'cors'
import dotenv from 'dotenv'
import cookie from 'cookie-parser'
import express from 'express'
import homeRouter from './modules/home/routers/home.router.js'
import videoRouter from './modules/videos/routers/video.router.js'
import groupsRouter from './modules/groups/routers/group.router.js'
import profileRouter from './modules/profile/routers/profile.router.js'
import coursesRouter from './modules/courses/routers/course.router.js'
import lectureRouter from './modules/lectures/routers/lecture.router.js'
import documentRouter from './modules/lectures/routers/document.router.js'
import adminVideoRouter from './modules/videos/routers/admin.video.router.js'
import adminExamsRouter from './modules/exams/routers/admin.exams.router.js'
import exampinersRouter from './modules/examiners/routers/examiners.router.js'
import adminLectureRouter from './modules/lectures/routers/admin.lecture.router.js'
import adminCoursesRouter from './modules/courses/routers/admin.course.router.js'
import adminDocumentRouter from './modules/lectures/routers/admin.document.router.js'
import examinerExamsRouter from './modules/exams/routers/examiner.exams.router.js'
import authenticationRouter from './modules/authentication/routers/authentication.router.js'
import { initializeAdminUserIfNotExists } from './utils/starter.utils.js'

dotenv.config()

const port = process.env.PORT ?? 3000
const app = express()

app.use(cors())
app.use(cookie())
app.use(express.json())

app.use(express.static('src/modules/home/assets'))
app.use(express.static('src/modules/exams/assets'))
app.use(express.static('src/modules/common/assets'))
app.use(express.static('src/modules/courses/assets'))
app.use(express.static('src/modules/lectures/assets'))
app.use(express.static('src/modules/examiners/assets'))
app.use(express.static('src/modules/authentication/assets'))

app.use(homeRouter)
app.use(videoRouter)
app.use(groupsRouter)
app.use(profileRouter)
app.use(coursesRouter)
app.use(lectureRouter)
app.use(documentRouter)
app.use(adminVideoRouter)
app.use(adminExamsRouter)
app.use(exampinersRouter)
app.use(adminLectureRouter)
app.use(adminCoursesRouter)
app.use(adminDocumentRouter)
app.use(examinerExamsRouter)
app.use(authenticationRouter)

app.get('*', (_, response) => (response.status(404).render('../src/modules/common/views/not.found.view.ejs')))

app.listen(port, () => console.log(`Server is running on port ${port}`))

initializeAdminUserIfNotExists()