import { Router } from 'express'
import { authenticatedApi, authenticatedPage, examinerApi, examinerPage } from '../../authentication/middlewares/authentication.middlewares.js'
import { 
    viewExamsPage, getExams, startExam, getNextQuestion, answerQuestion, 
    getPreviousQuestion, getExaminerExamDetails, viewExamPage
} from '../controllers/examiner.exams.controller.js'

const router = Router()

// Pages
router.get('/exams', authenticatedPage, viewExamsPage)
router.get("/exam/:examId", authenticatedPage, examinerPage, viewExamPage)

// APIs
router.get('/api/exams', authenticatedApi, examinerApi, getExams)
router.get('/api/exams/:examId', authenticatedApi, examinerApi, getExaminerExamDetails)
/* TODO: make it put instead of get */ 
router.put('/api/exams/:examId/start', authenticatedApi, examinerApi, startExam)
router.get('/api/exams/:examId/next', authenticatedApi, examinerApi, getNextQuestion)
router.get('/api/exams/:examId/previous', authenticatedApi, examinerApi, getPreviousQuestion)
/* TODO: make it put instead of get */ 
router.put('/api/exams/:examId/questions/:questionId/answers/:answerId', authenticatedApi, examinerApi, answerQuestion)

export default router