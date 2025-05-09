import { run } from "../../../utils/database.utils.js"

export const getCurrentUser = async (request, response) => {

    const { username, examiner_id } = request.session

    let name = null
    if (examiner_id !== null) {
        name = await run('SELECT name, degree FROM examiners WHERE id = ?', [ examiner_id ]).then((rows) => (`${rows[0].degree} / ${rows[0].name}`))
    }

    response.status(200).json({ success: true, message: '', data: { name } })

}