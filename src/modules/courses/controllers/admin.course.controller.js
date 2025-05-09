import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { defined, greaterThanEqualOrThrow, greaterThanOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'

dotenv.config()

const { STORAGE_URL } = process.env
const coursesPath = path.join(STORAGE_URL, 'courses')

export const viewCoursesPage = (_, response) => {

    response.render('../src/modules/courses/views/admin.courses.view.ejs')

}

export const viewCoursePage = async (request, response) => {

    const { id } = request.params

    try {
        greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        await run('SELECT COUNT(*) AS count FROM courses WHERE id = ?', [ id ]).then(([ { count } ]) => {
            if (count === 0) throw new Error('Course not found')
        })
        response.render('../src/modules/courses/views/admin.course.view.ejs')
    } catch (error) {
        logger.error(error.message)
        response.render('../src/modules/common/views/not.found.view.ejs')
    }

}

export const addCourse = async (request, response) => {

    const { name } = request.body

    try {
        notEmptyOrThrow(name, 'Missing or invalid name')
        await run('SELECT COUNT(*) AS count FROM courses WHERE name = ?', [ name.trim() ]).then(([ { count } ]) => {
            if (count > 0) throw new Error('Course name already exists')
        })
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    run('INSERT INTO courses (name) VALUES (?)', [ name.trim() ]).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const deleteCourse = async (request, response) => {

    const { id } = request.params

    let course

    try {
        greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        await run('SELECT * FROM courses WHERE id = ?', [ id ]).then((courses) => {
            if (courses.length === 0) throw new Error('Course not found')
            course = courses[0]
        })
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }
    
    Promise.all([
        run('DELETE FROM courses WHERE id = ?', [ id ]),
        fs.rmSync(path.join(coursesPath, course.name), { recursive: true })
    ]).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const updateCourse = async (request, response) => {

    const { id } = request.params
    const { open } = request.query

    let params = []
    const changes = []

    try {
        greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        await run('SELECT COUNT(*) AS count FROM courses WHERE id = ?', [ id ]).then(([ { count } ]) => {
            if (count === 0) throw new Error('Course not found')
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
    }, 'UPDATE courses SET')

    const whereStatement = 'WHERE id = ?'
    params.push(id)

    run(`${updateStatement} ${whereStatement}`, params).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const getCourses = (request, response) => {

    const { open, keyword, page, size } = request.query

    const andConditions = []
    
    let params = []
    let whereStatement = ''
    let paginationStatement = ''

    try {
        if (defined(open)) {
            if (!(/(1|0)/.test(open))) {
                throw new Error('Invalid open')
            }
            andConditions.push({ column: 'open', operator: '=', value: '?', params: [ open ] })
        }
        
        if (defined(keyword)) {
            notEmptyOrThrow(keyword, 'Invalid keyword')
            andConditions.push({ column: 'name', operator: 'LIKE', value: `CONCAT('%', ?, '%')`, params: [ keyword.trim() ] })
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

    if (andConditions.length > 0) {
        whereStatement = andConditions.reduce((statement, condition, index) => {
            const prefix = index === 0 ? '' : 'AND'
            params = params.concat(condition.params)
            return `${statement} ${prefix} ${condition.column} ${condition.operator} ${condition.value}`
        }, 'WHERE')
    }

    const selectStatement = `SELECT * FROM courses ${whereStatement} ${paginationStatement}`
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
        greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        const courses = await run('SELECT * FROM courses WHERE id = ?', [ id ])
        if (courses.length === 0) throw new Error('Course not found')
        response.status(200).json({ success: true, message: '', data: courses[0] })
    } catch (error) {
        logger.error(error.message)
        response.status(400).json({ success: false, message: error.message })
    }
    
}