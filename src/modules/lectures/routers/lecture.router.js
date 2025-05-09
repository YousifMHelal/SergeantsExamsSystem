import { Router } from 'express'
import { getLecture, getLectures, viewLecturePage, viewLecturesPage } from '../controllers/lecture.controller.js'

const router = Router()

// Pages
router.get('/lecture', viewLecturesPage)
router.get('/lecture/:id', viewLecturePage)

// APIs
router.get('/api/lecture', getLectures)
router.get('/api/lecture/:id', getLecture)

export default router