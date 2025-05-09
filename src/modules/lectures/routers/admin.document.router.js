import { Router } from 'express'
import { authenticatedApi, adminApi } from '../../authentication/middlewares/authentication.middlewares.js'
import { deleteDocument, getDocument, getDocuments, updateDocument, viewDocument, viewDocumentPage } from '../controllers/admin.document.controller.js'

const router = Router()

// Pages
router.get('/admin/document/:id', authenticatedApi, adminApi, viewDocumentPage)

// APIs
router.get('/api/admin/document', authenticatedApi, adminApi, getDocuments)
router.put('/api/admin/document/:id', authenticatedApi, adminApi, updateDocument)
router.get('/api/admin/document/:id', authenticatedApi, adminApi, getDocument)
router.delete('/api/admin/document/:id', authenticatedApi, adminApi, deleteDocument)
router.get('/api/admin/document/:id/view', authenticatedApi, adminApi, viewDocument)

export default router