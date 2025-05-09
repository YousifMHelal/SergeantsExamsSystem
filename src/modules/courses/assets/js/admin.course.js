const videosContainer = document.getElementById('videosContainerId')
const courseNameHeader = document.getElementById('courseNameHeaderId')

var courseId
var params

document.addEventListener('DOMContentLoaded', () => {

    location.pathname.split('/').forEach((urlPart) => {
        if (urlPart.trim().length > 0 && /^[0-9]*$/.test(urlPart)) {
            courseId = parseInt(urlPart)
        }
    })

    params = { courseId }

    axios.get(`/api/admin/course/${courseId}`).then((response) => {
        const course = response.data.data
        courseNameHeader.innerHTML = course.name
        document.title = course.name
    }).catch(() => {
        alert('حدث خطا اثناء تحميل اسم المحاضرة')
    })

    fillVideosContainer()

})

function fillVideosContainer() {
    axios.get('/api/admin/video', { params }).then((response) => {
        const videos = response.data.data.content
        videosContainer.innerHTML = videos.reduce((body, video) => {
            const openClass = video.open === 1 ? 'bi-toggle-on' : 'bi-toggle-off'
            const openColor = video.open === 1 ? 'green' : 'red'
            const row = `
                <div class="rounded-2 position-relative overflow-hidden" style="width: 450px; border: 3px solid var(--main);">
                    <video src="/api/admin/video/${video.id}/view" controls class="w-100 h-100"></video>
                    <div class="d-flex align-items-center justify-content-between px-3 bg-dark" style="margin-top: -5px;">
                        <p class="mb-0 py-2 fs-6 fw-bold">${video.name}</p>
                        <div class="d-flex gap-2 me-3" record-id="${video.id}">
                            <i onclick="toggleOpenVideo(this)" video-open="${video.open}" class='bi ${openClass} pointer fs-5 fw-bold' style="color: ${openColor}"></i>
                            <i onclick="deleteVideo(this)" class='bi bi-trash-fill text-danger pointer fs-5 fw-bold'></i>
                        </div>
                    </div>
                </div>
            `
            return `${body}\n${row}`
        }, '')
    })
}

function deleteVideo(element) {
    const id = element.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/video/${id}`).then(fillVideosContainer).catch(() => {
        alert('لقد حدث خطأ اثناء حذف المحاضرة')
    })
}

function toggleOpenVideo(element) {
    const id = element.parentElement.attributes.getNamedItem('record-id').value
    const videoOpen = element.attributes.getNamedItem('video-open').value
    axios.put(`/api/admin/video/${id}`, null, { params: { open: videoOpen === '1' ? 0 : 1 } }).then(() => {
        const newVideoOpen = videoOpen === '1' ? '0' : '1'
        const openClass = newVideoOpen === '1' ? 'bi-toggle-on' : 'bi-toggle-off'
        const openColor = newVideoOpen === '1' ? 'green' : 'red'
        element.classList.remove('bi-toggle-on')
        element.classList.remove('bi-toggle-off')
        element.style.color = openColor
        element.classList.add(openClass)
        element.attributes.getNamedItem('video-open').value = newVideoOpen
    }).catch(() => {
        alert('لقد حدث خطأ اثناء تعديل المحاضرة')
    })
}