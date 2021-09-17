import {LocalStorage} from "./LocalStorage";
import {aesDecrypt, aesEncrypt} from "../utils";


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
     * It initializes the private store with the objects.
     * @param keys the keys of the objects
     * @return {Promise<unknown>} a promise that resolves to void
     */
    async initPrivateStore(keys) {

        if (!this.password) {
            throw new Error('A password must be provided using setPassword method')
        }

        if (!keys || !Array.isArray(keys)) {
            throw new Error('Keys not provided')
        }

        for (const key of keys) {
            const data = await this.localStorage.getData(key)
            if (data) {
                try {
                    const decryptedData = await aesDecrypt(data, this.password)
                    const parsedData = JSON.parse(decryptedData)
                    this.store[key] = parsedData
                } catch (e) {
                    throw new Error('Wrong password')
                }
            }
        }
    }

    /**
     * It loads the store from the local storage of the specified object keys.
     * @param publicStoreObjectKeys the array of public keys
     * @param privateStoreObjectKeys the array of private keys
     * @return {Promise<unknown>} a promise that resolves to void
     */
    async loadStore(publicStoreObjectKeys, privateStoreObjectKeys) {
        const data = await this.localStorage.getData(null)
        if (data) {
            if (publicStoreObjectKeys) {
                publicStoreObjectKeys.forEach(key => this.store[key] = data.hasOwnProperty(key) ? data[key] : null)
            }

            if (privateStoreObjectKeys) {
                privateStoreObjectKeys.forEach(key => this.store[key] = null)
            }
        }

        console.log('loaded store', this.store)
    }

    /**
     * It returns the store object.
     * @param key optional key that if specified it returns the store object associated with the key
     * @return {Promise<unknown>} a promise that resolves to the store object o undefined if the object does not exist
     */
    async getStore(key) {
        if (key) {
            return this.store[key]
        }
        return this.store
    }

    /**
     * It sets an object to the store.
     * @param key the key of the data
     * @param data the data object
     */
    setToStore(key, data) {
        this.store[key] = data
    }

    /**
     * It persists an object to the public store. The browser's local storage will get updated too.
     * @param key the key of the data
     * @param data the data object
     * @return {Promise<void>} a promise that resolves to void or throws an error if data could not be persisted
     */
    async persistToPublicStore(key, data) {
        this.store[key] = data
        await this.localStorage.setData({[key]: data})
    }

    /**
     * It persists an object to the private store. The browser's local storage will get updated too.
     * @param key the key of the data
     * @param data the data object
     * @return {Promise<void>} a promise that resolves to void or throws an error if data could not be persisted
     */
    async persistToPrivateStore(key, data) {
        try {
            this.store[key] = data
            const encryptedData = await aesEncrypt(JSON.stringify(this.store[key]), this.password)
            await this.localStorage.setData({[key]: encryptedData})
        } catch (err) {
            throw new Error(err.message ? err.message : 'Error while persisting to store')
        }
    }
}
