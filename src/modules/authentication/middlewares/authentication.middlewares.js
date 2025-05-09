import dotenv from 'dotenv'
import jsonwebtoken from 'jsonwebtoken'
import { run } from '../../../utils/database.utils.js'

dotenv.config()

export const parseJsonwebtoken = (request, _, next) => {

    const jwt = request.cookies.jsonwebtoken
    
    if (jwt) {
        const secret = process.env.JWT_SECRET ?? 'some secret instead'
        jsonwebtoken.verify(jwt, secret, (error, payload) => {
            if (error) return
            request.session = payload
        })
    }

    next()

}

export const authenticated = (request) => {

    return new Promise((resolve, reject) => {
        const jwt = request.cookies.jsonwebtoken
    
        if (!(jwt)) return reject(new Error('Missing token'))
    
        const secret = process.env.JWT_SECRET ?? 'some secret instead'
        jsonwebtoken.verify(jwt, secret, (error, payload) => {
            if (error) return reject(error)
            request.session = payload
        })
    
        run('SELECT id, examiner_id FROM users WHERE username LIKE ?', [ request.session.username ]).then((users) => {
            if (users.length === 0) {
                return reject(new Error('User not found'))
            }
            request.session = { ...request.session, ...users[0] }
            resolve()
        })
    })

}

export const authenticatedPage = (request, response, next) => {

    authenticated(request).then(() => (next()))
        .catch((error) => {
            console.log(`[ERROR]: ${error.message}`)
            response.cookie('jsonwebtoken', '', { httpOnly: true })
            const redirectUrl = request.url === '/' ? '/home' : `/auth/login?back-to=${request.url}`
            response.redirect(redirectUrl)
        })

}

export const authenticatedApi = (request, response, next) => {

    authenticated(request).then(() => (next()))
        .catch((error) => {
            console.log(`[ERROR]: ${error.message}`)
            response.cookie('jsonwebtoken', '', { httpOnly: true })
            response.status(401).json({ success: false, message: 'Unauthorized user' })
        })

}

export const admin = (request) => {

    const admin = request.session.admin
    if (typeof admin === 'undefined' || !(Boolean(admin))) {
        throw new Error('Unauthorized admin')
    }

}

export const adminPage = (request, response, next) => {

    try {
        admin(request)
        next()
    } catch (error) {
        console.log(`[ERROR]: ${error.message}`)
        response.redirect('/') // TODO: redirect to unauthorized page
    }

}

export const adminApi = (request, response, next) => {

    try {
        admin(request)
        next()
    } catch (error) {
        console.log(`[ERROR]: ${error.message}`)
        response.status(401).json({ success: false, message: 'Unauthorized admin' })
    }

}

export const examiner = (request) => {

    const admin = request.session.admin
    if (typeof admin === 'undefined' || Boolean(admin)) {
        throw new Error('Unauthorized examiner')
    }

}

export const examinerPage = (request, response, next) => {

    try {
        examiner(request)
        next()
    } catch (error) {
        console.log(`[ERROR]: ${error.message}`)
        response.redirect('/') // TODO: redirect to unauthorized page
    }

}

export const examinerApi = (request, response, next) => {

    try {
        examiner(request)
        next()
    } catch (error) {
        console.log(`[ERROR]: ${error.message}`)
        response.status(401).json({ success: false, message: 'Unauthorized examiner' })
    }

}