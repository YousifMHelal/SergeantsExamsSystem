import dotenv from 'dotenv'
import sqlite3 from 'sqlite3'

dotenv.config()

const db = new sqlite3.Database(process.env.DATABASE_URL, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (error) => {
    if (error) {
        process.exit(1)
    }
})

export const run = (query, params) => {
    return new Promise((resolve, reject) => {
        db.all(query, params, (error, data) => {
            if (error) {
                reject(error)
            } else {
                resolve(data)
            }
        })
    })
}