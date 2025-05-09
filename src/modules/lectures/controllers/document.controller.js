import path from 'path'
import dotenv from 'dotenv'
import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { defined, greaterThanEqualOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'

dotenv.config()

const { STORAGE_URL } = process.env
const lecturesPath = path.join(STORAGE_URL, 'lectures')

export const viewDocumentPage = async (request, response) => {

    const { id } = request.params

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        const [ { count } ] = await run('SELECT COUNT(*) AS count FROM documents WHERE id = ? AND open = 1', [ id ])
        if (count === 0) throw new Error('Document not found')
        response.render('../src/modules/lectures/views/document.view.ejs')
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
        const documents = await run('SELECT * FROM documents WHERE id = ? AND open = 1', [ id ])
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

    const conditions = [ { column: 'open', operator: '=', value: `?`, params: [ 1 ] } ]

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

    run('SELECT * FROM documents WHERE id = ? AND open = 1', [ id ]).then((documents) => {
        response.status(200).json({ success: true, message: '', data: documents[0] })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}