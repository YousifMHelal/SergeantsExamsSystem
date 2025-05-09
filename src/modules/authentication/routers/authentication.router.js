import { Router } from 'express'
import { parseJsonwebtoken, authenticatedApi } from '../middlewares/authentication.middlewares.js'
import { login, logout, viewLoginPage } from '../controllers/authentication.controller.js'

const router = Router()

// Pages
router.get('/auth/login', parseJsonwebtoken, viewLoginPage)

// APIs
router.post('/api/auth/login', login)
router.get('/api/auth/logout', authenticatedApi, logout)

export default router