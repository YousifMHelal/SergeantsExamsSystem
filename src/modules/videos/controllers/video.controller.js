import path from 'path'
import dotenv from 'dotenv'
import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { defined, greaterThanEqualOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'

dotenv.config()

const { STORAGE_URL } = process.env
const coursesPath = path.join(STORAGE_URL, 'courses')

export const viewVideo = async (request, response) => {

    const { id } = request.params

    let video
    let course

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        const videos = await run('SELECT * FROM videos WHERE id = ? AND open = 1', [ id ])
        if (videos.length === 0) throw new Error('Video not found')
        video = videos[0]
        const courses = await run('SELECT * FROM courses WHERE id = ?', [ video.course_id ])
        course = courses[0]
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    response.setHeader('Content-Type', video.mimetype)
    response.sendFile(path.join(coursesPath, course.name, `${id}${getExtension(video.mimetype)}`))

}

export const getVideos = async (request, response) => {

    const { page, size, keyword, courseId } = request.query

    const conditions = [ { column: 'open', operator: '=', value: '?', params: [ 1 ] } ]

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

        if (defined(courseId)) {
            greaterThanEqualOrThrow(courseId, 1, 'Invalid course ID')
            const [ { count } ] = await run('SELECT COUNT(*) AS count FROM courses WHERE id = ?', [ courseId ])
            if (count === 0) throw new Error('Course not found')
            conditions.push({ column: 'course_id', operator: '=', value: '?', params: [ courseId ] })
        }
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    let params = []
    const conditionStatement = conditions.reduce((statement, condition, index) => {
        const prefix = index === 0 ? '' : 'AND'
        params = params.concat(condition.params)
        return `${statement} ${prefix} ${condition.column} ${condition.operator} ${condition.value}`
    }, 'WHERE')

    const selectStatement = `SELECT id, name FROM videos ${conditionStatement} ${paginationStatement}`
    const countStatement = `SELECT COUNT(*) AS count FROM videos ${conditionStatement}`

    Promise.all([ run(selectStatement, params), run(countStatement, params) ]).then(([ videos, [ { count } ] ]) => {
        response.status(200).json({ success: true, message: '', data: { content: videos, total: count } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

function getExtension(mimetype) {
    switch (mimetype) {
        case 'video/mp4':
            return '.mp4'
        default:
            return ''
    }
}