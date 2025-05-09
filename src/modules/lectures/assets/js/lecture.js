const lectureNameHeader = document.getElementById('lectureNameHeaderId')
const documentsTableBody = document.getElementById('documentsTableBodyId')

var lectureId
var params

document.addEventListener('DOMContentLoaded', () => {

    location.pathname.split('/').forEach((urlPart) => {
        if (urlPart.trim().length > 0 && /^[0-9]*$/.test(urlPart)) {
            lectureId = parseInt(urlPart)
        }
    })

    params = { lectureId }

    axios.get(`/api/lecture/${lectureId}`).then((response) => {
        const lecture = response.data.data
        lectureNameHeader.innerHTML = lecture.name
        document.title = lecture.name
    }).catch((error) => {
        console.log(error.message)
        alert('حدث خطا اثناء تحميل اسم المنهج')
    })

    fillDocumentsTable()

})

function fillDocumentsTable() {
    axios.get('/api/document', { params }).then((response) => {
        const documents = response.data.data.content
        documentsTableBody.innerHTML = documents.length === 0  
        ? '<tr><td colspan="3">لا يوجد بيانات</td></tr>'
        : documents.reduce((body, document) => {
            const row = `
                <tr record-id='${document.id}'>
                    <td>${document.name}</td>
                    <td>${document.pages_count} صفحة</td>
                    <td class='d-flex gap-3 justify-content-center'>
                        <a href='/document/${document.id}'><i class='bi bi-link-45deg pointer' style='color: rgb(13, 110, 253)'></i></a>
                    </td>
                </tr>
            `
            return `${body}\n${row}`
        }, '')
    })
}