import dotenv from 'dotenv'
import { run } from './database.utils.js'
import { defined } from './validation.utils.js'

dotenv.config()

export const initializeAdminUserIfNotExists = async () => {

    const { ADMIN_USERNAME, ADMIN_PASSWORD } = process.env
    if (defined(ADMIN_USERNAME) && defined(ADMIN_PASSWORD)) {
        const [ { matchCount } ] = await run('SELECT COUNT(*) AS matchCount FROM users WHERE username LIKE ?', [ ADMIN_USERNAME ])
        if (matchCount === 0) {
            run('INSERT INTO users (username, password) VALUES (?, ?)', [ ADMIN_USERNAME, ADMIN_PASSWORD ])
                .then(() => (console.log('[INFO]: Default admin created successfully')))
        }
    }
    
}