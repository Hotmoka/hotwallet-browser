/**
 * Default networks.
 */
export const networks = [
    { value: 'panarea', text: 'panarea.hotmoka.io', protocol: 'http', url: 'http://panarea.hotmoka.io', selected: true },
    { value: 'customNetwork', text: 'Connect to custom network' }
]

/**
 * Keys of the private objects of the store.
 */
export const privateStoreObjectKeys = ['accounts', 'connectedApps']

/**
 * Keys of the public objects of the store.
 */
export const publicStoreObjectKeys = ['networks', 'account']