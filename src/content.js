const browser = require("webextension-polyfill")
const {Channel} = require('hotwallet-api')

/**
 * It initializes a communication channel between
 * the content script and the current web page.
 */
const channel = new Channel('hotwallet-content-script', 'hotwallet-web-page', location.origin)

/**
 * It listens to channel events and it dispatches the events to background.
 */
const listenToChannelEvents = () => {

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
    }).catch(err => {
        channel.sendMessage({
            eventName: data.eventName,
            taskId: data.taskId,
            result: {error: err.message ? err.message : 'Error while processing request'}
        })
    })
}

/**
 * It initializes a listener that listens to events from the background script.
 */
const listenToBackgroundScriptEvents = () => {

    const port = browser.runtime.connect({name:"content-script-port"});
    port.onMessage.addListener(message => {
        if (message && message.hotmoka && message.hotmoka.type === 'event' && message.hotmoka.eventName) {
            const eventName = message.hotmoka.eventName
            const data = message.hotmoka.data

            channel.sendMessage({
                type: 'event',
                eventName: eventName,
                result: data
            })
        }
    });
}

listenToChannelEvents()
injectHotwalletApi()
listenToBackgroundScriptEvents()
