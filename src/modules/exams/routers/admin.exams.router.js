import { Router } from 'express'
import { uploadMiddleware } from '../../common/middlewares/multer.middleware.js'
import { authenticatedApi, adminApi, authenticatedPage, adminPage } from '../../authentication/middlewares/authentication.middlewares.js'
import {
    uploadExamsFile, viewExamsPage, getExams, getExam, deleteExam,
    updateExam, downloadTemplate, viewExamPage, getExamExaminersResults, downloadExamExaminersResults,
    downloadResults
} from '../controllers/admin.exams.controller.js'

const router = Router()

// Pages
router.get('/admin/exams', authenticatedPage, adminPage, viewExamsPage)
router.get('/admin/exams/:id', authenticatedPage, adminPage, viewExamPage)

// APIs
router.post('/api/admin/exams/upload', authenticatedApi, adminApi, uploadMiddleware.single('file'), uploadExamsFile)
router.get('/api/admin/exams/result', authenticatedApi, adminApi, downloadResults)
router.get('/api/admin/exams', authenticatedApi, adminApi, getExams)
router.get('/api/admin/exams/template', authenticatedApi, adminApi, downloadTemplate)
router.get('/api/admin/exams/:id', authenticatedApi, adminApi, getExam)
router.get('/api/admin/exams/:id/result', authenticatedApi, adminApi, getExamExaminersResults)
router.get('/api/admin/exams/:id/result/download', authenticatedApi, adminApi, downloadExamExaminersResults)
router.delete('/api/admin/exams/:id', authenticatedApi, adminApi, deleteExam)
router.put('/api/admin/exams/:id', authenticatedApi, adminApi, updateExam)

export default router