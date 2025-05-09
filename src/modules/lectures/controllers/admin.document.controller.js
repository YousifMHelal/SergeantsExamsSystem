import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { defined, greaterThanEqualOrThrow, greaterThanOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'

dotenv.config()

const { STORAGE_URL } = process.env
const lecturesPath = path.join(STORAGE_URL, 'lectures')

// export const uploadVideo = async (request, response) => {

//     const { lectureId, name } = request.query
//     let file
//     let course

//     try {
//         file = request.file
//         if (!(file)) {
//             throw new Error('No video uploaded')
//         }

//         if (file.mimetype !== 'video/mp4') {
//             throw new Error('Not video')
//         }

//         notEmptyOrThrow(name, 'Missing or invalid name')

//         greaterThanEqualOrThrow(courseId, 1, 'Invalid course ID')
//         const courses = await run('SELECT * FROM courses WHERE id = ?', [ courseId ])
//         if (courses.length === 0) {
//             throw new Error('Course not found')
//         }
//         course = courses[0]
//     } catch (error) {
//         logger.error(error.message)
//         return response.status(400).json({ success: false, message: error.message })
//     }

//     try {
//         const directoryPath = path.join(coursesPath, course.name)
//         fs.mkdirSync(directoryPath, { recursive: true })
//         await run('INSERT INTO videos (name, mimetype, course_id) VALUES (?, ?, ?)', [ name.trim(), file.mimetype, courseId ])
//         const [ { id } ] = await run('SELECT id FROM videos where name = ? AND course_id = ? ORDER BY id DESC', [ name.trim(), courseId ])
//         fs.writeFileSync(path.join(directoryPath, `${id}${getExtension(file.mimetype)}`), file.buffer)
//         const [ { videos_count } ] = await run('SELECT videos_count FROM courses WHERE id = ?', [ courseId ])
//         await run('UPDATE courses SET videos_count = ? WHERE id  = ?', [ (videos_count + 1), courseId ])
//         response.status(200).json({ success: true, message: '' })
//     } catch (error) {
//         logger.error(error.message)
//         response.status(500).json({ success: false, message: 'Internal server error' })
//     }

// }

export const viewDocumentPage = async (request, response) => {

    const { id } = request.params

    let document
    let lecture

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        const [ { count } ] = await run('SELECT COUNT(*) AS count FROM documents WHERE id = ?', [ id ])
        if (count === 0) throw new Error('Document not found')
        response.render('../src/modules/lectures/views/admin.document.view.ejs')
    } catch (error) {
        logger.error(error.message)
        response.render('../src/modules/common/views/not.found.view.ejs')
    }

}

export const viewDocument = async (request, response) => {

    const { id } = request.params

    let document
    let lecture

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        const documents = await run('SELECT * FROM documents WHERE id = ?', [ id ])
        if (documents.length === 0) throw new Error('Document not found')
        document = documents[0]
        const lectures = await run('SELECT * FROM lectures WHERE id = ?', [ document.lecture_id ])
        lecture = lectures[0]
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    response.setHeader('Content-Type', document.mimetype)
    response.sendFile(path.join(lecturesPath, lecture.name, `${id}.pdf`))

}

export const getDocuments = async (request, response) => {

    const { page, size, keyword, lectureId, open } = request.query

    const conditions = []

    let conditionStatement = ''
    let paginationStatement = ''

    try {
        if (defined(page) && defined(size)) {
            greaterThanEqualOrThrow(page, 0, 'Invalid page')
            greaterThanEqualOrThrow(size, 1, 'Invalid size')
            paginationStatement = `LIMIT ${size} OFFSET ${size * page}`
        }

        if (defined(keyword)) {
            notEmptyOrThrow(keyword)
            conditions.push({ column: 'name', operator: 'LIKE', value: `CONCAT('%', ?, '%')`, params: [ keyword.trim() ] })
        }

        if (defined(lectureId)) {
            greaterThanEqualOrThrow(lectureId, 1, 'Invalid lecture ID')
            const [ { count } ] = await run('SELECT COUNT(*) AS count FROM lectures WHERE id = ?', [ lectureId ])
            if (count === 0) throw new Error('Lecture not found')
            conditions.push({ column: 'lecture_id', operator: '=', value: '?', params: [ lectureId ] })
        }

        if (defined(open)) {
            if (!(/^(1|0)$/.test(open))) throw new Error('Invalid open')
            conditions.push({ column: 'open', operator: '=', value: '?', params: [ open ] })
        }
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    let params = []
    if (conditions.length > 0) {
        conditionStatement = conditions.reduce((statement, condition, index) => {
            const prefix = index === 0 ? '' : 'AND'
            params = params.concat(condition.params)
            return `${statement} ${prefix} ${condition.column} ${condition.operator} ${condition.value}`
        }, 'WHERE')
    }

    const selectStatement = `SELECT * FROM documents ${conditionStatement} ${paginationStatement}`
    const countStatement = `SELECT COUNT(*) AS count FROM documents ${conditionStatement}`

    Promise.all([ run(selectStatement, params), run(countStatement, params) ]).then(([ videos, [ { count } ] ]) => {
        response.status(200).json({ success: true, message: '', data: { content: videos, total: count } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const getDocument = async (request, response) => {

    const { id } = request.params

    run('SELECT * FROM documents WHERE id = ?', [ id ]).then((documents) => {
        response.status(200).json({ success: true, message: '', data: documents[0] })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const deleteDocument = async (request, response) => {

    const { id } = request.params

    let document
    let lecture

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        const documents = await run('SELECT * FROM documents WHERE id = ?', [ id ])
        if (documents.length === 0) throw new Error('Document not found')
        document = documents[0]
        const lectures = await run('SELECT * FROM lectures WHERE id = ?', [ document.lecture_id ])
        lecture = lectures[0]
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }
    
    Promise.all([
        run('DELETE FROM documents WHERE id = ?', [ id ]),
        run('UPDATE lectures SET documents_count = ? WHERE id = ?', [ (lecture.documents_count - 1), lecture.id ]),
        fs.unlinkSync(path.join(lecturesPath, lecture.name, `${id}.pdf`))
    ]).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const updateDocument = async (request, response) => {

    const { id } = request.params
    const { open } = request.query

    let params = []
    const changes = []

    try {
        greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        await run('SELECT COUNT(*) AS count FROM documents WHERE id = ?', [ id ]).then(([ { count } ]) => {
            if (count === 0) throw new Error('Document not found')
        })

        if (defined(open)) {
            if (!(/(1|0)/.test(open))) {
                throw new Error('Invalid open')
            }
            changes.push({ column: 'open', value: '?', params: [ open ] })
        }

        if (changes.length === 0) {
            throw new Error('No update parameters found')
        }
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    const updateStatement = changes.reduce((statement, change, index) => {
        const prefix = index === 0 ? '' : ', '
        params = params.concat(change.params)
        return `${statement} ${prefix} ${change.column} = ${change.value}`
    }, 'UPDATE documents SET')

    const whereStatement = 'WHERE id = ?'
    params.push(id)

    run(`${updateStatement} ${whereStatement}`, params).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}