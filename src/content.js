const browser = require("webextension-polyfill")
const {Channel} = require('hotwallet-api')

let channel

/**
 * It initializes a communication channel between
 * the content script and the current web page.
 */
const initCommunicationChannel = () => {
    channel = new Channel('hotwallet-content-script', 'hotwallet-web-page', location.origin)
    channel.onData = data => {

        if (data.eventName === 'onHotwalletTransaction') {
            transactionHandler(data)
        } else if (data.eventName === 'onHotwalletConnect') {
            connectionHandler(data)
        }
    }
}

/**
 * It injects the HotwalletApi library into the current web page.
 */
const injectHotwalletApi = () => {
    const url = browser.runtime.getURL('globals.js');
    fetch(url)
        .then((response) => response.text())
        .then(text => {
            const script = document.createElement('script');
            script.textContent = text;
            (document.head||document.documentElement).appendChild(script);
            script.remove();
        })
}

/**
 * The handler of a wallet transaction.
 */
const transactionHandler = data => {
    const taskId = data.taskId

    browser.runtime.sendMessage({
        hotmoka: {
            type: 'transaction',
            transaction: data.transaction
        }
    }).then(result => {
        channel.sendMessage({
            eventName: 'onHotwalletTransactionResult',
            taskId: taskId,
            result: {...result}
        })
    })
}

/**
 * The handler of the connection towards Hotwallet.
 */
const connectionHandler = data => {
    const taskId = data.taskId

    browser.runtime.sendMessage({
        hotmoka: {
            type: 'connect'
        }
    }).then(result => {
        channel.sendMessage({
            eventName: 'onHotwalletConnected',
            taskId: taskId,
            result: {...result}
        })
    })
}


initCommunicationChannel()
injectHotwalletApi()

