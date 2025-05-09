const showButton = document.getElementById('showButtonId')
const hideButton = document.getElementById('hideButtonId')
const submitButton = document.getElementById('submitButtonId')
const messageLabel = document.getElementById('messageLabelId')
const usernameInput = document.getElementById('usernameInputId')
const passwordInput = document.getElementById('passwordInputId')

const submitLoginForm = () => {
  const username = usernameInput.value
  const password = passwordInput.value

  if (!(username) || !(password)) {
    messageLabel.innerHTML = 'برجاء التأكد من ادخال اسم المستخدم وكلمة المرور'
    messageLabel.style.display = ''
    return
  }

  axios.post('/api/auth/login', { username, password }).then(() => {
      location.assign(parseQuery(location.search)['back-to'] ?? '/')
    }).catch(() => {
      messageLabel.innerHTML = 'خطا في اسم المستخدم او كلمة المرور'
      messageLabel.style.display = ''
    })
}

document.addEventListener('keypress', (event) => {
  if ([ 'Enter', 'NumpadEnter' ].includes(event.code)) {
    submitLoginForm()
  }
})

submitButton.addEventListener('click', submitLoginForm)

passwordInput.addEventListener('input', () => {
  if (passwordInput.value.length === 0) {
    showButton.style.display = 'none'
  } else if (
    passwordInput.value.length > 0 &&
    passwordInput.type === 'password'
  ) {
    showButton.style.display = 'block'
  }
})

showButton.addEventListener('click', () => {
  passwordInput.type = 'text'
  hideButton.style.display = 'block'
  showButton.style.display = 'none'
})

hideButton.addEventListener('click', () => {
  passwordInput.type = 'password'
  showButton.style.display = 'block'
  hideButton.style.display = 'none'
})