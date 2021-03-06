import {StoreHelper} from "../store/StoreHelper";
import {Store} from "../store/Store";
import {filterAccount} from "../../app/internal/utils";
const { v4: uuidv4 } = require('uuid')
const browser = require("webextension-polyfill")

export class BackgroundHandler {

    constructor() {
        this.transactionMapResponse = new Map()
        this.store = new Store()
        this.storeHelper = new StoreHelper(this.store)
        this.store.setToStore('transactions', {})
        this.width = 374
        this.height = 640
        this.top = 100
        this.left = screen.width - screen.width / 3
    }

    /**
     * It connects to the wallet and returns the current account.
     * @return {Promise<{Account}>} a promise that resolves to the current account
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
            return filterAccount(account)
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
            this.transactionMapResponse.set(transaction.uuid, {sendResponse: pendingCallbackResponse})
            const transactions = await this.store.getStore('transactions')
            transactions[transaction.uuid] = transaction

            await this.store.setToStore('transactions', transactions)
            await this.connect()
            await browser.windows.create({
                type: 'popup',
                url: browser.runtime.getURL("app/index.html#/transaction/" + transaction.uuid),
                width: this.width,
                height: this.height,
                focused: true,
                left: this.left,
                top: this.top
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

        if (this.transactionMapResponse.has(uuid)) {

            // send transaction response
            this.transactionMapResponse.get(uuid).sendResponse({
                error: transactionResult.error,
                status: transactionResult.status,
                storageValue: transactionResult.storageValue,
                transaction: transactionResult.transaction
            })

            // delete transaction
            this.transactionMapResponse.delete(uuid)
        }

        const transactions = await this.store.getStore('transactions')
        if (transactions && transactions.hasOwnProperty(uuid)) {
            delete transactions[uuid]
            await this.store.setToStore('transactions', transactions)
        }
    }
}