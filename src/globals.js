const {HotwalletApi, Channel} = require('hotwallet-api')

/**
 * It injects the HotwalletApi libary into the current web page.
 */
window.hotwalletApi = new HotwalletApi(new Channel('hotwallet-web-page', 'hotwallet-content-script', location.origin))
