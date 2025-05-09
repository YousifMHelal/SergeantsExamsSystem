import { Router } from 'express'
import { authenticatedPage } from '../../authentication/middlewares/authentication.middlewares.js'
import { getHomeStatistics, viewHomePage, viewPublicHomePage } from '../controllers/home.controller.js'

const router = Router()

// Pages
router.get('/', authenticatedPage, viewHomePage)
router.get('/home', viewPublicHomePage)

// APIs
router.get('/api/home/statistics', authenticatedPage, getHomeStatistics)

export default router