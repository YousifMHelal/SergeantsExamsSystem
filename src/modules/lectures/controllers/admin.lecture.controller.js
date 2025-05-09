import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { PDFDocument } from 'pdf-lib'
import { defined, greaterThanEqualOrThrow, greaterThanOrThrow, matchOrThrow, notEmptyOrThrow, smallerThanEqualOrThrow } from '../../../utils/validation.utils.js'

dotenv.config()

const { STORAGE_URL } = process.env
const lecturesPath = path.join(STORAGE_URL, 'lectures')

export const viewLecturesPage = (_, response) => {

    response.render('../src/modules/lectures/views/admin.lectures.view.ejs')

}

export const viewLecturePage = async (request, response) => {

    // const { id } = request.params

    try {
        // greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        // await run('SELECT COUNT(*) AS count FROM courses WHERE id = ?', [ id ]).then(([ { count } ]) => {
        //     if (count === 0) throw new Error('Course not found')
        // })
        response.render('../src/modules/lectures/views/admin.lecture.view.ejs')
    } catch (error) {
        logger.error(error.message)
        response.render('../src/modules/common/views/not.found.view.ejs')
    }

}

export const uploadLecture = async (request, response) => {

    const document = request.file
    let { name, selections } = request.query
    let pdfDocument, pageCount

    try {
        if (!(document)) {
            throw new Error('No document uploaded')
        }

        if (document.mimetype !== 'application/pdf') {
            throw new Error('Document is not PDF')
        }

        pdfDocument = await PDFDocument.load(document.buffer)
        pageCount = pdfDocument.getPageCount()

        if (!(Array.isArray(selections))) {
            throw new Error('Invalid selections list')
        }

        selections.forEach(async (selection) => {
            const { name, expression } = selection
            notEmptyOrThrow(name, 'Invalid selection name')
            matchOrThrow(expression, /^[0-9\-,]+$/, 'Invalid selection expression')
            selection.indecies = await getIndecies(expression)
            selection.indecies.forEach((index) => (smallerThanEqualOrThrow(index, pageCount, 'Max page index exceeded')))
        })

        notEmptyOrThrow(name, 'Invalid name')
        const [ { nameCount } ] = await run('SELECT COUNT(*) AS nameCount FROM lectures WHERE name = ?', [ name.trim() ])
        if (nameCount > 0) {
            throw new Error('Lecture with this name already exists')
        }
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }

    try {
        fs.mkdirSync(path.join(lecturesPath, name.trim()), { recursive: true })
        await run('INSERT INTO lectures (name, documents_count) VALUES (?, ?)', [ name.trim(), selections.length ])
        const [ { lectureId } ] = await run('SELECT id AS lectureId FROM lectures WHERE name = ? ORDER BY ID DESC', [ name.trim() ])
        await Promise.all(selections.map((selection) => (run('INSERT INTO documents (name, mimetype, pages_count, lecture_id) VALUES (?, ?, ?, ?)', 
            [ selection.name.trim(), 'application/pdf', selection.indecies.length, lectureId ]))))
        const idList = await Promise.all(selections.map((selection) => (run('SELECT id FROM documents WHERE name = ? AND lecture_id = ?', [ selection.name.trim(), lectureId ]))))
        await Promise.all(idList.map(async ([ { id } ], index) => {
            const selection = selections[index]
            const newDocument = await PDFDocument.create()
            const documentParts = await newDocument.copyPages(pdfDocument, selection.indecies.map((index) => (index -1)))
            documentParts.forEach((page) => (newDocument.addPage(page)))
            const documentBytes = await newDocument.save()
            return fs.writeFileSync(path.join(lecturesPath, name.trim(), `${id}.pdf`), documentBytes)
        }))
        response.status(200).json({ success: true, message: '' })
    } catch (error) {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    }

}

export const getLectures = async (request, response) => {

    const { page, size, keyword, open } = request.query

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
        const lectures = await run('SELECT * FROM lectures WHERE id = ?', [ id ])
        if (lectures.length === 0) throw new Error('Lecture not found')
        response.status(200).json({ success: true, message: '', data: lectures[0] })
    } catch (error) {
        logger.error(error.message)
        response.status(400).json({ success: false, message: error.message })
    }

}

export const deleteLecture = async (request, response) => {

    const { id } = request.params
    let lecture

    try {
        greaterThanEqualOrThrow(id, 1, 'Missing or invalid ID')
        const lectures = await run('SELECT * FROM lectures WHERE id = ?', [ id ])
        if (lectures.length === 0) throw new Error('Lecture not found')
        lecture = lectures[0]
    } catch (error) {
        logger.error(error.message)
        return response.status(400).json({ success: false, message: error.message })
    }
    
    Promise.all([
        run('DELETE FROM lectures WHERE id = ?', [ id ]),
        fs.rmSync(path.join(lecturesPath, lecture.name), { recursive: true })
    ]).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const updateLecture = async (request, response) => {

    const { id } = request.params
    const { open } = request.query

    let params = []
    const changes = []

    try {
        greaterThanOrThrow(id, 0, 'Missing or invalid ID')
        await run('SELECT COUNT(*) AS count FROM lectures WHERE id = ?', [ id ]).then(([ { count } ]) => {
            if (count === 0) throw new Error('Lectures not found')
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
    }, 'UPDATE lectures SET')

    const whereStatement = 'WHERE id = ?'
    params.push(id)

    run(`${updateStatement} ${whereStatement}`, params).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

async function getIndecies(expression) {
    return new Promise((resolve, reject) => {
        const indeciesSet = new Set()
        expression.split(',').forEach((part) => {
            part = part.trim()
            if (part.length === 0) return
            if (part.includes('-')) {
                let [ from, to ] = part.split('-')
                if (isNaN(from) || isNaN(to)) return reject(new Error('Invalid number'))
                from = parseInt(from)
                to = parseInt(to)
                for (let index = from; index <= to; ++index) {
                    indeciesSet.add(index)
                }
            } else {
                if (isNaN(part)) return reject(new Error('Invalid number'))
                indeciesSet.add(parseInt(part))
            }
        })
        resolve(Array.from(indeciesSet))
    })
}