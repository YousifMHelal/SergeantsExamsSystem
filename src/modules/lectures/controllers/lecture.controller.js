import path from 'path'
import dotenv from 'dotenv'
import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { defined, greaterThanEqualOrThrow, greaterThanOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'

dotenv.config()

const { STORAGE_URL } = process.env
const lecturesPath = path.join(STORAGE_URL, 'lectures')

export const viewLecturesPage = (_, response) => {

    response.render('../src/modules/lectures/views/lectures.view.ejs')

}

export const viewLecturePage = async (request, response) => {

    const { id } = request.params

    try {
        greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        await run('SELECT COUNT(*) AS count FROM lectures WHERE id = ? AND open = 1', [ id ]).then(([ { count } ]) => {
            if (count === 0) throw new Error('Lecture not found')
        })
        response.render('../src/modules/lectures/views/lecture.view.ejs')
    } catch (error) {
        logger.error(error.message)
        response.render('../src/modules/common/views/not.found.view.ejs')
    }

}

export const getLectures = async (request, response) => {

    const { page, size, keyword } = request.query

    const conditions = [ { column: 'open', operator: '=', value: '?', params: [ 1 ] } ]

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

    const selectStatement = `SELECT * FROM lectures ${conditionStatement} ${paginationStatement}`
    const countStatement = `SELECT COUNT(*) AS count FROM lectures ${conditionStatement}`

    Promise.all([ run(selectStatement, params), run(countStatement, params) ]).then(([ videos, [ { count } ] ]) => {
        response.status(200).json({ success: true, message: '', data: { content: videos, total: count } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const getLecture = async (request, response) => {

    const { id } = request.params

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        const lectures = await run('SELECT * FROM lectures WHERE id = ? AND open = 1', [ id ])
        if (lectures.length === 0) throw new Error('Lecture not found')
        response.status(200).json({ success: true, message: '', data: lectures[0] })
    } catch (error) {
        logger.error(error.message)
        response.status(400).json({ success: false, message: error.message })
    }

}