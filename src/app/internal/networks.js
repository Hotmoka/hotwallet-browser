export const networks = [
    { value: 'panarea', text: 'panarea.hotmoka.io', protocol: 'http', url: 'http://panarea.hotmoka.io' },
    { value: 'customNetwork', text: 'Connect to custom network' }
]

export const getNetwork = (value, networks) => {
    if (!networks) {
        return null
    }

    const _networks = networks.filter(network => network.value === value)
    if (_networks.length > 0) {
        return _networks[0]
    } else {
        return null
    }
}