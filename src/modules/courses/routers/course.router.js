import { Router } from 'express'
import { getCourse, getCourses, viewCoursePage, viewCoursesPage } from '../controllers/course.controller.js'

const router = Router()

// Pages
router.get('/courses', viewCoursesPage)
router.get('/courses/:id', viewCoursePage)

// APIs
router.get('/api/courses', getCourses)
router.get('/api/courses/:id', getCourse)

export default router