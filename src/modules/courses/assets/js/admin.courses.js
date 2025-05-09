const courseTableBody = document.getElementById('courseTableBodyId')
const videoInput = document.getElementById('videoInputId')
const uploadVideoButton = document.getElementById('uploadVideoButtonId')
const coursesSelect = document.getElementById('coursesSelectId')
const addCourseButton = document.getElementById('addCourseButtonId')
const courseNameInput = document.getElementById('courseNameInputId')
const addCourseSubmitButton = document.getElementById('addCourseSubmitButtonId')
const addCourseContainer = document.getElementById('addCourseContainerId')
const courseExitButton = document.getElementById('courseExitButtonId')
const addVideoContainer = document.getElementById('addVideoContainerId')
const videoExitButton = document.getElementById('videoExitButtonId')
const videoNameInput = document.getElementById('videoNameInputId')
const addVideoSubmitButton = document.getElementById('addVideoSubmitButtonId')
const courseOpenSelect = document.getElementById('courseOpenSelectId')
const searchInput = document.getElementById('searchInputId')

var params = {}

document.addEventListener('DOMContentLoaded', fillCoursesTable)

addCourseButton.addEventListener('click', addCourseButtonOnClick)
courseExitButton.addEventListener('click', addCourseButtonOnClick)

courseOpenSelect.addEventListener('change', () => {
    const selectedValue = courseOpenSelect.options[courseOpenSelect.selectedIndex].value
    params.open = selectedValue === '' ? undefined : selectedValue
    fillCoursesTable()
})

searchInput.addEventListener('input', () => {
    const keyword = searchInput.value.trim()
    params.keyword = keyword === '' ? undefined : keyword
    return fillCoursesTable()
})

videoExitButton.addEventListener('click', () => {
    addVideoContainer.classList.add('d-none')
    videoNameInput.value = ''
    videoInput.value = ''
})

addCourseSubmitButton.addEventListener('click', () => {
    const name = courseNameInput.value
    if (name.trim().length === 0) {
        return alert('الاسم فارغ')
    }
    axios.post('/api/admin/course', { name }).then(() => {
        addCourseButtonOnClick()
        fillCoursesTable()
    }).catch(() => {
        alert('حدث خطأ اثناء اضافة المحاضرة')
    })
})

videoInput.addEventListener('change', async () => {
    if (videoInput.files.length === 0) {
        return alert('لم يتم اختبار فيديو')
    }
    const video = videoInput.files[0]
    if (video.type !== 'video/mp4') {
        return alert('فيديو غير صالح')
    }
    loadCoursesSelectOptions(coursesSelect)
    addVideoContainer.classList.remove('d-none')
    videoNameInput.value = video.name.substring(0, (video.name.length - 4))
})

addVideoSubmitButton.addEventListener('click', () => {
    const video = videoInput.files[0]
    const name = videoNameInput.value.trim()
    const courseId = coursesSelect.options[coursesSelect.selectedIndex].value
    if (name.length === 0) {
        return alert('اسم محاضرة فارغ')
    }
    const body = new FormData()
    body.append('video', video)
    axios.post('/api/admin/video', body, { params: { name, courseId } }).then(fillCoursesTable).catch(() => {
        alert('حدث خطا اثناء اضافة المحاضرة')
    }).finally(() => {
        addVideoContainer.classList.add('d-none')
        videoNameInput.value = ''
        videoInput.value = ''
    })
})

function fillCoursesTable() {
    axios.get('/api/admin/course', { params }).then((response) => {
        const courses = response.data.data.content
        courseTableBody.innerHTML = courses.length === 0
        ? '<tr><td colspan="3">لا يوجد بيانات</td></tr>'
        : courses.reduce((body, course) => {
            const openClass = course.open === 1 ? 'bi-toggle-on' : 'bi-toggle-off'
            const openColor = course.open === 1 ? 'green' : 'red'
            const row = `
                    <tr record-id='${course.id}'>
                        <td>${course.name}</td>
                        <td>${course.videos_count} محاضرة</td>
                        <td class='d-flex gap-3 justify-content-center'>
                            <a href='/admin/course/${course.id}'><i class='bi bi-link-45deg pointer' style='color: rgb(13, 110, 253)'></i></a>
                            <i course-open='${course.open}' onclick='toggleCourseOpenStatus(this)' class='bi ${openClass} pointer' style='color: ${openColor}'></i>
                            <i onclick='deleteCourse(this)' class='bi bi-trash-fill text-danger pointer'></i>
                        </td>
                    </tr>
                `
            return `${body}\n${row}`
        }, '')
    }).catch(() => {
        alert('حدث خطأ اثناء التحميل')
    })
}

function deleteCourse(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/course/${id}`).then(fillCoursesTable).catch(() => {
        alert('حدث خطأ اثناء حذف المحاضرة')
    })
}

function toggleCourseOpenStatus(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    const courseOpen = element.attributes.getNamedItem('course-open').value
    axios.put(`/api/admin/course/${id}`, null, { params: { open: courseOpen === '1' ? '0' : '1' } }).then(fillCoursesTable).catch(() => {
        alert('حدث خطأ اثناء حذف المحاضرة')
    })
}

function addCourseButtonOnClick() {
    addCourseContainer.classList.toggle('d-none')
    courseNameInput.value = ''
}