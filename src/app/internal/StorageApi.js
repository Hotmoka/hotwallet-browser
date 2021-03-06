import {privateStoreObjectKeys} from "../../internal/constants";
import {sortNetworks} from "./utils";


/**
 * API to access the store of the Hotwallet.
 */
export class StorageApi {

    constructor(browser) {
        this.browser = browser
    }

    /**
     * It set the password of the private store.
     * @param password the password to encrypt/decrypt the data of local storage
     * @return {Promise<unknown>} a promise that resolves to void
     */
    setPassword(password) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-set-pwd',
                password: password
            }
        })
    }

    /**
     * It initializes the private store.
     * @return {Promise<unknown>} a promise that resolves to void
     */
    initPrivateStore() {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-init-private',
                keys: privateStoreObjectKeys
            }
        })
    }

    /**
     * It persists an object to the private store.
     * @param key the key of the object
     * @param data the data object
     * @return {Promise<boolean>} a promise that resolves to void
     */
    persistToPrivateStore(key, data) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-persist-private',
                data: data,
                key: key
            }
        })
    }

    /**
     * It persists an object to the public store.
     * @param key the key of the object
     * @param data the data object
     * @return {Promise<void>} a promise that resolves to void
     */
    persistToPublicStore(key, data) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-persist-public',
                data: data,
                key: key
            }
        })
    }

    /**
     * It returns the data from the store.
     * @param key an optional key that if specified returns the data associated with that key
     * @return {Promise<unknown>} a promise that resolves to the result data or undefined if data was not found
     */
    getStore(key) {
        return this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'store-get',
                key: key
            }
        })
    }

    // helpers

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
     * Checks if the given account name has been already registered.
     * @param name the name of the account to be checked
     * @return {Promise<void>} a promise that resolves to void
     * @throws {Error} if an account was already registered with the given name
     */
    async checkIfAccountRegistered(name) {
        const accounts = await this.getAccounts()
        for (const acc of accounts) {
            if (acc.name === name) {
                throw new Error('Account name already registered')
            }
        }
    }

    /**
     * It adds an account to the list of accounts.
     * @param account the account object
     * @return {Promise<void>} a promise that resolves to void
     */
    async addAccount(account) {
        const accounts = await this.getAccounts()
        for (const acc of accounts) {
            acc.selected = false
            acc.logged = false
        }
        accounts.push(account)

        await this.persistToPrivateStore('accounts', accounts)
        await this.persistToPublicStore('account', {
            name: account.name,
            publicKey: account.publicKey
        })
    }

    /**
     * It removes an account from the list of accounts.
     * @param account the account
     * @return {Promise<void>} a promise that resolves to void
     */
    async removeAccount(account) {
        const accounts = await this.getAccounts()
        const accountsToPersist = accounts.filter(acc => acc.publicKey !== account.publicKey)
        await this.persistToPrivateStore('accounts', accountsToPersist)
    }

    /**
     * It updates an account.
     * @param account the account
     * @return {Promise<void>} a promise that resolves to void
     */
    async updateAccount(account) {
        const accounts = await this.getAccounts()
        const tempAccounts = accounts.filter(acc => acc.publicKey !== account.publicKey)
        for (const acc of tempAccounts) {
            if (acc.name === account.name) {
                throw new Error('Account name already registered')
            }
        }
        tempAccounts.push(account)
        await this.persistToPrivateStore('accounts', tempAccounts)
        await this.persistToPublicStore('account', {
            name: account.name,
            publicKey: account.publicKey
        })
    }

    /**
     * Returns the current selected account object of a network.
     * @param network the current network
     * @return {Promise<unknown>} a promise that resolves to the current account object or throws an err if data was not found
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
     * It sets the authentication state of an account to logged or not logged.
     * @param account the account object
     * @param logged the authentication state of the account, true if logged, false if not logged
     * @return {Promise<void>} a promise that resolves to void
     */
    async setAccountAuth(account, logged) {
        const accounts = await this.getAccounts()
        accounts.forEach(acc => {
            if (acc.publicKey === account.publicKey) {
                acc.logged = logged
                acc.selected = true
            } else {
                acc.logged = false
                acc.selected = false
            }
        })

        await this.persistToPrivateStore('accounts', accounts)
    }

    /**
     * Sets the current network as the selected network.
     * @param network the network object
     * @return {Promise<void>} a promise that resolves to void
     */
    async selectNetwork(network) {
        const networks = await this.getNetworks()
        networks.forEach(network_ => network_.selected = network_.value === network.value)
        await this.persistToPublicStore('networks', networks)
    }

    /**
     * It adds a network to the list of networks if not already added
     * @param network the network object
     * @return {Promise<void>} a promise that resolves to void
     */
    async addNetwork(network) {
        const networks = await this.getNetworks()
        for (const _network of networks) {
            if (_network.value === network.value) {
               return
            }
        }
        networks.push(network)
        await this.persistToPublicStore('networks', networks)
    }

    /**
     * Returns a sorted array of the networks.
     * @return {Promise<[unknown]>} a promise that resolves to array of networks
     */
    async getNetworks() {
        const storedNetworks = await this.getStore('networks')
        if (storedNetworks && Array.isArray(storedNetworks) && storedNetworks.length > 0) {
            return sortNetworks(storedNetworks)
        } else {
            throw new Error('No network available')
        }
    }

    /**
     * Returns the current selected network.
     * @return {Promise<unknown>} a promise that resolves to selected network or to null
     */
    async getCurrentNetwork() {
        const networks = await this.getNetworks()
        const selectedNetworks = networks.filter(network => network.selected)
        const network = selectedNetworks.length > 0 ? selectedNetworks[0] : null
        if (network) {
            return network
        } else {
            throw new Error('No network selected')
        }
    }

    /**
     * Returns the authentication object.
     * @return {Promise<{authenticated: boolean, hasAccount: boolean}>} a promise that resolves to an authentication object
     */
    async getAuthentication() {
        try {
            const result = {
                authenticated: false,
                hasAccount: false
            }

            const store = await this.getStore()
            if (store && store.account) {
                result.hasAccount = true
                if (store.accounts) {
                    store.accounts.forEach(account => {
                        if (account.logged) {
                            result.authenticated = true
                        }
                    })
                }
            }

            return result
        } catch (e) {
            return {
                authenticated: false,
                hasAccount: false
            }
        }
    }
}