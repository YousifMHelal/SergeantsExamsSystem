const months = [ '', 'يناير', 'فبرابر', 'مارس', 'ابريل', 'مايو', 'يونيو', 'يوليو', 'اغسطس', 'سبتمبر', 'ديسمبر', 'نوفمبر', 'ديسمبر' ]
const halfs = [ 'صباحا', 'مساءا' ]

function dateStringToArabic(str) {

    const [ date, time ] = str.split('T')
    let [ year, month, day ] = date.split('-')
    let [ hour, minute ] = time.split(':')
    const half = Math.floor(hour / 12)
    hour = hour % 12 || 12

    year = parseInt(year)
    month = parseInt(month)
    day = parseInt(day)
    hour = parseInt(hour)
    minute = parseInt(minute)
 
    return `${year} ${months[month]} ${day} - ${hour}:${minute} ${halfs[half]}`
}

function parseQuery(search) {
    search = search.substring(1)
    const parts = search.includes('&') ? search.split('&') : [ search ]
    return parts.reduce((previous, current) => {
        const [ key, value ] = current.split('=')
        const isUndefined = typeof previous[key] === 'undefined'
        const isArray = isUndefined ? false : Array.isArray(previous[key])
        if (isUndefined) {
            previous[key] = value
        } else if (isArray) {
            previous[key].push(value)
        } else {
            previous[key] = [ previous[key], value ]
        }
        return previous
    }, {})
}