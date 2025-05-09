import { Router } from 'express'
import { getVideos, viewVideo } from '../controllers/video.controller.js'

const router = Router()

// APIs
router.get('/api/videos', getVideos)
router.get('/api/videos/:id/view', viewVideo)

export default router