/**
 * Helper class for the store.
 */
export class StoreHelper {

    constructor(store) {
        this.store = store
    }

    /**
     * It persists the networks to public storage, if not persisted yet.
     * @param networks the networks
     * @return {Promise<void>} a promise that resolves to void
     */
    async initNetworks(networks) {
        const storedNetworks = await this.store.getStore('networks')
        if (!storedNetworks) {
            await this.store.persistToPublicStore('networks', networks)
        }
    }

    /**
     * Returns the current selected account.
     * @return {Promise<unknown>} a promise that resolves to the current account or throws an error if there is no account selected
     */
    async getCurrentAccount() {
        const accounts = await this.getAccounts()
        for (const account of accounts) {
            if (account.selected) {
                return account
            }
        }

        // no account found
        throw new Error('No account found for this network')
    }

    /**
     * Returns the array of accounts.
     * @return {Promise<[unknown]>} a promise that resolves to the array of accounts
     */
    async getAccounts() {
        const store = await this.store.getStore()
        if (store && store.accounts && Array.isArray(store.accounts)) {
            return store.accounts
        }
        return []
    }

}