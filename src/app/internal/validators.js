export const stateFieldNotEmpty = field => {
    return field === null ? null : field.length > 0
}

export const fieldNotEmptyFeedback = (field, message) => {
    if (field === null) {
        return null
    }
    return message ? message : 'Please enter value'
}
