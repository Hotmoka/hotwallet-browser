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

        if (data.eventName === 'HotwalletTransaction') {
            dispatchToBackground({
                type: 'transaction',
                transaction: data.transaction
            }, data)

        } else if (data.eventName === 'HotwalletConnect') {
            dispatchToBackground({
                type: 'connect'
            }, data)
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
 * It dispatches messages to the background script.
 * @param message the message to be dispatched to the background script
 * @param data the event data
 */
const dispatchToBackground = (message, data) => {
    browser.runtime.sendMessage({
        hotmoka: message
    }).then(result => {
        channel.sendMessage({
            eventName: data.eventName,
            taskId: data.taskId,
            result: {...result}
        })
    })
}


initCommunicationChannel()
injectHotwalletApi()

