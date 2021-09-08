const browser = require("webextension-polyfill")

/**
 * A class that acts as a in memory store.
 * The in memory store gets initialized with the data from local storage,
 * and every time the in memory store gets updated the local storage gets updated.
 */
export class Storage {

    constructor() {
        this.store = {}
    }

    /**
     * It initializes the local storage and the in memory store.
     * @return {Promise<void>} a promise that resolves to void
     */
    async initStore() {
        let data = await this.getDataFromLocalStorage()
        if (!data) {
            await browser.storage.local.set({data: {enc: ''}})
            data = await this.getDataFromLocalStorage()
        }
        if (data.enc) {
            const parsedData = JSON.parse(data.enc)
            this.store = {...parsedData}
        }
        return Promise.resolve()
    }

    /**
     * Returns the data from memory.
     * @return {Promise<unknown>} a promise that resolves to data from memory
     */
    getFromMemory() {
        return Promise.resolve(this.store)
    }

    /**
     * It commits the data object to the in memory store and to local storage.
     * @param data the data object
     * @return {Promise<unknown>} a promise that resolves to the result of the operation
     */
    commitData(data) {
        this.store = {...this.store, ...data}
        return this.setToLocalStorage(data)
    }

    /**
     * It returns the data from storage.
     * @return {Promise<unknown>} a promise that resolves to the result data from storage
     */
    getDataFromLocalStorage() {
        return new Promise(resolve => {
            browser.storage.local.get('data').then(result => {
                if (result && result.data) {
                    resolve(result.data)
                } else {
                    resolve(null)
                }
            }).catch(err => {
                console.error('error while fetching from storage', err)
                resolve(null)
            })
        }).catch(err => console.error(err))
    }

    /**
     * It publishes an object to local storage.
     * @param obj the object
     * @return <Promise<boolean> a promise that resolves to the result of the operation
     */
    setToLocalStorage(obj) {
        return new Promise(resolve => {
            const encStore = JSON.stringify(this.store)
            browser.storage.local.set({data: {enc: encStore}}).then(() => {
                resolve(true)
            }).catch(err => {
                console.error('error while committing to storage', err)
                resolve(false)
            })
        }).catch(err => console.error(err))
    }
}
