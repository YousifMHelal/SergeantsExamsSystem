import { run } from '../../../utils/database.utils.js'
import { defined, greaterThanEqualOrThrow } from "../../../utils/validation.utils.js"
import * as logger from "../../../utils/console.logger.js"

export const viewExamsPage = (request, response) => {

    if (request.session.admin) {
        return response.redirect('/admin/exams')
    }
    response.render('../src/modules/exams/views/examiner.exams.view.ejs')

}

export const viewExamPage = (_, response) => {

    // TODO: validate exam first
    response.render("../src/modules/exams/views/exam.view.ejs");

}

export const getExams = async (request, response) => {

    const { examiner_id } = request.session

    const [ { group_id } ] = await run('SELECT group_id FROM examiners WHERE id = ?', [ examiner_id ])

    run(`
        SELECT id, name, questions_count, open, duration, (
            SELECT ends_at FROM examiners_exams WHERE examiner_id = ? AND exam_id = exams.id
        ) AS ends_at, (
            SELECT answers_count FROM examiners_exams WHERE examiner_id = ? AND exam_id = exams.id
        ) AS answers_count, (
            SELECT score FROM examiners_exams WHERE examiner_id = ? AND exam_id = exams.id
        ) AS score
        FROM exams
        WHERE group_id = ?
    `, [ examiner_id, examiner_id, examiner_id, group_id ]).then((exams) => {
        response.status(200).json({ success: true, message: '', data: { content: exams, total: exams.length } })
    }).catch((error) => {
        console.log(`[ERROR]: ${error.message}`)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const startExam = async (request, response) => {

    const { examId } = request.params
    const { examiner_id } = request.session
    let exam

    try {
        greaterThanEqualOrThrow(examiner_id, 1, 'Invalid examiner ID')
        greaterThanEqualOrThrow(examId, 1, 'Invalid exam ID')
        const [ exams, examiners, [ { count } ] ] = await Promise.all([ 
            run('SELECT * FROM exams WHERE id = ?', [ examId ]), 
            run('SELECT * FROM examiners WHERE id = ?', [ examiner_id ]),
            run('SELECT COUNT(*) AS count FROM examiners_exams WHERE examiner_id = ? AND exam_id = ?', [ examiner_id, examId ])
        ])

        if (count > 0) {
            throw new Error('Examiner already started the exam')
        }
        if (examiners.length === 0) {
            throw new Error('Examiner not found')
        }
        if (exams.length === 0 || (examiners[0].group_id !== exams[0].group_id)) {
            throw new Error('Exam not found')
        }
        
        exam = exams[0]
        if (exam.open === 0) {
            throw new Error('Exam is closed')
        }
        if (exam.duration === null) {
            throw new Error('Exam duration not set yet')
        }
    } catch (error) {
        return response.status(400).json({ success: false, message: error.message })
    }

    // TODO: handle UTC+2 not recognized 
    const currentMoment = new Date(Date.now() + (2 * 60 * 60 * 1000))
    const endsAt = new Date(currentMoment.getTime() + (exam.duration * 60 * 1000))
    run('INSERT INTO examiners_exams (examiner_id, exam_id, started_at, ends_at) VALUES (?, ?, ?, ?)', [ 
        examiner_id, examId, currentMoment.toISOString().substring(0, 19), endsAt.toISOString().substring(0, 19)
    ]).then(() => {
        response.status(200).json({ success: true, message: '', data: { endsAt } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const getNextQuestion = async (request, response) => {

    const { examId } = request.params
    const { examiner_id } = request.session
    let examinerExam

    try {
        greaterThanEqualOrThrow(examiner_id, 1, 'Invalid examiner ID')
        greaterThanEqualOrThrow(examId, 1, 'Invalid exam ID')
        const examinerExams = await run('SELECT * FROM examiners_exams WHERE examiner_id = ? AND exam_id = ?', [ examiner_id, examId ])
        if (examinerExams.length === 0) {
            throw new Error('Examiner exam not found')
        }
        examinerExam = examinerExams[0]
        const endsAt = new Date(examinerExam.ends_at)
        const currentDate = new Date()
        if (endsAt <= currentDate) {
            throw new Error('Exam time out')
        }
    } catch (error) {
        return response.status(400).json({ success: false, message: error.message })
    }

    let allQuestions = await run('SELECT id, question FROM questions WHERE exam_id = ?', [ examinerExam.exam_id ])
    allQuestions = await Promise.all(allQuestions.map(async (question) => {
        const [ { count } ] = await run(`
            SELECT COUNT(*) AS count FROM examiners_answers
            INNER JOIN examiners_exams ON examiners_exams.id = examiners_answers.examiner_exam_id
            INNER JOIN answers ON answers.id = examiners_answers.answer_id
            INNER JOIN questions ON answers.question_id = questions.id
            WHERE examiners_exams.exam_id = ? AND questions.id = ? AND examiners_exams.examiner_id = ?
        `, [ examinerExam.exam_id, question.id, examiner_id ])
        return { ...question, answered: (count !== 0)}
    }))

    const exams = await run('SELECT * FROM exams WHERE id = ?', [ examinerExam.exam_id ])
    const exam = exams[0]

    const remainQuestions = allQuestions.filter((question) => !((question.answered)))
    if (remainQuestions.length === 0 || remainQuestions.length === (exam.total_questions_count - exam.questions_count)) {
        return response.status(400).json({ success: false, message: '', code: 552 })
    }

    const min = 0, max = (remainQuestions.length - 1)
    const index = min + Math.floor(Math.random() * (max - min + 1))
    const question = remainQuestions[index]
    const answers = await run('SELECT id, answer FROM answers WHERE question_id = ?', [ question.id ])
    question.answers = answers
    question.answered = undefined

    response.status(200).json({ success: true, message: '', data: question })

}

export const answerQuestion = async (request, response) => {

    const { examId, questionId, answerId } = request.params
    const { examiner_id } = request.session
    let examinerExam, exam, question, answer

    try {
        greaterThanEqualOrThrow(examiner_id, 1, 'Invalid examiner ID')
        greaterThanEqualOrThrow(examId, 1, 'Invalid exam ID')
        greaterThanEqualOrThrow(questionId, 1, 'Invalid question ID')
        greaterThanEqualOrThrow(answerId, 1, 'Invalid answer ID')

        const exams = await run('SELECT * FROM exams WHERE id = ?', [ examId ])
        if (exams.length === 0) {
            throw new Error('Exam not found')
        }
        exam = exams[0]

        const questions = await run('SELECT * FROM questions WHERE id = ?', [ questionId ])
        if (questions.length === 0) {
            throw new Error('Question not found')
        }
        question = questions[0]
        if (question.exam_id !== exam.id) {
            throw new Error('Invalid exam question')
        }

        const answers = await run('SELECT * FROM answers WHERE id = ?', [ answerId ])
        if (answers.length === 0) {
            throw new Error('Answer not found')
        }
        answer = answers[0]
        if (answer.question_id !== question.id) {
            throw new Error('Invalid question answer')
        }

        const examinerExams = await run('SELECT * FROM examiners_exams WHERE examiner_id = ? AND exam_id = ?', [ examiner_id, examId ])
        if (examinerExams.length === 0) {
            throw new Error('Examiner exam not found')
        }
        examinerExam = examinerExams[0]
        const endsAt = new Date(examinerExam.ends_at)
        const currentDate = new Date()
        if (endsAt <= currentDate) {
            throw new Error('Exam time out')
        }
    } catch (error) {
        return response.status(400).json({ success: false, message: error.message })
    }

    let examinerAnswers = await run(`
        SELECT examiners_answers.id, examiners_answers.answer_id FROM examiners_answers
        INNER JOIN answers ON answers.id = examiners_answers.answer_id
        WHERE examiner_exam_id = ? AND answers.question_id = ?
    `, [ examinerExam.id, question.id ])

    if (examinerAnswers.length === 0) {
        await Promise.all([
            run('INSERT INTO examiners_answers (examiner_exam_id, answer_id, \`index\`, answered_at) VALUES (?, ?, ?, ?)', [
                examinerExam.id, answer.id, (examinerExam.answers_count + 1), new Date().toISOString().substring(0, 19)
            ]),
            run('UPDATE examiners_exams SET answers_count = ?, score = ? WHERE id = ?', [ (examinerExam.answers_count + 1), examinerExam.score + (question.answer_id === answer.id ? 1 : 0), examinerExam.id ])
        ])
    } else {
        let scoreAddition = 0
        if (answer.id !== examinerAnswers[0].answer_id && question.answer_id === answer.id) {
            scoreAddition = 1
        } else if (answer.id !== examinerAnswers[0].answer_id && question.answer_id !== answer.id && examinerAnswers[0].answer_id === question.answer_id) {
            scoreAddition = -1
        }
        await Promise.all([
            run('UPDATE examiners_answers SET answer_id = ?, answered_at = ?, edited = ? WHERE id = ?', [
                answer.id, new Date().toISOString().substring(0, 19), 1, examinerAnswers[0].id
            ]),
            run('UPDATE examiners_exams SET score = ? WHERE id = ?', [ Math.max(0, (examinerExam.score + scoreAddition)), examinerExam.id ])
        ])
    }

    await run('UPDATE examiners_exams SET finished_at = ? WHERE id = ?', [ new Date().toISOString().substring(0, 19), examinerExam.id ])

    response.status(200).json({ success: true, message: '' })

}

export const getPreviousQuestion = async (request, response) => {

    const { examId } = request.params
    const { count } = request.query
    const { examiner_id } = request.session
    let examinerExam, offset

    try {
        greaterThanEqualOrThrow(examiner_id, 1, 'Invalid examiner ID')
        greaterThanEqualOrThrow(examId, 1, 'Invalid exam ID')
        const examinerExams = await run('SELECT * FROM examiners_exams WHERE examiner_id = ? AND exam_id = ?', [ examiner_id, examId ])
        if (examinerExams.length === 0) {
            throw new Error('Examiner exam not found')
        }
        examinerExam = examinerExams[0]
        const endsAt = new Date(examinerExam.ends_at)
        const currentDate = new Date()
        if (endsAt <= currentDate) {
            throw new Error('Exam time out')
        }
        if (examinerExam.answers_count === 0) {
            throw new Error('No previous questions')
        }
        if (defined(count)) {
            greaterThanEqualOrThrow(count, 0, 'Invalid count')
        }
        offset = count ? (count - 1) : 0
    } catch (error) {
        return response.status(400).json({ success: false, message: error.message })
    }

    const examinerAnswers = await run(`SELECT * FROM examiners_answers WHERE examiner_exam_id = ? ORDER BY \`index\` DESC LIMIT 1 OFFSET ${offset}`, [ examinerExam.id ])
    const examinerAnswer = examinerAnswers[0]

    const questions = await run(`
        SELECT questions.id, questions.question FROM questions
        INNER JOIN answers ON answers.question_id = questions.id
        WHERE answers.id = ?
    `, [ examinerAnswer.answer_id ])
    const question = questions[0]

    const answers = await run('SELECT id, answer FROM answers WHERE question_id = ?', [ question.id ])
    answers.forEach((answer) => (answer.answered = (answer.id === examinerAnswer.answer_id)))

    question.answers = answers

    response.status(200).json({ success: true, message: '', data: question })

}

export const getExaminerExamDetails = async (request, response) => {

    const { examId } = request.params
    const { examiner_id } = request.session
    let examinerExam

    try {
        greaterThanEqualOrThrow(examiner_id, 1, 'Invalid examiner ID')
        greaterThanEqualOrThrow(examId, 1, 'Invalid exam ID')
        const examinerExams = await run(`
            SELECT examiners_exams.answers_count, examiners_exams.ends_at, exams.questions_count, examiners_exams.score, exams.name
            FROM examiners_exams
            INNER JOIN exams ON exams.id = examiners_exams.exam_id
            WHERE examiners_exams.examiner_id = ? AND examiners_exams.exam_id = ?
        `, [ examiner_id, examId ])
        if (examinerExams.length === 0) {
            throw new Error('Examiner exam not found')
        }
        examinerExam = examinerExams[0]
    } catch (error) {
        logger.error(error)
        return response.status(400).json({ success: false, message: error.message })
    }

    if (examinerExam.answers_count !== examinerExam.questions_count) {
        examinerExam.score = undefined
    }

    response.status(200).json({ success: true, message: '', data: examinerExam })

}