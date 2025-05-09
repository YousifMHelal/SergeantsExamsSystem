const searchInput = document.getElementById('searchInputId')
const lecturesTableBody = document.getElementById('lecturesTableBodyId')

var params = {}

document.addEventListener('DOMContentLoaded', () => {
    fillLecturesTable()
})

searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim()
    params.keyword = keyword === '' ? undefined : keyword
    fillLecturesTable()
})

function fillLecturesTable() {
    axios.get('/api/lecture', { params }).then((response) => {
        const lectures = response.data.data.content
        lecturesTableBody.innerHTML = lectures.length === 0
        ? '<tr><td colspan="3">لا يوجد بيانات</td></tr>'
        : lectures.reduce((body, lecture) => {
            const row = `
                <tr record-id='${lecture.id}'>
                    <td>${lecture.name}</td>
                    <td>${lecture.documents_count} فصل</td>
                    <td class='d-flex gap-3 justify-content-center'>
                        <a href='/lecture/${lecture.id}'><i class='bi bi-link-45deg pointer' style='color: rgb(13, 110, 253)'></i></a>
                    </td>
                </tr>
            `
            return `${body}\n${row}`
        }, '')
    }).catch(() => {
        alert('حدث خطأ اثناء التحميل')
    })
}