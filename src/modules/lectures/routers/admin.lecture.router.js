import { Router } from 'express'
import { uploadMiddleware } from '../../common/middlewares/multer.middleware.js'
import { authenticatedApi, adminApi, authenticatedPage, adminPage } from '../../authentication/middlewares/authentication.middlewares.js'
import { deleteLecture, getLecture, getLectures, updateLecture, uploadLecture, viewLecturePage, viewLecturesPage } from '../controllers/admin.lecture.controller.js'

const router = Router()

// Pages
router.get('/admin/lecture', authenticatedPage, adminPage, viewLecturesPage)
router.get('/admin/lecture/:id', authenticatedPage, adminPage, viewLecturePage)

// APIs
router.post('/api/admin/lecture/upload', authenticatedApi, adminApi, uploadMiddleware.single('document'), uploadLecture)
router.get('/api/admin/lecture', authenticatedApi, adminApi, getLectures)
router.get('/api/admin/lecture/:id', authenticatedApi, adminApi, getLecture)
router.put('/api/admin/lecture/:id', authenticatedApi, adminApi, updateLecture)
router.delete('/api/admin/lecture/:id', authenticatedApi, adminApi, deleteLecture)

export default router