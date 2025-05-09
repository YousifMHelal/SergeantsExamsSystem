export const number = (value) => (!(isNaN(value)))
export const numberOrGet = (value, defaultValue) => (number(value) ? value : defaultValue)
export const numberOrThrow = (value, message) => {
    if (!(number(value))) {
        throw new Error(message ?? '')
    }
}

export const greaterThanEqual = (value, min) => (number(value) && value >= min)
export const greaterThanEqualOrGet = (value, min, defaultValue) => (greaterThanEqual(value, min) ? value : defaultValue)
export const greaterThanEqualOrThrow = (value, min, message) => {
    if (!(greaterThanEqual(value, min))) {
        throw new Error(message ?? '')
    }
}

export const greaterThan = (value, min) => (number(value) && value > min)
export const greaterThanOrGet = (value, min, defaultValue) => (greaterThan(value, min) ? value : defaultValue)
export const greaterThanOrThrow = (value, min, message) => {
    if (!(greaterThan(value, min))) {
        throw new Error(message ?? '')
    }
}

export const smallerThan = (value, max) => (number(value) && value < max)
export const smallerThanOrGet = (value, max, defaultValue) => (smallerThan(value, max) ? value : defaultValue)
export const smallerThanOrThrow = (value, max, message) => {
    if (!(smallerThan(value, max))) {
        throw new Error(message ?? '')
    }
}

export const smallerThanEqual = (value, max) => (number(value) && value <= max)
export const smallerThanEqualOrGet = (value, max, defaultValue) => (smallerThanEqual(value, max) ? value : defaultValue)
export const smallerThanEqualOrThrow = (value, max, message) => {
    if (!(smallerThanEqual(value, max))) {
        throw new Error(message ?? '')
    }
}

export const notNull = (value) => (value !== null)
export const notNullOrGet = (value, defaultValue) => (notNull(value) ? value : defaultValue)
export const notNullOrThrow = (value, message) => {
    if (!(notNull(value))) {
        throw new Error(message ?? '')
    }
}

export const defined = (value) => (typeof value !== 'undefined')
export const definedOrGet = (value, defaultValue) => (defined(value) ? value : defaultValue)
export const definedOrThrow = (value, message) => {
    if (!(defined(value))) {
        throw new Error(message ?? '')
    }
}

export const string = (value) => (typeof value === 'string')
export const stringOrGet = (value, defaultValue) => (string(value) ? value : defaultValue)
export const stringOrThrow = (value, message) => {
    if (!(string(value))) {
        throw new Error(message ?? '')
    }
}

export const notEmpty = (value) => (string(value) && value.trim().length > 0)
export const notEmptyOrGet = (value, defaultValue) => (notEmpty(value) ? value : defaultValue)
export const notEmptyOrThrow = (value, message) => {
    if (!(notEmpty(value))) {
        throw new Error(message ?? '')
    }
}

export const match = (value, regexp) => (string(value) && regexp.test(value))
export const matchOrGet = (value, regexp, defaultValue) => (match(value, regexp) ? value : defaultValue)
export const matchOrThrow = (value, regexp, message) => {
    if (!(match(value, regexp))) {
        throw new Error(message ?? '')
    }
}

export const boolean = (value) => (['0', '1', 'true', 'false'].includes(String(value)))
export const booleanOrGet = (value, defaultValue) => (boolean(value) ? value : defaultValue)
export const booleanOrThrow = (value, message) => {
    if (!(boolean(value))) {
        throw new Error(message ?? '')
    }
}