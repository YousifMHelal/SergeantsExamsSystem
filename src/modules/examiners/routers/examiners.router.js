import { Router } from 'express'
import { uploadMiddleware } from '../../common/middlewares/multer.middleware.js'
import { authenticatedApi, adminApi, authenticatedPage, adminPage } from '../../authentication/middlewares/authentication.middlewares.js'
import { 
    uploadExaminersFile, getExaminers, viewExaminersPage, deleteExaminer,
    generateUsers, downloadTemplate, downloadExaminersPasswords
} from '../controllers/examiners.controller.js'

const router = Router()

// Pages
router.get('/admin/examiners', authenticatedPage, adminPage, viewExaminersPage)

// APIs
router.post('/api/admin/examiners/upload', authenticatedApi, adminApi, uploadMiddleware.single('file'), uploadExaminersFile)
router.get('/api/admin/examiners', authenticatedApi, adminApi, getExaminers)
router.delete('/api/admin/examiners/:id', authenticatedApi, adminApi, deleteExaminer)
router.get('/api/admin/examiners/generate', authenticatedApi, adminApi, generateUsers)
router.get('/api/admin/examiners/download', authenticatedApi, adminApi, downloadExaminersPasswords)
router.get('/api/admin/examiners/template', authenticatedApi, adminApi, downloadTemplate)

export default router