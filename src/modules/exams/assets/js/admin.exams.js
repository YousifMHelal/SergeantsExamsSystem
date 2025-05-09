const examsTableBody = document.getElementById('examsTableBodyId')
const fileInput = document.getElementById('fileInputId')
const fileInputName = document.getElementById('fileInputNameId')
const uploadFileButton = document.getElementById('uploadFileButtonId')
const groupsSelect = document.getElementById('groupsSelectId')
const cancelFileInput = document.getElementById('cancelFileInputId')
const inputSpan = document.getElementById('inputSpanId')

function openExam(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    const open = parseInt(element.attributes.getNamedItem('open-status').value) === 0 ? 1 : 0
    axios.put(`/api/admin/exams/${id}`, null, { params: { open } }).then(fillExamsTable).catch(() => (alert('حدث خطأ اثناء تعديل الاختبار')))
}

function deleteExam(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/exams/${id}`).then(fillExamsTable).catch(() => (alert('حدث خطأ اثناء حذف الاختبار')))
}

function updateExamDuration(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    const params = { duration: element.value === '' ? 'null' : element.value }
    axios.put(`/api/admin/exams/${id}`, null, { params }).then(fillExamsTable).catch(() => (alert('حدث خطأ اثناء تعديل الاختبار')))
}

function updateQuestionCount(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    const params = { questions_count: element.value }
    axios.put(`/api/admin/exams/${id}`, null, { params }).then(fillExamsTable).catch(() => (alert('حدث خطأ اثناء تعديل الاختبار')))
}

const fillExamsTable = () => {
    axios.get('/api/admin/exams').then((response) => {
        const exams = response.data.data.content
        examsTableBody.innerHTML = exams.length === 0 
        ? '<tr><td colspan="10">لا يوجد بيانات</td></tr>'
        : exams.reduce((previous, exam) => {
            const tableRow = `
                <tr record-id="${exam.id}">
                    <td>${exam.name}</td>
                    <td>${exam.group_name}</td>
                    <td>${dateStringToArabic(exam.created_at)}</td>
                    <td>${exam.total_questions_count}</td>
                    <td>
                        <input required type="number" min="1" max="${exam.total_questions_count}" onchange="updateQuestionCount(this)" value="${exam.questions_count}">
                        <span>سؤال</span>
                    </td>
                    <td>
                        <input type="number" min="1" onchange="updateExamDuration(this)" ${exam.duration ? `value="${exam.duration}"` : ''}>
                        <span>دقائق</span>
                    </td>
                    <td>${exam.done_count} / ${exam.examiners_count}</td>
                    <td><i onclick="openExam(this)" class="bi ${exam.open ? 'bi-toggle-on' : 'bi-toggle-off'} pointer" style="color: ${exam.open ? 'green' : 'red'};" open-status="${exam.open}"></i></td>
                    <td><i onclick="deleteExam(this)" class="bi bi-trash-fill text-danger pointer"></i></td>
                    <td><a href="/admin/exams/${exam.id}"><i class="bi bi-link-45deg pointer"></i></a></td>
                </tr>`
            return `${previous}\n${tableRow}`
        }, '')
    }).catch(() => {
        alert('حدث خطأ في الخادم')
    })
}

document.addEventListener('DOMContentLoaded', () => {
    fillExamsTable()
})

fileInput.addEventListener('change', () => {
    if (fileInput.files[0].type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        fileInput.value = ''
        return alert('برجاء اختيار ملف اكسيل صحيح')
    }

    loadGroupsSelectOptions(groupsSelect)
    uploadFileButton.style.display = 'block'
    groupsSelect.style.display = 'block'
    fileInputName.style.display = 'block'
    cancelFileInput.style.display = 'block'
    inputSpan.classList.remove('d-flex')
    inputSpan.style.display = 'none'
    fileInputName.innerHTML = `${fileInput.files[0].name}`

    groupsSelect.disabled = false
    uploadFileButton.disabled = false
})

uploadFileButton.addEventListener('click', () => {
    const body = new FormData()
    body.append('file', fileInput.files[0])
    const params = { groupId: groupsSelect.options[groupsSelect.selectedIndex].value }
    axios.post('/api/admin/exams/upload', body, { params }).then(() => {
        fillExamsTable()
        fileInput.value = ''
        groupsSelect.disabled = true
        uploadFileButton.disabled = true
        uploadFileButton.style.display = 'none'
        groupsSelect.style.display = 'none'
        fileInputName.style.display = 'none'
        cancelFileInput.style.display = 'none'
        inputSpan.classList.add('d-flex')
    }).catch(() => {
        alert('حدث خطأ اثناء الرفع')
    })
})

cancelFileInput.addEventListener("click", () => {
    fileInput.value = ''
    groupsSelect.disabled = true
    uploadFileButton.disabled = true
    uploadFileButton.style.display = 'none'
    groupsSelect.style.display = 'none'
    fileInputName.style.display = 'none'
    cancelFileInput.style.display = 'none'
    inputSpan.classList.add('d-flex')
})