export function log (level, description) {
    console.log(`[${level}]: ${new Date().toISOString()} => ${description}`)
}

export function info(description) {
    log("INFO", description)
}

export function error(description) {
    log("ERROR", description)
}

export function warn(description) {
    log("WARN", description)
}

export function debug(description) {
    log("DEBUG", description)
}