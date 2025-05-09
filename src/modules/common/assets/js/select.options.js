const loadGroupsSelectOptions = (select, params, choosenValue, choosenId) => {
    axios.get('/api/groups', { params }).then((response) => {
        const options = response.data.data.content
        let selectedIndex = 0
        select.innerHTML = options.reduce((previous, option, index) => {
            if (choosenValue === option.name || choosenId === option.id) {
                selectedIndex = index
            }
            return `${previous}\n<option value='${option.id}'>${option.name}</option>`
        }, '')
        select.selectedIndex = selectedIndex
    })
}

const loadCoursesSelectOptions = (select, params, choosenValue, choosenId) => {
    axios.get('/api/admin/course', { params }).then((response) => {
        const options = response.data.data.content
        let selectedIndex = 0
        select.innerHTML = options.reduce((previous, option, index) => {
            if (choosenValue === option.name || choosenId === option.id) {
                selectedIndex = index
            }
            return `${previous}\n<option value='${option.id}'>${option.name}</option>`
        }, '')
        select.selectedIndex = selectedIndex
    })
}