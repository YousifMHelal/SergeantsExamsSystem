const searchInput = document.getElementById('searchInputId')
const lectureOpenSelect = document.getElementById('lectureOpenSelectId')
const lecturesTableBody = document.getElementById('lecturesTableBodyId')

const addPartButton = document.getElementById('addPartButtonId')
const lectureExitButton = document.getElementById('lectureExitButtonId')
const addLecturesContainer = document.getElementById('addLecturesContainerId')
const lectureInput = document.getElementById('lectureInputId')
const lectureNameInput = document.getElementById('lectureNameInputId')
const submitButton = document.getElementById('submitButtonId')
const selectionsBody = document.getElementById('selectionsBodyId')
const nameInput = document.getElementById('nameInputId')
const expresionInput = document.getElementById('expresionInputId')

var params = {}

document.addEventListener('DOMContentLoaded', () => {
    fillLecturesTable()
})

lectureExitButton.addEventListener('click', addLecturesButtonOnClick)

lectureOpenSelect.addEventListener('change', () => {
    const selectedValue = lectureOpenSelect.options[lectureOpenSelect.selectedIndex].value
    params.open = selectedValue === '' ? undefined : selectedValue
    fillLecturesTable()
})

searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim()
    params.keyword = keyword === '' ? undefined : keyword
    fillLecturesTable()
})

addPartButton.addEventListener('click', () => {
    const tr = document.createElement('tr')
    tr.innerHTML = `
        <td><input class="w-100" type="text" placeholder="الاسم"></td>
        <td><input class="w-100" type="text" placeholder="مثال: 1,2,3"></td>
    `
    selectionsBody.appendChild(tr)
}) 

function fillLecturesTable() {
    axios.get('/api/admin/lecture', { params }).then((response) => {
        const lectures = response.data.data.content
        lecturesTableBody.innerHTML = lectures.length === 0
        ? '<tr><td colspan="3">لا يوجد بيانات</td></tr>'
        : lectures.reduce((body, lecture) => {
            const openClass = lecture.open === 1 ? 'bi-toggle-on' : 'bi-toggle-off'
            const openColor = lecture.open === 1 ? 'green' : 'red'
            const row = `
                <tr record-id='${lecture.id}'>
                    <td>${lecture.name}</td>
                    <td>${lecture.documents_count} فصل</td>
                    <td class='d-flex gap-3 justify-content-center'>
                            <a href='/admin/lecture/${lecture.id}'><i class='bi bi-link-45deg pointer' style='color: rgb(13, 110, 253)'></i></a>
                            <i lecture-open='${lecture.open}' onclick='toggleLectureOpenStatus(this)' class='bi ${openClass} pointer' style='color: ${openColor}'></i>
                            <i onclick='deleteLecture(this)' class='bi bi-trash-fill text-danger pointer'></i>
                    </td>
                </tr>
            `
            return `${body}\n${row}`
        }, '')
    }).catch(() => {
        alert('حدث خطأ اثناء التحميل')
    })
}

function deleteLecture(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/lecture/${id}`).then(fillLecturesTable).catch(() => {
        alert('حدث خطأ اثناء حذف المنهج')
    })
}

function toggleLectureOpenStatus(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    const lectureOpen = element.attributes.getNamedItem('lecture-open').value
    axios.put(`/api/admin/lecture/${id}`, null, { params: { open: lectureOpen === '1' ? '0' : '1' } }).then(fillLecturesTable).catch(() => {
        alert('حدث خطأ اثناء تعديل المنهج')
    })
}

function addLecturesButtonOnClick() {
    expresionInput.value = ''
    nameInput.value = ''
    addLecturesContainer.classList.toggle('d-none')
}

lectureInput.addEventListener('change', async () => {

    if (lectureInput.files.length === 0) {
        return alert('لم يتم اختيار ملف ')
    }
    const lecture = lectureInput.files[0]
    addLecturesContainer.classList.remove('d-none')
    lectureNameInput.value = lecture.name.substring(0, (lecture.name.length - 4))
})

submitButton.addEventListener('click', () => {   
    const document = lectureInput.files[0]    
    if (document.type !== 'application/pdf'){
        lectureInput.value = ''
        return alert('ملف غير صالح')
    }

    const body = new FormData()
    body.append('document', document)
    const selections = []
    for (let idx = 0, len = selectionsBody.children.length; idx < len; ++idx) {
        const tr = selectionsBody.children.item(idx)
        const name = tr.children.item(0).children.item(0).value.trim()
        const expression = tr.children.item(1).children.item(0).value.trim()
        if (name.length > 0 && expression.length > 0) {
            selections.push({ name, expression })
            console.log(selections);
        }
    }
    axios.post('/api/admin/lecture/upload', body, { params: { selections, name: lectureNameInput.value } }).then((response) => {
        addLecturesButtonOnClick()
        fillLecturesTable()
    }).catch((error) => {
        let message = 'حدث خطاء اثناء التحميل'
        if (error.response.data.message === 'Lecture with this name already exists') {
            message = 'اسم المنهج موجود بالفعل'
        }
        alert(message)
    })
})