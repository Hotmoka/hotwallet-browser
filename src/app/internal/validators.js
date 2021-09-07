export const statePassword = (password) => {
    return password === null ? null : password.length >= 8
}

export const invalidPasswordFeedback = (password) => {
    if (password === null) {
        return null
    }

    if (password.length > 0) {
        return 'Please enter at least 8 characters'
    }

    return 'Please enter a password'
}

export const stateFieldNotEmpty = field => {
    return field === null ? null : field.length > 0
}

export const fieldNotEmptyFeedback = (field, message) => {
    if (field === null) {
        return null
    }
    return message ? message : 'Please enter value'
}
