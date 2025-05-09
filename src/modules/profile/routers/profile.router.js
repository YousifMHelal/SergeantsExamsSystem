import { Router } from 'express'
import { getCurrentUser } from '../controllers/profile.controller.js'
import { authenticatedApi } from '../../authentication/middlewares/authentication.middlewares.js'

const router = Router()

router.get('/api/profile', authenticatedApi, getCurrentUser)

export default router