const browser = require("webextension-polyfill")
const { v4: uuidv4 } = require('uuid')
const {Store} = require('./internal/Store')

const storage = new Store()
storage.checkStore()

/**
 * The connection handler for Hotwallet.
 * @param sendResponse the function to be invoked with the results
 */
const connectionHandler = (sendResponse) => {
    browser.storage.local.get('account').then(result => {

        if (result && result.account) {
            browser.storage.local.get('transactionMap').then(result => {
                if (!result || !result.transactionMap) {
                    browser.storage.local.set({transactionMap: {}})
                }
            })

            sendResponse({
                account: {
                    name: result.account.name,
                    address: result.account.address,
                    balance: result.account.balance
                }
            })
        } else {
            sendResponse({
                error: "Please create an account using Hotwallet"
            })
        }
    }).catch(() => {
        sendResponse({
            error: "Please create an account using Hotwallet"
        })
    })
}

/**
 * The transaction handler.
 * @param message the message of the transaction
 */
const transactionHandler = (message, sendResponse) => {

    browser.storage.local.get('transactionMap').then(result => {
        if (result && result.transactionMap) {
            result.transactionMap[message.hotmoka.transaction.uuid] = message.hotmoka.transaction

            browser.storage.local.set({...result}).then(() => {
                browser.windows.create({
                    type: 'popup',
                    width: 360,
                    url: browser.runtime.getURL(
                        "app/popup.html#/transaction:" + message.hotmoka.transaction.uuid
                    )
                })
            })
        } else {
            sendResponse({
                error: "cannot begin transaction"
            })
        }
    })
}

/**
 * Removes from storage the transaction identified by the given uuid.
 * @param uuid the uuid of the transaction
 */
const removeTransaction = (uuid) => {
    browser.storage.local.get('transactionMap').then(result => {
        if (result && result.transactionMap && result.transactionMap.hasOwnProperty(uuid)) {
            delete result.transactionMap[uuid]
            browser.storage.local.set({...result})
        }
    })
}

/**
 * The transaction map of Hotwallet.
 */
const transactionMap = new Map()

/**
 * The runtime message listener of the browser which
 * listens to messages from the content script or the Hotwallet app itself.
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

    if (message && message.hotmoka) {

        if (message.hotmoka.type === 'connect') {
            connectionHandler(sendResponse)

        } else if (message.hotmoka.type === 'transaction') {
            const uuid = uuidv4()
            message.hotmoka.transaction.uuid = uuid
            transactionMap.set(uuid, {sendResponse: sendResponse})
            transactionHandler(message, sendResponse)

        } else if (message.hotmoka.type === 'transactionResult') {
            const uuid = message.hotmoka.transactionResult.uuid
            transactionMap.get(uuid).sendResponse({
                error: message.hotmoka.transactionResult.error,
                status: message.hotmoka.transactionResult.status,
                storageValue: message.hotmoka.transactionResult.storageValue
            })
            transactionMap.delete(uuid)
            removeTransaction(uuid)
        } else if (message.hotmoka.type === 'store-set') {
            return storage.setToStore(message.hotmoka.data)
        } else if (message.hotmoka.type === 'store-get') {
            return storage.getStore()
        } else if (message.hotmoka.type === 'store-init') {
            return storage.initStore(message.hotmoka.password)
        } else if (message.hotmoka.type === 'storage-local-set') {
            return storage.localStorage.setData(message.hotmoka.data)
        } else if (message.hotmoka.type === 'storage-local-get') {
            return storage.localStorage.getData(message.hotmoka.key)
        }

        // async
        return true
    }
})
