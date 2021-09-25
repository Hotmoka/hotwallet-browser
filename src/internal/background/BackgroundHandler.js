import {StoreHelper} from "../store/StoreHelper";
import {Store} from "../store/Store";
const { v4: uuidv4 } = require('uuid')
const browser = require("webextension-polyfill")

export class BackgroundHandler {

    constructor() {
        this.transactionMapResponse = new Map()
        this.store = new Store()
        this.storeHelper = new StoreHelper(this.store)
        this.store.setToStore('transactions', {})
    }

    /**
     * It connects to the wallet and returns the current account.
     * @return {Promise<{address: string, name: string}>} a promise that resolves to the current account
     */
    async connect() {
        const isStoreInitialized = this.store.isInitialized()
        if (!isStoreInitialized) {
            throw new Error('Please login to Hotwallet')
        }

        const account = await this.storeHelper.getCurrentAccount()
        if (!account) {
            throw new Error('No account registered to Hotwallet')
        } else if (!account.reference) {
            throw new Error('Hotwallet cannot start transactions without a full account. The current account is only a key')
        } else if (!account.logged) {
            throw new Error('Please login to Hotwallet')
        } else {
            return {
                name: account.name,
                address: account.reference
            }
        }
    }

    /**
     * It starts a wallet transaction for a client.
     * @param transaction the transaction data
     * @param pendingCallbackResponse the pending callback response
     * @return {Promise<void>} a promise that resolves to void
     */
    async startTransaction(transaction, pendingCallbackResponse) {
        transaction.uuid = uuidv4()

        try {
            const transactions = await this.store.getStore('transactions')
            transactions[transaction.uuid] = transaction
            this.transactionMapResponse.set(transaction.uuid, {sendResponse: pendingCallbackResponse})

            await this.store.setToStore('transactions', transactions)
            await this.connect()
            await browser.windows.create({
                type: 'popup',
                url: browser.runtime.getURL("app/popup.html#/transaction/" + transaction.uuid),
                width: 371,
                height: 640
            })
        } catch (e) {
            await this.endTransaction({
                uuid: transaction.uuid,
                status: false,
                error: e.message ? e.message : 'Cannot begin transaction'
            })
        }
    }

    /**
     * It ends the wallet transaction. It sends the transaction result to the client.
     * @param transactionResult the transaction result
     * @return {Promise<void>} a promise that resolves to void
     */
    async endTransaction(transactionResult) {
        const uuid = transactionResult.uuid

        // send transaction response
        this.transactionMapResponse.get(uuid).sendResponse({
            error: transactionResult.error,
            status: transactionResult.status,
            storageValue: transactionResult.storageValue
        })

        // delete transaction
        this.transactionMapResponse.delete(uuid)
        const transactions = await this.store.getStore('transactions')
        if (transactions && transactions.hasOwnProperty(uuid)) {
            delete transactions[uuid]
            await this.store.setToStore('transactions', transactions)
        }
    }
}