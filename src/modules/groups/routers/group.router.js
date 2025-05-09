import { Router } from 'express';
import { authenticatedApi, adminApi } from '../../authentication/middlewares/authentication.middlewares.js'
import { createGroup, getGroups, deleteGroup, updateGroup } from '../controllers/groups.controller.js'

const router = Router()

// APIs
router.post('/api/groups', authenticatedApi, adminApi, createGroup)
router.get('/api/groups', authenticatedApi, adminApi, getGroups)
router.delete('/api/groups/:id', authenticatedApi, adminApi, deleteGroup)
router.put('/api/groups/:id', authenticatedApi, adminApi, updateGroup)

export default router