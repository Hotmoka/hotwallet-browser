import {formatCoins, showInfoToast, storageReferenceToString, trimAddress} from "./utils";

export const coinFormatter = {
    methods: {
        formatCoins(coin) {
            return formatCoins(coin)
        }
    }
}

export const accountUtils = {
    methods: {
        toStringAccount(account) {
            return account && account.reference ? storageReferenceToString(account.reference) : ''
        },
        trimAccountAddress(addressReference) {
            return trimAddress(addressReference)
        },
        copyToClipboard(text) {
            if (text) {
                navigator.clipboard.writeText(text)
                    .then(() => showInfoToast(this, 'Info', 'Content copied to clipboard', 1600))
            }
        }
    }
}

export const validator = {
    methods: {
        stateFieldNotEmpty(field) {
            return field === null ? null : field.length > 0
        },
        stateEqualFields(field1, field2) {
            return field1 === null || field2 === null ? null : (field1.length > 0 && field1 === field2)
        },
        fieldNotEmptyFeedback(field, message) {
            if (field === null) {
                return null
            }
            return message ? message : 'Please enter value'
        }
    }
}