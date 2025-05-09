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

    console.log({ params })

    axios.get(`/api/admin/lecture/${lectureId}`).then((response) => {
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
    axios.get('/api/admin/document', { params }).then((response) => {
        const documents = response.data.data.content
        documentsTableBody.innerHTML = documents.length === 0  
        ? '<tr><td colspan="3">لا يوجد بيانات</td></tr>'
        : documents.reduce((body, document) => {
            const openClass = document.open === 1 ? 'bi-toggle-on' : 'bi-toggle-off'
            const openColor = document.open === 1 ? 'green' : 'red'
            const row = `
                <tr record-id='${document.id}'>
                    <td>${document.name}</td>
                    <td>${document.pages_count} صفحة</td>
                    <td class='d-flex gap-3 justify-content-center'>
                        <a href='/admin/document/${document.id}'><i class='bi bi-link-45deg pointer' style='color: rgb(13, 110, 253)'></i></a>
                        <i document-open='${document.open}' onclick='toggleDocumentOpenStatus(this)' class='bi ${openClass} pointer' style='color: ${openColor}'></i>
                        <i onclick='deleteDocument(this)' class='bi bi-trash-fill text-danger pointer'></i>
                    </td>
                </tr>
            `
            return `${body}\n${row}`
        }, '')
    })
}

function deleteDocument(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/document/${id}`).then(fillDocumentsTable).catch(() => {
        alert('لقد حدث خطأ اثناء حذف الفصل')
    })
}

function toggleDocumentOpenStatus(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    const documentOpen = element.attributes.getNamedItem('document-open').value
    axios.put(`/api/admin/document/${id}`, null, { params: { open: documentOpen === '1' ? 0 : 1 } }).then(fillDocumentsTable).catch(() => {
        alert('لقد حدث خطأ اثناء تعديل الفصل')
    })
}