/**
 * API to access the storage of the Hotwallet extension.
 */
export class StorageApi {

    constructor(browser) {
        this.browser = browser
    }

    /**
     * It initializes the local storage and the in memory storage.
     * @param password the password to encrypt/decrypt the data of local storage
     * @return {Promise<unknown>} a promise that resolves to void
     */
    initStore(password) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-init',
                password: password
            }
        })
    }

    /**
     * It publishes an object to the in memory store.
     * @param data the data object
     * @return {Promise<boolean>} a promise that resolves to the result of the operation
     */
    setToStore(data) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-set',
                data: data
            }
        })
    }

    /**
     * It returns the data from the in memory store.
     * @param key an optional key that if specified returns the data associated with that key
     * @return {Promise<unknown>} a promise that resolves to the result data
     */
    getStore(key) {
        return new Promise((resolve, reject) => {
            this.browser.runtime.sendMessage({
                hotmoka: {
                    type: 'store-get'
                }
            }).then(result => {
                resolve(key && result[key] ? result[key] : result)
            }).catch(err => reject(err))
        })
    }

    /**
     * It publishes an object to the browser's local storage.
     * @param data the data object
     * @return {Promise<boolean>} a promise that resolves to the result of the operation
     */
    setToLocalStorage(data) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'storage-local-set',
                data: data
            }
        })
    }

    /**
     * It returns the data from the browser's local storage.
     * @param key an optional key that if specified returns the data associated with that key
     * @return {Promise<unknown>} a promise that resolves to the result data from storage
     */
    getLocalStorage(key) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'storage-local-get',
                key: key
            }
        })
    }

    /**
     * Returns the current account object.
     * @return {Promise<unknown>} a promise that resolves to the current account object
     */
    getCurrentAccount() {
        return this.getStore('account')
    }

    /**
     * Sets the selected network object.
     * @param network the network object
     * @return {Promise<boolean>} a promise that resolves the operation result
     */
    setNetwork(network) {
        return this.setToLocalStorage({network: network})
    }

    /**
     * Returns the selected network object.
     * @param defaultNetwork if specified and no network was found, it will set this object as the current network
     * @return {Promise<unknown>} a promise that resolves to the selected network object
     */
    async getNetwork(defaultNetwork) {
        const network = await this.getLocalStorage('network')

        if (network) {
            return network
        } else if (!defaultNetwork) {
            throw new Error('No network found and default network not specified')
        } else {
            const committed = await this.setNetwork(defaultNetwork)
            if (!committed) {
                throw new Error('Cannot set default network')
            }
            return defaultNetwork
        }
     }

    /**
     * Returns the networks.
     * @return {Promise<unknown>} a promise that resolves to the array of networks
     */
    getNetworks() {
        return this.getLocalStorage('networks')
    }

    /**
     * Returns the authentication object.
     * @return {Promise<unknown>} a promise that resolves to an authentication object
     */
    getAuthentication() {
        return new Promise(resolve => {
            this.getStore().then(store => {

                const result = {
                    authenticated: false,
                    hasAccount: false
                }

                if (store && store.checked) {
                    result.hasAccount = true
                    if (store.account) {
                        result.authenticated = store.account.logged
                    }
                }

                resolve(result)
            }).catch(() => resolve({
                authenticated: false,
                hasAccount: false
            }))
        }).catch(() => {})
    }
}