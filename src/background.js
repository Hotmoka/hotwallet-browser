const browser = require("webextension-polyfill")
const {BackgroundHandler} = require("./internal/background/BackgroundHandler");
const {publicStoreObjectKeys, privateStoreObjectKeys, networks} = require("./internal/constants");

(async() => {
    const backgroundHandler = new BackgroundHandler()

    /**
     * The runtime message listener of the browser which
     * listens to messages from the content script or the Hotwallet app itself.
     */
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {

        if (message && message.hotmoka) {

            if (message.hotmoka.type === 'connect') {
                return backgroundHandler.connect()
            } else if (message.hotmoka.type === 'transaction') {
                backgroundHandler.startTransaction(message.hotmoka.transaction, sendResponse)
            } else if (message.hotmoka.type === 'transactionResult') {
                backgroundHandler.endTransaction(message.hotmoka.transactionResult)

            } else if (message.hotmoka.type === 'store-init-private') {
                return backgroundHandler.store.initPrivateStore(message.hotmoka.keys)
            } else if (message.hotmoka.type === 'store-persist-private') {
                return backgroundHandler.store.persistToPrivateStore(message.hotmoka.key, message.hotmoka.data)
            } else if (message.hotmoka.type === 'store-persist-public') {
                return backgroundHandler.store.persistToPublicStore(message.hotmoka.key, message.hotmoka.data)
            } else if (message.hotmoka.type === 'store-get') {
                return backgroundHandler.store.getStore(message.hotmoka.key)
            } else if (message.hotmoka.type === 'store-set-pwd') {
                return backgroundHandler.store.setPassword(message.hotmoka.password)
            }

            // async
            return true
        }
    })

    await backgroundHandler.store.loadStore(publicStoreObjectKeys, privateStoreObjectKeys)
    await backgroundHandler.storeHelper.initNetworks(networks)
})()