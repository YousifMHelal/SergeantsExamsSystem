import xlsx from 'xlsx'
import path, { dirname } from 'path'
import * as logger from '../../../utils/console.logger.js'
import { run } from '../../../utils/database.utils.js'
import { fileURLToPath } from 'url'
import { TABLE_COLUMN_REGEXP } from '../../../utils/regexp.utils.js'
import { defined, definedOrThrow, greaterThanEqualOrThrow, match, notEmpty, notNull } from '../../../utils/validation.utils.js'

const examinersFileColumns = [ 'الرقم العسكري', 'الاسم', 'الرتبة' ]
const examinersTableColumns = [ 'military_id', 'name', 'degree' ]

export const viewExaminersPage = (_, response) => {

    response.render('../src/modules/examiners/views/examiners.view.ejs')

}

export const uploadExaminersFile = async (request, response) => {

    let invalidColumns = false
    const examinersGroupedBy = []

    try {

        const file = request.file
        if (!(file)) {
            throw new Error('No file uploaded')
        }

        if (file.mimetype !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
            throw new Error('No excel sheet file')
        }
    
        // TODO: Add validation layer
        const workbook = xlsx.read(file.buffer, { type: 'buffer'})
        workbook.SheetNames.forEach((sheetName) => {
            const sheet = workbook.Sheets[sheetName]
            const sheetRows = xlsx.utils.sheet_to_json(sheet)
            const examinersItem = { group: { name: sheetName }, examiners: sheetRows }
            examinersGroupedBy.push(examinersItem)
            Object.keys(sheetRows[0]).forEach((key) => (invalidColumns = invalidColumns || !(examinersFileColumns.includes(key))))
        })
    
        if (invalidColumns) {
            throw new Error('Invalid column(s) name')
        }
    
        if (examinersGroupedBy.length === 0) {
            throw new Error('Empty file')
        }

    } catch (error) {
        response.status(400).json({ success: false, message: error.message })
        return
    }

    examinersGroupedBy.forEach(async (examinersGroup) => {
        const groups = await run('SELECT id FROM groups WHERE name LIKE ?', [ examinersGroup.group.name.trim() ])
        let groupId = 0
        if (groups.length > 0) {
            groupId = groups[0].id
        } else {
            await run('INSERT INTO groups (name) VALUES (?)', [ examinersGroup.group.name.trim() ])
            const [ { id } ] = await run('SELECT id FROM groups WHERE name LIKE ?', [ examinersGroup.group.name.trim() ])
            groupId = id
        }

        const params = []
        const query = examinersGroup.examiners.reduce((previous, current, index) => {
            params.push(current[examinersFileColumns[0]])
            params.push(current[examinersFileColumns[1]])
            params.push(current[examinersFileColumns[2]])
            params.push(groupId)
            const prefix = index === 0 ? '' : ','
            return `${previous}${prefix} (?, ?, ?, ?)`
        }, 'INSERT INTO examiners (military_id, name, degree, group_id) VALUES')

        await run(query, params).catch((error) => {
            logger.error(error.message)
        })
    })

    response.status(200).json({ success: true, message: 'Examiners added successfully' })

}

export const getExaminers = (request, response) => {

    let { page, size, keyword, columns } = request.query
    
    const oringConditionList = []
    const andingConditionList = []
    
    let params = []
    let countStatement = ''
    let selectStatement = ''
    let paginationStatement = ''
    let conditionalStatement = ''
    let oringConditioningStatement = ''
    let andingConditioningStatement = ''

    try {

        if ((defined(page) && notNull(page)) && (defined(size) && notNull(size))) {
            greaterThanEqualOrThrow(page, 0, 'Page must be greater than or equal to 0')
            greaterThanEqualOrThrow(size, 1, 'Size must be greater than or equal to 1')

            page = parseInt(page)
            size = parseInt(size)

            paginationStatement = `LIMIT ${size} OFFSET ${size * page}`
        }

        if (notEmpty(keyword) && match(columns, TABLE_COLUMN_REGEXP)) {
            let columnsList = columns.includes(',') ? columns.split(',') : [ columns ]
            columnsList = columnsList.filter((column) => (examinersTableColumns.includes(column)))

            if (columnsList.length === 0) {
                throw new Error('Invalid column(s) name')
            }

            keyword = keyword.trim()
            columnsList.forEach((column) => {
                oringConditionList.push({ column, operator: 'LIKE', value: `CONCAT('%', ?, '%')`, params: [ keyword ] })
            })
        }

    } catch (error) {
        return response.status(400).json({ success: false, message: error.message })
    }

    if (andingConditionList.length > 0) {
        andingConditioningStatement = andingConditionList.reduce((previous, current, index) => {
            params = params.concat(current.params)
            const prefix = index === 0 ? '' : 'AND'
            return `${previous} ${prefix} ${current.column} ${current.operator} ${current.value}`
        }, '')
    }

    if (oringConditionList.length > 0) {
        oringConditioningStatement = oringConditionList.reduce((previous, current, index, array) => {
            params = params.concat(current.params)
            const prefix = index === 0 ? '(' : 'OR'
            const suffix = index === (array.length - 1) ? ')' : ''
            return `${previous} ${prefix} ${current.column} ${current.operator} ${current.value} ${suffix}`
        }, '')
    }

    const atLeastOne = oringConditioningStatement !== '' || andingConditioningStatement !== ''
    const both = oringConditioningStatement !== '' && andingConditioningStatement !== ''

    if (atLeastOne) {
        conditionalStatement = `WHERE ${both
            ? `${andingConditioningStatement} AND ${oringConditioningStatement}`
            : `${andingConditioningStatement} ${oringConditioningStatement}`}`
    }

    selectStatement = `
        SELECT examiners.id, examiners.name, examiners.degree, examiners.military_id, examiners.group_id, groups.name AS group_name, (
            SELECT password FROM users WHERE users.examiner_id = examiners.id LIMIT 1
        ) AS password
        FROM examiners
        INNER JOIN groups ON groups.id = examiners.group_id
        ${conditionalStatement}
        ${paginationStatement}
    `
    countStatement = `
        SELECT COUNT (*) AS count 
        FROM examiners
        ${conditionalStatement}
    `

    Promise.all([
        run(selectStatement, params), run(countStatement, params)
    ]).then(([ examiners, [ { count } ] ]) => {
        response.status(200).json({ success: true, message: 'Examiners retrieved successfully', data: { content: examiners, totol: count } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const deleteExaminer = (request, response) => {

    const { id } = request.params
    
    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    // TODO: delete all related stuff either
    run('DELETE FROM examiners WHERE id = ?', [ id ]).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const generateUsers = async (request, response) => {

    const { id } = request.query
    let idList

    try {
        definedOrThrow(id, 'Missing ID(s)')
        idList = Array.isArray(id) ? id : [ id ]
        idList.forEach((singledId) => greaterThanEqualOrThrow(singledId, 1, 'Invalid ID'))
    } catch (error) {
        return response.status(400).json({ success: false, message: error.message })
    }
    
    const examiners = await run(`SELECT * FROM examiners WHERE id IN (${idList.map(() => ('?')).join(',')})`, idList)
    const users = await Promise.all(examiners.map(async (examiner) => {
        const rows = await run('SELECT id FROM users WHERE examiner_id = ?', [ examiner.id ])
        return {
            username: examiner.military_id, 
            password: randomPassword(),
            examiner_id: examiner.id,
            id: rows.length === 0 ? null : rows[0].id
        }
    }))

    const params = []
    const values = users.map((user) => {
        params.push(user.id)
        params.push(String(user.username))
        params.push(user.password)
        params.push(user.examiner_id)
        return '(?, ?, ?, ?)'
    }).join(',')

    run(`INSERT OR REPLACE INTO users (id, username, password, examiner_id) VALUES ${values}`, params).then(() => {
        response.status(200).json({ success: true, message: '' })
    }).catch((error) => {
        logger.error(error)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const downloadTemplate = (_, response) => {

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = dirname(__filename)
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response.setHeader('Content-Disposition', `attachment; filename="example.xlsx"`)
    response.sendFile(path.join(__dirname, '../../../../resources/excel/examiners.template.xlsx'))

}

export const downloadExaminersPasswords = async (_, response) => {

    const groups = await run('SELECT * FROM groups')
    if (groups.length === 0) {
        logger.error('No groups found')
        return response.status(500).json({ success: false, message: 'Internal server error' })
    }

    const book = xlsx.utils.book_new()

    await Promise.all(groups.map(async (group) => {
        const data = await run(`
            SELECT examiners.name AS 'الاسم', examiners.degree AS 'الدرجة', LOWER(examiners.military_id) AS 'الرقم العسكري', groups.name AS 'الفرقة', (
                SELECT password FROM users WHERE users.examiner_id = examiners.id LIMIT 1
            ) AS 'كلمة المرور'
            FROM examiners
            INNER JOIN groups ON groups.id = examiners.group_id
            WHERE examiners.group_id = ?
        `, [ group.id ])
    
        const sheet = xlsx.utils.json_to_sheet(data)
        xlsx.utils.book_append_sheet(book, sheet, group.name)
    }))

    const buffer = xlsx.write(book, { type: 'buffer', bookType: 'xlsx' })

    response.setHeader('Content-Disposition', `attachment; filename="accounts.xlsx"`)
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

    response.send(buffer)

}

const randomPassword = () => {
    const min = 111_111, max = 999_999
    return min + Math.floor(Math.random() * (max - min + 1))
}