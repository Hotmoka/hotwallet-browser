/**
 * Class to send events to Hotwallet.
 */
export class EventsApi {

    constructor(browser) {
        this.browser = browser
    }

    emit(eventName, data) {
        this.browser.runtime.sendMessage({
            hotmoka: {
                type: 'event',
                eventName: eventName,
                data: data
            }
        })
    }
}

export const CONNECTED = 'onConnected'
export const DISCONNECTED = 'onDisconnected'
export const NETWORK_CHANGED = 'onNetworkChanged'
export const ACCOUNT_CHANGED = 'onAccountChanged'