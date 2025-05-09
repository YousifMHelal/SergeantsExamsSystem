import { Router } from 'express'
import { getDocument, getDocuments, viewDocument, viewDocumentPage } from '../controllers/document.controller.js'

const router = Router()

// Pages
router.get('/document/:id', viewDocumentPage)

// APIs
router.get('/api/document', getDocuments)
router.get('/api/document/:id', getDocument)
router.get('/api/document/:id/view', viewDocument)

export default router