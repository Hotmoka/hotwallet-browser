import {networks} from "./networks";


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
     * It reinitializes the local storage and the in memory storage.
     * @return {Promise<unknown>} a promise that resolves to void
     */
    reinitStore() {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-reinit'
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
     * @return {Promise<unknown>} a promise that resolves to the result data or undefined if data was not found
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
     * @return {Promise<unknown>} a promise that resolves to the result data from storage or null if data was not found
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
     * Returns the array of accounts.
     * @return {Promise<unknown>} a promise that resolves to the array of accounts
     */
    async getAccounts() {
        const accounts = await this.getStore('accounts')
        if (accounts && Array.isArray(accounts)) {
            return accounts
        }
        return []
    }

    /**
     * It adds an account the list of accounts.
     * @param account the account object
     * @return {Promise<boolean>} a promise that resolves the operation result
     */
    async addAccount(account) {
        const accounts = await this.getAccounts()

        // mark the accounts as unselected and not logged
        accounts.forEach(account => {
            account.selected = false
            account.logged = false
        })
        accounts.push(account)

        const committed = await this.setToStore({accounts: accounts})
        return committed
    }

    /**
     * Returns the current select account object of a network.
     * @param network the current network
     * @return {Promise<unknown>} a promise that resolves to the current account object or undefined if data was not found
     */
    async getCurrentAccount(network) {
        const accounts = await this.getAccounts()
        for (const account of accounts) {
            if (account.network.value === network.value && account.selected) {
                return account
            }
        }

        // no account found
        throw new Error('No account found for this network')
    }

    /**
     * It marks an account as logged.
     * @param account the account object
     * @return {Promise<boolean>} a promise that resolves the operation result
     */
    async loginAccount(account) {
        const accounts = await this.getAccounts()
        accounts.forEach(account=> {
            if (account.publicKey === account.publicKey) {
                account.logged = true
            }
        })

        const committed = await this.setToStore({accounts: accounts})
        return committed
    }

    /**
     * Sets the current selected network object.
     * @param network the network object
     * @return {Promise<boolean>} a promise that resolves the operation result
     */
    setCurrentNetwork(network) {
        return this.setToLocalStorage({network: network})
    }

    /**
     * It adds a network the list of networks.
     * @param network the network object
     * @return {Promise<boolean>} a promise that resolves the operation result
     */
    async addNetwork(network) {
        const networks = await this.getNetworks()
        for (const _network of networks) {
            if (_network.value === network.value) {
                throw new Error('Network already registered')
            }
        }
        networks.push(network)
        return this.setToLocalStorage({networks: networks})
    }

    /**
     * Returns the current selected network object.
     * @param defaultNetwork if specified and no network was found, it will set this object as the current network
     * @return {Promise<unknown>} a promise that resolves to the selected network object
     */
    async getCurrentNetwork(defaultNetwork) {
        const network = await this.getLocalStorage('network')

        if (network) {
            return network
        } else if (!defaultNetwork) {
            throw new Error('No network found and default network not specified')
        } else {
            const committed = await this.setCurrentNetwork(defaultNetwork)
            if (!committed) {
                throw new Error('Cannot set default network')
            }
            return defaultNetwork
        }
     }

    /**
     * Returns the array of networks.
     * @return {Promise<unknown>} a promise that resolves to array of networks
     */
    async getNetworks() {
        const storedNetworks = await this.getLocalStorage('networks')

        if (storedNetworks && Array.isArray(storedNetworks) && storedNetworks.length > 0) {
            return storedNetworks
        } else {
            await this.setToLocalStorage({networks: networks})
            return networks
        }
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
                    if (store.accounts) {
                        store.accounts.forEach(account => {
                            if (account.logged) {
                                result.authenticated = true
                            }
                        })
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