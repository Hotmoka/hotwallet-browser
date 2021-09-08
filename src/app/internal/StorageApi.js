/**
 * API to access the storage of the Hotwallet extension.
 */
export class StorageApi {

    constructor(browser) {
        this.browser = browser
    }

    /**
     * Sets the data to storage.
     * @param data the data
     * @return {Promise<boolean>} a promise that resolves to the result of the operation
     */
    setToStorage(data) {
        return new Promise(resolve => {
            this.browser.runtime.sendMessage({
                hotmoka: {
                    type: 'storage-set',
                    data: data
                }
            }).then(committed => {
                resolve(committed)
            }).catch(() => resolve(false))
        }).catch(() => {})
    }

    /**
     * It returns the data from storage.
     * @param key an optional key that if specified returns the data associated with that key
     * @return {Promise<unknown>} a promise that resolves to the result data from storage
     */
    getStorage(key) {
        return new Promise(resolve => {
            this.browser.runtime.sendMessage({
                hotmoka: {
                    type: 'storage-get'
                }
            }).then(result => {
                if (key) {
                    resolve(result[key])
                } else {
                    resolve(result)
                }
            }).catch(() => resolve(null))
        }).catch(() => {})
    }

    /**
     * Returns the current account object.
     * @return {Promise<unknown>} a promise that resolves to the current account object
     */
    getCurrentAccount() {
        return this.getStorage('account')
    }

    /**
     * Returns the network object.
     * @return {Promise<unknown>} a promise that resolves to the network object
     */
    getNetwork() {
        return this.getStorage('network')
    }

    /**
     * Returns the authentication object.
     * @return {Promise<unknown>} a promise that resolves to an authentication object
     */
    getAuthentication() {
        return new Promise(resolve => {
            this.getCurrentAccount().then(account => {
                const result = {
                    authenticated: false,
                    hasAccount: false
                }
                if (account) {
                    result.hasAccount = true
                    result.authenticated = account.logged
                }
                resolve(result)
            })
        }).catch(err => console.error(err))
    }
}