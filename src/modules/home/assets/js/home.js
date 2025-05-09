const examinersCountDiv = document.getElementById('examinersCountDivId')
const examsCountDiv = document.getElementById('examsCountDivId')
const groupsCountDiv = document.getElementById('groupsCountDivId')
const coursesCountDiv = document.getElementById('coursesCountDivId')
const lecturesCountDiv = document.getElementById('lecutresCountDivId')

document.addEventListener('DOMContentLoaded', () => {

    axios.get('/api/home/statistics').then((response) => {
        const { examsCount, examinersCount, groupsCount, coursesCount, lecturesCount } = response.data.data

        examinersCountDiv.innerHTML = examinersCount
        examsCountDiv.innerHTML = examsCount
        groupsCountDiv.innerHTML = groupsCount
        coursesCountDiv.innerHTML = coursesCount
        lecturesCountDiv.innerHTML = lecturesCount
    }).catch(() => {
        console.error('Error while getting home statistics')
    })

})