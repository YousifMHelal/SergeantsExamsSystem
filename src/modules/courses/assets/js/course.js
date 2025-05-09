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

    axios.get(`/api/courses/${courseId}`).then((response) => {
        const course = response.data.data
        courseNameHeader.innerHTML = course.name
        document.title = course.name
    }).catch(() => {
        alert('حدث خطا اثناء تحميل اسم المحاضرة')
    })

    fillVideosContainer()

})

function fillVideosContainer() {
    axios.get('/api/videos', { params }).then((response) => {
        const videos = response.data.data.content
        videosContainer.innerHTML = videos.reduce((body, video) => {
            const row = `
                <div class="rounded-2 position-relative overflow-hidden" style="width: 450px; border: 3px solid var(--main);">
                    <video src="/api/videos/${video.id}/view" controls class="w-100 h-100"></video>
                    <div class="d-flex align-items-center justify-content-between px-3 bg-dark" style="margin-top: -5px;">
                        <p class="mb-0 py-2 fs-6 fw-bold">${video.name}</p>
                    </div>
                </div>
            `
            return `${body}\n${row}`
        }, '')
    })
}