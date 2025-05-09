import { run } from '../../../utils/database.utils.js'
import { definedOrThrow, greaterThanEqualOrThrow, notEmptyOrThrow } from '../../../utils/validation.utils.js'

export const createGroup = (request, response) => {

    const { name } = request.body

    try {
        definedOrThrow(name, 'Missing name')
        notEmptyOrThrow(name, 'Invalid name')
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    run('INSERT INTO groups (name) VALUES (?)', [ name ]).then(() => {
        response.status(200).json({ success: true, message: 'Group created successfully' })
    }).catch((error) => {
        console.log(`[ERROR]: ${error.message}`)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const deleteGroup = (request, response) => {

    const { id } = request.params

    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    Promise.all([
        run('DELETE FROM groups WHERE id = ?', [ id ]),
        // TODO: call api instead of database direct querying
        run('DELETE FROM exams WHERE group_id = ?', [ id ]),
        run('DELETE FROM examiners WHERE group_id = ?', [ id ]),
    ]).then(() => {
        response.status(200).json({ success: true, message: 'Group deleted successfully' })
    }).catch((error) => {
        console.log(`[ERROR]: ${error.message}`)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const updateGroup = (request, response) => {

    const { id } = request.params
    const { name } = request.query

    try {
        greaterThanEqualOrThrow(id, 1, 'Invalid ID')
        notEmptyOrThrow(name, 'Missing or invalid name')
    } catch (error) {
        return response.status(400).json({ success: true, message: error.message })
    }

    run('UPDATE groups SET name = ? WHERE id = ?', [ name, id ]).then(() => {
        response.status(200).json({ success: true, message: 'Group updated successfully' })
    }).catch((error) => {
        console.log(`[ERROR]: ${error.message}`)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}

export const getGroups = (_, response) => {

    run('SELECT * FROM groups').then((groups) => {
        response.status(200).json({ success: true, message: 'Group retrieved successfully', data: { content: groups, total: groups.length } })
    }).catch((error) => {
        console.log(`[ERROR]: ${error.message}`)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}