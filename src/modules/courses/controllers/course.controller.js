import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { defined, greaterThanEqualOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'

export const viewCoursesPage = (_, response) => {

    response.render('../src/modules/courses/views/courses.view.ejs')

}

export const viewCoursePage = async (request, response) => {

    const { id } = request.params

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        await run('SELECT COUNT(*) AS count FROM courses WHERE id = ? AND open = 1', [ id ]).then(([ { count } ]) => {
            if (count === 0) throw new Error('Course not found')
        })
        response.render('../src/modules/courses/views/course.view.ejs')
    } catch (error) {
        logger.error(error.message)
        response.render('../src/modules/common/views/not.found.view.ejs')
    }

}

export const getCourses = (request, response) => {

    const { keyword, page, size } = request.query

    const conditions = [ { column: 'open', operator: '=', value: '?', params: [ 1 ] } ]
    
    let params = []
    let paginationStatement = ''

    try {
        if (defined(keyword)) {
            notEmptyOrThrow(keyword, 'Invalid keyword')
            conditions.push({ column: 'name', operator: 'LIKE', value: `CONCAT('%', ?, '%')`, params: [ keyword.trim() ] })
        }

        if (defined(page) && defined(size)) {
            greaterThanEqualOrThrow(page, 0, 'Invalid page')
            greaterThanEqualOrThrow(size, 1, 'Invalid size')
            paginationStatement = `LIMIT ${size} OFFSET ${size * page}`
        }
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    const whereStatement = conditions.reduce((statement, condition, index) => {
        const prefix = index === 0 ? '' : 'AND'
        params = params.concat(condition.params)
        return `${statement} ${prefix} ${condition.column} ${condition.operator} ${condition.value}`
    }, 'WHERE')

    const selectStatement = `SELECT id, name, (
        SELECT COUNT(*) FROM videos WHERE course_id = courses.id AND videos.open = 1
    ) AS videos_count FROM courses ${whereStatement} ${paginationStatement}`
    const countStatement = `SELECT COUNT(*) AS count FROM courses ${whereStatement}`

    Promise.all([ run(selectStatement, params), run(countStatement, params) ]).then(([ courses, [ { count } ] ]) => {
        response.status(200).json({ success: true, message: '', data: { content: courses, total: count } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const getCourse = async (request, response) => {

    const { id } = request.params

    try {
        greaterThanEqualOrThrow(id, 0, 'Missing or invalid ID')
        const courses = await run('SELECT id, name FROM courses WHERE id = ? AND open = 1', [ id ])
        if (courses.length === 0) throw new Error('Course not found')
        response.status(200).json({ success: true, message: '', data: courses[0] })
    } catch (error) {
        logger.error(error.message)
        response.status(400).json({ success: false, message: error.message })
    }
    
}