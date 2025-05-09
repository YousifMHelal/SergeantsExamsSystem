import { run } from '../../../utils/database.utils.js'
import * as logger from '../../../utils/console.logger.js'

export const viewHomePage = (request, response) => {

    const admin = Boolean(request.session.admin)
    if (admin) {
        response.render('../src/modules/home/views/home.view.ejs')
    } else {
        response.redirect('/exams')
    }

}

export const viewPublicHomePage = (_, response) => {

    response.render('../src/modules/home/views/public.home.view.ejs')

}

export const getHomeStatistics = (request, response) => {

    Promise.all([
        run('SELECT COUNT(*) AS examsCount FROM exams'),
        run('SELECT COUNT(*) AS examinersCount FROM examiners'),
        run('SELECT COUNT(*) AS groupsCount FROM groups'),
        run('SELECT COUNT(*) AS coursesCount FROM courses'),
        run('SELECT COUNT(*) AS lecturesCount FROM lectures')
    ]).then(([ [ { examsCount } ], [ { examinersCount } ], [ { groupsCount } ], [ { coursesCount } ], [ { lecturesCount } ]  ]) => {
        response.status(200).json({ success: true, message: '', data: { examsCount, examinersCount, groupsCount, coursesCount, lecturesCount } })
    }).catch((error) => {
        logger.error(error.message)
        response.status(500).json({ success: false, message: 'Internal server error' })
    })

}