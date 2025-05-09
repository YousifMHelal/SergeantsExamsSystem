import { Router } from 'express'
import { adminApi, adminPage, authenticatedApi, authenticatedPage } from '../../authentication/middlewares/authentication.middlewares.js'
import { addCourse, deleteCourse, getCourse, getCourses, updateCourse, viewCoursePage, viewCoursesPage } from '../controllers/admin.course.controller.js'

const router = Router()

// Pages
router.get('/admin/course', authenticatedPage, adminPage, viewCoursesPage)
router.get('/admin/course/:id', authenticatedPage, adminPage, viewCoursePage)

// APIs
router.get('/api/admin/course', authenticatedApi, adminApi, getCourses)
router.post('/api/admin/course', authenticatedApi, adminApi, addCourse)
router.get('/api/admin/course/:id', authenticatedApi, adminApi, getCourse)
router.put('/api/admin/course/:id', authenticatedApi, adminApi, updateCourse)
router.delete('/api/admin/course/:id', authenticatedApi, adminApi, deleteCourse)

export default router