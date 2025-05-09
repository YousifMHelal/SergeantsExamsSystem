const examsTableBody = document.getElementById('examsTableBodyId')
const examinersTableBody = document.getElementById('examinersTableBodyId')
const searchInput = document.getElementById('searchInputId')
const examinerStatusSelect = document.getElementById('examinerStatusSelectId')
const downloadExcelFileLink = document.getElementById('downloadExcelFileLinkId')

var examId
var params = {}

document.addEventListener('DOMContentLoaded', () => {

    location.pathname.split('/').forEach((urlPart) => {
        if (urlPart.trim().length > 0 && /^[0-9]*$/.test(urlPart)) {
            examId = parseInt(urlPart)
        }
    })

    downloadExcelFileLink.href = `/api/admin/exams/${examId}/result/download`

    fillExamTable()
    fillExaminersTable()

})

searchInput.addEventListener('input', onSearchInput)

examinerStatusSelect.addEventListener('change', onSelectChange)

function fillExamTable() {
    axios.get(`/api/admin/exams/${examId}`).then((response) => {
        const exam = response.data.data
        examsTableBody.innerHTML = `
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
            </tr>`
    }).catch(() => {
        alert('حدث خطأ في الخادم')
    })
}

function fillExaminersTable() {
    axios.get(`/api/admin/exams/${examId}/result${stringifyParams()}`).then((response) => {
        const exam = response.data.data.exam
        const examiners = response.data.data.content
        examinersTableBody.innerHTML = examiners.reduce((previous, examienr) => {
            const tableRow = `
                <tr record-id="${exam.id}">
                    <td>${examienr.name}</td>
                    <td>${examienr.military_id}</td>
                    <td>${examienr.score === null ? 'لم يمتحن بعد' : `${examienr.score} / ${exam.questions_count} (${Math.floor(((examienr.score / exam.questions_count) * 10000) / 100)}%)`}</td>
                </tr>
            `
            return `${previous}\n${tableRow}`
        }, '')
    }).catch(() => {
        alert('حدث خطأ في الخادم')
    })
}

function openExam(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    const open = parseInt(element.attributes.getNamedItem('open-status').value) === 0 ? 1 : 0
    axios.put(`/api/admin/exams/${id}`, null, { params: { open } }).then(fillExamTable).catch(() => (alert('حدث خطأ اثناء تعديل الاختبار')))
}

function deleteExam(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/exams/${id}`).then(location.assign('/admin/exams')).catch(() => (alert('حدث خطأ اثناء حذف الاختبار')))
}

function onSearchInput() {
    const keyword = searchInput.value.trim()
    params.keyword = keyword === '' ? undefined : keyword
    fillExaminersTable()
}

function onSelectChange() {
    const value = examinerStatusSelect.options[examinerStatusSelect.selectedIndex].value
    params.done = value === '' ? undefined : value
    fillExaminersTable()
}

function stringifyParams() {
    const keys = Object.keys(params)
    if (keys.length === 0) return ""
    return keys.reduce((previous, current, index) => {
        const prefix = index === 0 ? "" : "&"
        const value = params[current]
        return typeof value !== 'undefined' ? `${previous}${prefix}${current}=${value}` : previous
    }, "?")
}