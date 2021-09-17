const browser = require("webextension-polyfill")

/**
 * A class that wraps the calls to the browser's local storage.
 */
export class LocalStorage {

    /**
     * It returns the data from local storage.
     * @param key an optional key that if specified returns the data associated with that key
     * @return {Promise<unknown>} a promise that resolves to the result data from storage or null if data was not found
     */
    async getData(key) {
        try {
            const result = await browser.storage.local.get(key)
            if (key === null) {
                return result
            } else {
                return result && result[key] ? result[key] : null
            }
        } catch (err) {
            throw new Error(err.message ? err.message : 'Error while fetching from local storage')
        }
    }

    /**
     * It persists an object to local storage.
     * @param data the data object
     * @return <Promise<void> a promise that resolves to void or throws an error if data could not be persisted
     */
    async setData(data) {
        try {
            await browser.storage.local.set({...data})
        } catch (err) {
            throw new Error(err.message ? err.message : 'Error while publishing to local storage')
        }
    }
}