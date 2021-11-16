import {formatCoins, storageReferenceToString, trimAddress} from "./utils";

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
        }
    }
}