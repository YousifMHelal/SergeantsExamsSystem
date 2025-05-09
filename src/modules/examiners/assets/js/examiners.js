const examinersTableBody = document.getElementById('examinersTableBodyId')
const fileInput = document.getElementById('fileInputId')
const fileInputName = document.getElementById('fileInputNameId')
const uploadFileButton = document.getElementById('uploadFileButtonId')
const selectAllInput = document.getElementById('selectAllInputId')
const generateUsersButton = document.getElementById('generateUsersButtonId')

function deleteExaminer(element) {
    const id = element.parentElement.parentElement.attributes.getNamedItem('record-id').value
    axios.delete(`/api/admin/examiners/${id}`).then(fillExaminersTable).catch(() => {
        alert('حدث خطأ اثناء حذف الممتحن')
    })
}

const getSelectedRows = () => {
    const rows = examinersTableBody.children
    const selectedRows = []
    for (let index = 0; index < rows.length; ++index) {
        if (rows.item(index).children.item(0).children.item(0).checked) {
            selectedRows.push(rows.item(index))
        }
    }
    return selectedRows
}

const fillExaminersTable = () => {
    axios.get('/api/admin/examiners').then((response) => {
        const examiners = response.data.data.content
        examinersTableBody.innerHTML = examiners.length === 0
        ? '<tr><td colspan="7">لا يوجد بيانات</td></tr>'
        : examiners.reduce((previous, examiner) => {
            const tableRow = `
                <tr record-id='${examiner.id}'>
                    <td><input type="checkbox" /></td>
                    <td>${examiner.name}</td>
                    <td>${examiner.group_name}</td>
                    <td>${examiner.military_id}</td>
                    <td>${examiner.degree}</td>
                    <td>${examiner.password ?? 'لا توجد'}</td>
                    <td><i onclick='deleteExaminer(this)' class='bi bi-trash-fill text-danger pointer'></i></td>
                </tr>`
            return `${previous}\n${tableRow}`
        }, '')
    }).catch(() => {
        alert('حدث خطأ في الخادم')
    })
}

document.addEventListener('DOMContentLoaded', () => {
    fillExaminersTable()
})

fileInput.addEventListener('change', () => {
    if (fileInput.files[0].type !== 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        fileInput.value = ''
        return alert('برجاء اختيار ملف اكسيل صحيح')
    }

    fileInputName.style.display = 'block'
    fileInputName.innerHTML = `${fileInput.files[0].name}`

    uploadFileButton.disabled = false
})

uploadFileButton.addEventListener('click', () => {
    const body = new FormData()
    body.append('file', fileInput.files[0])
    axios.post('/api/admin/examiners/upload', body).then(() => {
        fillExaminersTable()
        fileInput.value = ''
        fileInputName.style.display = 'none'
        fileInputName.innerHTML = ''
        uploadFileButton.disabled = true
    }).catch((error) => {
        let message = 'حدث خطأ اثناء الرفع'
        if (error.response.data.code === 445) {
            message = 'الملف يحتوي هلي ممتحنين بأرقام عسكرية مسجلة بالفعل ولا يمكن تكرارها'
        }
        alert(message)
    })
})

selectAllInput.addEventListener('change', () => {
    const rows = examinersTableBody.children
    for (let index = 0; index < rows.length; ++index) {
        rows.item(index).children.item(0).children.item(0).checked = selectAllInput.checked
    }
})

generateUsersButton.addEventListener('click', () => {
    const selectedRows = getSelectedRows()
    if (selectedRows.length === 0) {
        return alert('لم يتم تحديد مستخدمين')
    }
    const idList = selectedRows.map((row) => (row.attributes.getNamedItem('record-id').value))
    axios.get('/api/admin/examiners/generate', { params: { id: idList } }).then(() => {
        fillExaminersTable()
        selectAllInput.checked = false
    }).catch(() => {
        alert('لقد حدث خطأ')
    })
})