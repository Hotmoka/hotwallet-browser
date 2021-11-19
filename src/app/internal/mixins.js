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