import xlsx from 'xlsx'
import path, { dirname } from 'path'
import { run } from '../../../utils/database.utils.js'
import { fileURLToPath } from 'url'
import { booleanOrThrow, defined, greaterThanEqualOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'
import * as logger from '../../../utils/console.logger.js'

const examsFileColumns = [ 'السؤال', 'اجابة 1', 'اجابة 2', 'اجابة 3', 'اجابة 4', 'الصحيح' ]
const examsAnswerFileColumns = [ 'اجابة 1', 'اجابة 2', 'اجابة 3', 'اجابة 4' ]

export const viewExamsPage = (_, response) => {

    response.render('../src/modules/exams/views/admin.exams.view.ejs')

}

export const viewExamPage = async (request, response) => {

    const { id } = request.params

    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
        const [ { count } ] = await run('SELECT COUNT(*) AS count FROM exams WHERE id = ?', [ id ])
        if (count === 0) {
            throw new Error('Exam not found')
        }
        response.render('../src/modules/exams/views/admin.exam.view.ejs')
    } catch (error) {
        response.redirect('/admin/exams')
    }

}

export const uploadExamsFile = async (request, response) => {

    const { groupId } = request.query

    let exams = {}
    let questions = 0
    let invalidColumns = false

    try {

        const file = request.file
        if (!(file)) {
            throw new Error('No file uploaded')
        }

        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            throw new Error('No excel sheet file')
        }

        greaterThanEqualOrThrow(groupId, 1, 'Invalid group ID')
        const [ { count } ] = await run('SELECT COUNT(*) FROM groups WHERE id = ?', [ groupId ])
        if (count === 0) {
            throw new Error('Group not found')
        }

        // TODO: Add validation layer
        const workbook = xlsx.read(file.buffer, { type: 'buffer'})
        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName]
            const sheetRows = xlsx.utils.sheet_to_json(sheet)
            questions += sheetRows.length
            sheetRows.forEach((row) => {
                const asnwerValue = row[examsFileColumns[5]]
                let answerKey = ''
                examsAnswerFileColumns.forEach((key) => {
                    if (row[key] === asnwerValue) {
                        answerKey = key
                        return
                    }
                })
                if (answerKey === '') {
                    throw new Error('Answer not found')
                }
                row[examsFileColumns[5]] = answerKey
            })
            exams[sheetName] = sheetRows
            Object.keys(sheetRows[0]).forEach((key) => (invalidColumns = invalidColumns || !(examsFileColumns.includes(key))))
        })
    
        if (invalidColumns) {
            throw new Error('Invalid column(s) name')
        }
    
        if (questions === 0) {
            throw new Error('Empty file')
        }

    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    Object.keys(exams).forEach(async (examName) => {
        await run('INSERT INTO exams (name, total_questions_count, questions_count, created_at, group_id) VALUES (?, ?, ?, ?, ?)', 
            [ examName, exams[examName].length, exams[examName].length, new Date().toISOString().substring(0, 19), groupId ])
        const [ { examId } ] = await run('SELECT id AS examId FROM exams WHERE name = ? ORDER BY id DESC', [ examName ])
        const exam = exams[examName]
        exam.forEach(async (examQuestion) => {
            await run('INSERT INTO questions (exam_id, question) VALUES (?, ?)', [ examId, examQuestion[examsFileColumns[0]] ])
            const [ { questionId } ] = await run('SELECT id AS questionId FROM questions WHERE exam_id = ? AND question = ?', [ examId, examQuestion[examsFileColumns[0]] ])
            const answers = []
            if (typeof examQuestion[examsFileColumns[1]] !== 'undefined') {
                answers.push(examQuestion[examsFileColumns[1]])
            }
            if (typeof examQuestion[examsFileColumns[2]] !== 'undefined') {
                answers.push(examQuestion[examsFileColumns[2]])
            }
            if (typeof examQuestion[examsFileColumns[3]] !== 'undefined') {
                answers.push(examQuestion[examsFileColumns[3]])
            }
            if (typeof examQuestion[examsFileColumns[4]] !== 'undefined') {
                answers.push(examQuestion[examsFileColumns[4]])
            }
            await run(`INSERT INTO answers (question_id, answer) VALUES ${answers.map(() => '(?, ?)').join(', ')}`, 
                answers.map((answer) => ([questionId, answer])).reduce((list, current) => (list.concat(current)), []))
            const [ { answerId } ] = await run('SELECT id AS answerId FROM answers WHERE question_id = ? AND answer = ?', [
                questionId, examQuestion[examQuestion[examsFileColumns[5]]]
            ])
            await run('UPDATE questions SET answer_id = ? WHERE id = ?', [ answerId, questionId ])
        })
    })

    response.status(200).json({ success: true, message: '' })

}

export const getExams = (_, response) => {

    run(`
        SELECT exams.id, exams.name, exams.total_questions_count, exams.questions_count, exams.created_at, exams.group_id, groups.name AS group_name,
        exams.open, exams.duration, (
            SELECT COUNT(*) FROM examiners WHERE examiners.group_id = groups.id
        ) AS examiners_count, (
            SELECT COUNT(*) FROM examiners_exams WHERE examiners_exams.exam_id = exams.id
        ) AS done_count
        FROM exams
        INNER JOIN groups ON exams.group_id = groups.id
    `).then((exams) => {
        response.status(200).json({ success: true, message: '', data: { content: exams, total: exams.length } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const getExam = async (request, response) => {

    const { id } = request.params
    
    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
        const [ { count } ] = await run('SELECT COUNT(*) AS count FROM exams WHERE id = ?', [ id ])
        if (count === 0) {
            throw new Error('Exam not found')
        }
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    run(`
        SELECT exams.id, exams.name, exams.total_questions_count, exams.questions_count, exams.created_at, exams.group_id, groups.name AS group_name,
        exams.open, exams.duration, (
            SELECT COUNT(*) FROM examiners WHERE examiners.group_id = groups.id
        ) AS examiners_count, (
            SELECT COUNT(*) FROM examiners_exams WHERE examiners_exams.exam_id = exams.id
        ) AS done_count
        FROM exams
        INNER JOIN groups ON exams.group_id = groups.id
        WHERE exams.id = ?
    `, [ id ]).then(([ exam ]) => {
        response.status(200).json({ success: true, message: '', data: exam})
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const deleteExam = (request, response) => {

    const { id } = request.params
    
    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    // TODO: delete all related stuff either
    run('DELETE FROM exams WHERE id = ?', [ id ]).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const updateExam = async (request, response) => {

    const { id } = request.params
    const { open, duration, questions_count } = request.query
    const changes = []
    
    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')

        if (defined(open)) {
            if (!(['1', '0'].includes(open))) {
                throw new Error('Invalid open')
            }
            changes.push({ column: 'open', value: '?', params: [ open ] })
        }

        if (defined(duration)) {
            if (duration !== 'null') {
                greaterThanEqualOrThrow(duration, 1, 'Invalid duration')
            }
            changes.push({ column: 'duration', value: '?', params: [ duration === 'null' ? null : duration ] })
        }

        if (defined(questions_count)) {
            greaterThanEqualOrThrow(questions_count, 1, 'Invalid questions count')
            const exams = await run('SELECT total_questions_count FROM exams WHERE id = ?', [ id ])
            if (exams.length === 0) {
                throw new Error('Exam not found')
            }
            if (exams[0].total_questions_count < questions_count) {
                throw new Error('Invalid range')
            }
            changes.push({ column: 'questions_count', value: '?', params: [ questions_count ] })
        }

        if (changes.length === 0) {
            throw new Error('No changes')            
        }
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    let params = []
    const setStatement = changes.reduce((previous, change, index) => {
        params = params.concat(change.params)
        const prefix = index === 0 ? '' : ','
        return `${previous} ${prefix} ${change.column} = ${change.value}`
    }, 'SET ')
    params.push(id)

    run(`UPDATE exams ${setStatement} WHERE id = ?`, params).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const downloadTemplate = (_, response) => {

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.setHeader('Content-Disposition', `attachment;`)
    response.sendFile(path.join(__dirname, '../../../../resources/excel/exams.template.xlsx'))

}

export const getExamExaminersResults = async (request, response) => {

    const { id } = request.params
    const { keyword, done } = request.query
    const conditions = []

    let params = [ id ]
    let groupId, questions_count

    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
        const exams = await run('SELECT group_id, questions_count FROM exams WHERE id = ?', [ id ])
        if (exams.length === 0) {
            throw new Error('Exam not found')
        }
        groupId = exams[0].group_id
        params.push(groupId)
        questions_count = exams[0].questions_count

        if (defined(keyword)) {
            notEmptyOrThrow(keyword, 'Invalid keyword')
            conditions.push({ column: `(name LIKE CONCAT('%', ?, '%') OR military_id LIKE CONCAT('%', ?, '%'))`, operator: '', value: ``, params: [ keyword, keyword ] })
        }

        if (defined(done)) {
            booleanOrThrow(done, 'Invalid done')
            conditions.push({ column: 'score', operator: 'IS', value: done === '1' ? 'NOT NULL' : 'NULL', params: [] })
        }
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    const conditionalStatement = conditions.reduce((previous, condition) => {
        params = params.concat(condition.params)
        return `${previous} AND ${condition.column} ${condition.operator} ${condition.value}`
    }, '')

    run(`
        SELECT name, military_id, (
            SELECT score FROM examiners_exams WHERE examiners_exams.exam_id = ? AND examiners_exams.examiner_id = examiners.id
        ) AS score
        FROM examiners
        WHERE group_id = ? ${conditionalStatement}
    `, params).then((results) => {
        response.status(200).json({ success: true, message: '', data: { exam: { questions_count }, content: results, total: results.length } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const downloadExamExaminersResults = async (request, response) => {

    const { id } = request.params
    let exam

    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
        const exams = await run('SELECT * FROM exams WHERE id = ?', [ id ])
        if (exams.length === 0) {
            throw new Error('Exam not found')
        }
        exam = exams[0]
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    const data = await run(`
        SELECT name AS 'الاسم', military_id AS 'الرقم العسكري', (
            SELECT score FROM examiners_exams WHERE examiners_exams.exam_id = ? AND examiners_exams.examiner_id = examiners.id
        ) AS 'الاجابات الصحيحة'
        FROM examiners
        WHERE group_id = ?
    `, [ id, exam.group_id ]).then((rows) => (rows.map((row) => ({ 
        ...row, 
        'عدد الاسئلة': exam.questions_count, 
        'الرقم العسكري': String(row['الرقم العسكري']),
        'الاجابات الصحيحة': row['الاجابات الصحيحة'] === null ? 'لم يختبر بعد' : row['الاجابات الصحيحة']
    }))))

    const book = xlsx.utils.book_new()
    const sheet = xlsx.utils.json_to_sheet(data)
    xlsx.utils.book_append_sheet(book, sheet, exam.name)

    const buffer = xlsx.write(book, { type: 'buffer', bookType: 'xlsx' })

    response.setHeader('Content-Disposition', `attachment; filename="results.xlsx"`)
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    response.send(buffer)

}

export const downloadResults = async (request, response) => {

    const groups = await run('SELECT * FROM groups')

    const total = []
    const workbook = xlsx.utils.book_new()

    await Promise.all(groups.map(async (group) => {
        const examiners = await run('SELECT * FROM examiners WHERE group_id = ?', [ group.id ])
        const exams = await run('SELECT * FROM exams WHERE group_id = ?', [ group.id ])
        if (exams.length === 0 || examiners.length === 0) return
        const sheetRows = []
        await Promise.all(examiners.map(async (examiner) => {
            const row = {
                'الاسم': examiner.name,
                'الرقم العسكري': examiner.military_id,
                'الدرجة': group.name,
            }
            let totalScore = 0
            await Promise.all(exams.map(async (exam) => {
                const rows = await run('SELECT score FROM examiners_exams WHERE examiner_id = ? AND exam_id = ?', [ examiner.id, exam.id ])
                const score = rows.length === 0 ? null : (Math.floor(((rows[0].score / exam.questions_count) * 10000) / 100))
                totalScore += score
                row[exam.name] = score
            }))
            row['الاجمالي'] = (totalScore / exams.length)
            sheetRows.push(row)
        }))
        total.push(sheetRows)
        const worksheet = xlsx.utils.json_to_sheet(sheetRows)
        xlsx.utils.book_append_sheet(workbook, worksheet, group.name)
    }))

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    response.setHeader('Content-Disposition', 'attachment; filename="results.xlsx"')
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    response.send(buffer)

}