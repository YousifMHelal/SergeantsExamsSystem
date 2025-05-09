const courseTableBody = document.getElementById('courseTableBodyId')
const searchInput = document.getElementById('searchInputId')

var params = {}

document.addEventListener('DOMContentLoaded', fillCoursesTable)

searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim()
    params.keyword = keyword === '' ? undefined : keyword
    return fillCoursesTable()
})

function fillCoursesTable() {
    axios.get('/api/courses', { params }).then((response) => {
        const courses = response.data.data.content
        courseTableBody.innerHTML = courses.length === 0
        ? '<tr><td colspan="3">لا يوجد بيانات</td></tr>'
        : courses.reduce((body, course) => {
            const row = `
                <tr record-id='${course.id}'>
                    <td>${course.name}</td>
                    <td>${course.videos_count} محاضرة</td>
                    <td class='d-flex gap-3 justify-content-center'>
                        <a href='/courses/${course.id}'><i class='bi bi-link-45deg pointer' style='color: rgb(13, 110, 253)'></i></a>
                    </td>
                </tr>
            `
            return `${body}\n${row}`
        }, '')
    }).catch(() => {
        alert('حدث خطأ اثناء التحميل')
    })
}