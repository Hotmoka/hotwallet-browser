import {StoreHelper} from "../store/StoreHelper";
const { v4: uuidv4 } = require('uuid')
const browser = require("webextension-polyfill")

export class BackgroundHandler {


    constructor(store) {
        /**
         * The transaction map of the wallet.
         */
        this.transactionMap = new Map()
        this.store = store
        this.storeHelper = new StoreHelper(this.store)
    }

    /**
     * It connects to the wallet and returns the current account.
     * @return {Promise<{address: string, name: string}>} a promise that resolves to the current account
     */
    async connect() {
        const account = await this.storeHelper.getCurrentAccount()
        if (!account) {
            throw new Error('No account found')
        }

        await this.store.localStorage.setData({transactions: {}})

        return {
            name: account.name,
            address: account.reference
        }
    }

    /**
     * It starts a wallet transaction.
     * @param transaction the transaction data
     * @param pendingCallbackResponse the pending callback response
     * @return {Promise<void>} a promise that resolves to void
     */
    async startTransaction(transaction, pendingCallbackResponse) {
        transaction.uuid = uuidv4()
        const transactions = await this.store.localStorage.getData('transactions')
        if (!transactions) {
            throw new Error('Cannot begin transaction')
        }
        transactions[transaction.uuid] = transaction
        this.transactionMap.set(transaction.uuid, {sendResponse: pendingCallbackResponse})
        await this.store.localStorage.setData({transactions: transactions})

        browser.windows.create({
            type: 'popup',
            width: 360,
            url: browser.runtime.getURL(
                "app/popup.html#/transaction:" + transaction.uuid
            )
        })
    }

    async endTransaction(transactionResult) {
        const uuid = transactionResult.uuid
        this.transactionMap.get(uuid).sendResponse({
            error: transactionResult.error,
            status: transactionResult.status,
            storageValue: transactionResult.storageValue
        })
        this.transactionMap.delete(uuid)

        const transactions = await this.store.localStorage.getData('transactions')
        if (transactions && transactions.hasOwnProperty(uuid)) {
            delete transactions[uuid]
        }
        await this.store.localStorage.setData({transactions: transactions})
    }
}