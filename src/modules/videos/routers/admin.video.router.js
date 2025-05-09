import { Router } from 'express'
import { uploadMiddleware } from '../../common/middlewares/multer.middleware.js'
import { authenticatedApi, adminApi } from '../../authentication/middlewares/authentication.middlewares.js'
import { deleteVideo, getVideos, updateVideo, uploadVideo, viewVideo } from '../controllers/admin.video.controller.js'

const router = Router()

router.get('/api/admin/video', authenticatedApi, adminApi, getVideos)
router.post('/api/admin/video', authenticatedApi, adminApi, uploadMiddleware.single('video'), uploadVideo)
router.put('/api/admin/video/:id', authenticatedApi, adminApi, updateVideo)
router.delete('/api/admin/video/:id', authenticatedApi, adminApi, deleteVideo)
router.get('/api/admin/video/:id/view', authenticatedApi, adminApi, viewVideo)

export default router