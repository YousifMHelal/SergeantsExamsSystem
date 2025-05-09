const nextButton = document.getElementById('nextButtonId')
const remainTimeDiv = document.getElementById('remainTimeDivId')
const previousButton = document.getElementById('previousButtonId')
const questionHeader = document.getElementById('questionHeaderId')
const answerButtonsContainer = document.getElementById('answerButtonsContainerId')
const finishExamDiv = document.getElementById('finishExamDivId')
const scoreSpan = document.getElementById('scoreSpanId')
const userNameDiv = document.getElementById('userNameDivId')
const examNameDiv = document.getElementById('examNameDivId')
const progressDiv = document.getElementById('progressDivId')

var examId
var questionId
var examDetails
var previousCount = 0

document.addEventListener('DOMContentLoaded', () => {

    location.pathname.split('/').forEach((urlPart) => {
        if (urlPart.trim().length > 0 && /^[0-9]*$/.test(urlPart)) {
            examId = parseInt(urlPart)
        }
    })

    axios.put(`/api/exams/${examId}/start`).catch(() => {
        console.log('Exam started before')
    }).finally(() => {
        updateExamDetails().then(() => {
            if (examDetails.answers_count === examDetails.questions_count) {
                return handleExamFinish()
            }

            examNameDiv.innerHTML = examDetails.name

            updateProgress()
            setNextQuestion()
            updateRemainTime()
            updatePreviousButtonVisibility()
            updateNextButtonVisibility()

            // Interval to handle remain time update, every single second
            setInterval(updateRemainTime, 1000)
        }).catch(handleExamNotStarted)
    })
    
    axios.get('/api/profile').then((response) => {
        userNameDiv.innerHTML = response.data.data.name
    }).catch(() => {
        userNameDiv.innerHTML = 'لا يوجد'
    })

})

nextButton.addEventListener('click', () => {
    submitCurrentAnswer().then(async () => {
        await updateExamDetails()
        previousCount--
        previousCount = Math.max(0, previousCount)
        updateProgress()
        if (previousCount === 0) {
            setNextQuestion().then(() => {
                // resetAnswerButtons()
                updatePreviousButtonVisibility()
                updateNextButtonVisibility()
            })
        } else {
            setPreviousQuestion().then((choosenAnswerId) => {
                // resetAnswerButtons()
                handleSelectChoosenAnswer(choosenAnswerId)
                updatePreviousButtonVisibility()
                updateNextButtonVisibility()
            })
        }
    }).catch(() => {
        alert('خدث خطأ اثناء تسجيل الاجابة')
    })
})

previousButton.addEventListener('click', () => {
    previousCount++
    updateProgress()
    setPreviousQuestion().then((choosenAnswerId) => {
        // resetAnswerButtons()
        handleSelectChoosenAnswer(choosenAnswerId)
        updatePreviousButtonVisibility()
        updateNextButtonVisibility()
    }).catch(() => {
        alert('خدث خطأ اثناء تسجيل الاجابة')
    })
})

function updateExamDetails() {
    return axios.get(`/api/exams/${examId}`).then((response) => {
        examDetails = response.data.data
    })
}

function handleSelectChoosenAnswer(choosenAnswerId) {
    getButtons().forEach((button) => {
        if (parseInt(button.attributes.getNamedItem('answerId').value) === choosenAnswerId) {
            button.classList.add('active')
        }
    })
}

function handleAnswerButtonClick(button) {
    resetAnswerButtons()
    button.classList.add('active')
    updateNextButtonVisibility()
}

function resetAnswerButtons() {
    getButtons().forEach((button) => (button.classList.remove('active')))
}

function setPreviousQuestion() {
    return axios.get(`/api/exams/${examId}/previous?count=${previousCount}`).then((response) => {
        const questionData = response.data.data
        questionId = questionData.id
        questionHeader.innerHTML = questionData.question
        answerButtonsContainer.innerHTML = questionData.answers
            .map((answer) => (`<button answerId="${answer.id}" class="answer text-light rounded-pill py-2" style="border: 2px solid #ddd; width: 45%; background-color: #01638a;" onclick="handleAnswerButtonClick(this)">${answer.answer}</button>`))
            .join('\n')
        return questionData.answers.reduce((defaultValue, answer) => (answer.answered ? answer.id : defaultValue), 0)
    }).catch(() => {
        alert('حدث خطأ')
    })
}

function setNextQuestion() {
    return axios.get(`/api/exams/${examId}/next`).then((response) => {
        const questionData = response.data.data
        questionId = questionData.id
        questionHeader.innerHTML = questionData.question
        answerButtonsContainer.innerHTML = questionData.answers
            .map((answer) => (`<button answerId="${answer.id}" class="answer text-light rounded-pill py-2" style="border: 2px solid #ddd; width: 45%; background-color: #01638a;" onclick="handleAnswerButtonClick(this)">${answer.answer}</button>`))
            .join('\n')
    }).catch((error) => {
        if (parseInt(error.response.data.code) === 552) {
            handleExamFinish()   
        }
    })
}

function handleExamFinish() {
    scoreSpan.innerHTML = `${examDetails.score} / ${examDetails.questions_count}`
    finishExamDiv.style.display = ''
    setTimeout(() => (location.assign('/exams')), 10_000)
}

function handleExamNotStarted() {
    // TODO: handle not started
    location.assign('/exams')
}

function submitCurrentAnswer() {
    const answerId = getButtonsList().reduce((defaultValue, button) => (button.classList.contains('active')
        ? button.attributes.getNamedItem('answerId').value
        : defaultValue), -1)
    if (answerId === -1) {
        return updateNextButtonVisibility()
    }
    return axios.put(`/api/exams/${examId}/questions/${questionId}/answers/${answerId}`)
}

function updateRemainTime() {
    const endDate = new Date(examDetails.ends_at)
    const currentDate = new Date()
    const remainSeconds = Math.floor((endDate.getTime() - currentDate.getTime()) / 1000)
    if (remainSeconds <= 0) {
        // TODO: handle exam time out action
        return location.assign('/exams')
    }
    const minutes = Math.floor(remainSeconds / 60)
    const seconds = remainSeconds % 60
    remainTimeDiv.innerHTML = `${minutes} : ${seconds}`
}

function updatePreviousButtonVisibility() {
    previousButton.disabled = examDetails.answers_count === 0 || previousCount >= examDetails.answers_count
}

function updateNextButtonVisibility() {
    nextButton.disabled = getButtonsList().reduce((previous, button) => (previous && !(button.classList.contains('active'))), true)
}

function updateProgress() {
    progressDiv.innerHTML = `${examDetails.answers_count - previousCount + 1} / ${examDetails.questions_count}`
}

function getButtons() {
    return answerButtonsContainer.querySelectorAll('button')
}

function getButtonsList() {
    const buttonsList = []
    getButtons().forEach((button) => (buttonsList.push(button)))
    return buttonsList
}