const examsTableBody = document.getElementById('examsTableBodyId')
const fileInput = document.getElementById('fileInputId')
const fileInputName = document.getElementById('fileInputNameId')
const uploadFileButton = document.getElementById('uploadFileButtonId')
const groupsSelect = document.getElementById('groupsSelectId')

var totalScore = 0, totalCount = 0, totalQuestion = 0, totalAnswers = 0

function deleteExam(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/exams/${id}`).then(fillExamsTable).catch(() => {
        alert('حدث خطأ اثناء حذف الاختبار')
    })
}

const fillExamsTable = () => {
    axios.get('/api/exams').then((response) => {
        totalScore = 0, totalCount = 0, totalQuestion = 0, totalAnswers = 0
        const exams = response.data.data.content
        examsTableBody.innerHTML = exams.length === 0
        ? '<tr><td colspan="4">لا يوجد بيانات</td></tr>'
        : exams.reduce((previous, exam) => {
            const tableRow = `
                <tr record-id='${exam.id}'>
                    <td>${exam.name}</td>
                    <td>${exam.questions_count}</td>
                    <td>${exam.duration === null ? 'لم يحدد' : `${exam.duration} دقائق`}</td>
                    <td>${getEnterExamTag(exam)}</td>
                </tr>`
            return `${previous}\n${tableRow}`
        }, '')
        if (totalCount > 0) {
            examsTableBody.innerHTML += `<tr><td colspan="3" class='fw-bold fs-6' style='color:var(--main)'>اجمالي المجموع</td><td class='fw-bold fs-6' style='color:var(--main)'>${totalAnswers} / ${totalQuestion} (${totalScore / totalCount}%)</td></tr>`
        }
    }).catch(() => {    
        alert('حدث خطأ في الخادم')
    })
}

const getEnterExamTag = (exam) => {
    if (exam.answers_count !== null && (exam.answers_count === exam.questions_count || new Date() >= new Date(exam.ends_at))) {
        const score = Math.floor(((exam.score / exam.questions_count) * 10000) / 100)
        totalScore += score
        totalQuestion += exam.questions_count
        totalAnswers += exam.score
        totalCount++
        return `<span class="exam-score">${exam.score} / ${exam.questions_count} (${score}%)</span>`
    } else if (Boolean(exam.open) && exam.duration !== null && parseInt(exam.duration) > 0) {
        if (exam.answers_count !== null) {
            return `<a href="/exam/${exam.id}" class="resume-exam">اكمل الاختبار</a>`
        } else {
            return `<a href="/exam/${exam.id}" class="enter-exam">بدأ الاختبار</a>`
        }
    } else {
        return '<span class="not-open-exam">لم يتم فتح الاختبار بعد</span>'
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fillExamsTable()
})