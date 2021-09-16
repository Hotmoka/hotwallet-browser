import {LocalStorage} from "./LocalStorage";
import {aesDecrypt, aesEncrypt} from "./utils";

/**
 * A class that acts as an in memory store.
 * The store gets initialized with the data from the browser's local storage,
 * and every time the store gets updated the browser's local storage gets updated.
 * Data stored in local storage will be encrypted with the user's password and
 * it will be decrypted when initializing the store.
 */
export class Store {

    constructor() {
        this.store = {}
        this.localStorage = new LocalStorage()
    }

    /**
     * It marks the store as checked. Useful in order to identify
     * if this store has some stored data.
     * @return {Promise<void>} a promise that resolves to void
     */
    async checkStore() {
        const data = await this.localStorage.getData('data')
        if (data) {
            this.store.checked = true
        }
    }

    /**
     * It sets a password for this store.
     * @param password the password to encrypt/decrypt the data of local storage
     * @return {Promise<unknown>} a promise that resolves to void
     */
    async setPassword(password) {

        if (!password) {
            throw new Error('A password must be provided')
        }

        if (typeof password !== 'string') {
            throw new Error('The password must be a string')
        }

        this.password = password
    }

    /**
     * It initializes the store.
     * @return {Promise<unknown>} a promise that resolves to void
     */
    async initStore() {

        if (!this.password) {
            throw new Error('A password must be provided using setPassword method')
        }

        const data = await this.localStorage.getData('data')
        if (data && data.enc) {
            try {
                const decryptedData = await aesDecrypt(data.enc, this.password)
                const parsedData = JSON.parse(decryptedData)
                this.store = {...parsedData, checked: true}
            } catch (e) {
                throw new Error('Wrong password')
            }
        }
    }


    /**
     * It returns the store.
     * @return {Promise<unknown>} a promise that resolves the store object
     */
    async getStore() {
        return this.store
    }

    /**
     * It publishes an object to the store. The browser's local storage will get updated too.
     * @param data the data object
     * @return {Promise<void>} a promise that resolves to void or throws an error if data could not be saved
     */
    async setToStore(data) {
        try {
            this.store = {...this.store, ...data}
            const encryptedData = await aesEncrypt(JSON.stringify(this.store), this.password)
            await this.localStorage.setData({data: {enc: encryptedData}})
        } catch (err) {
            throw new Error(err.message ? err.message : 'Error while publishing to store')
        }
    }
}
