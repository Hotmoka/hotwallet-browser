import Vue from "vue";
import {EventBus, getNetworkByValue, showErrorToast, WrapPromiseTask} from "./utils";
import {AccountHelper, Bip39Dictionary, RemoteNode} from "hotweb3";
import {ACCOUNT_CHANGED, CONNECTED, DISCONNECTED, NETWORK_CHANGED} from "./EventsApi";
import {replaceRoute} from "./router";


/**
 * Service class that wraps common tasks.
 */
export class Service extends Vue {

    /**
     * It performs a login to Hotwallet.
     * @param password the password
     * @return {Promise<void>} a promise that resolves to void
     */
    login(password) {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async () => {

                // set password and init store
                await this.$storageApi.setPassword(password)
                await this.$storageApi.initPrivateStore()
                const account = await this.$storageApi.getCurrentAccount(this.$network.get())

                // verify public key
                const publicKeyVerified = AccountHelper.verifyPublicKey(
                    password,
                    account.entropy,
                    Bip39Dictionary.ENGLISH,
                    account.publicKey
                )

                if (publicKeyVerified) {
                    await this.$storageApi.setAccountAuth(account, true)
                } else {
                    throw new Error('Wrong password')
                }

            }).then(() => {
                resolve()
                this.$eventsApi.emit(CONNECTED)
            }).catch(error => {
                showErrorToast(this, 'Login', error.message || 'Error during login')
                reject()
            })
        })
    }

    /**
     * It performs a logout from Hotwallet.
     * @param account the current account
     * @return {Promise<void>} a promise that resolves to void
     */
    logout(account) {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async () => {
                await this.$storageApi.setAccountAuth(account, false)
                this.$eventsApi.emit(DISCONNECTED)
            }).then(() => resolve())
              .catch(() => {
                    showErrorToast(this, 'Account', 'Unable to logout')
                    reject()
              })
        })
    }

    /**
     * Returns the current public selected account.
     * @return {Promise<{name, publicKey}>} a promise that resolves to an account object
     */
    getCurrentPublicAccount() {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async () => {
                const account = await this.$storageApi.getStore('account')
                if (!account) {
                    throw new Error('Cannot retrieve account')
                }
                return account
            }).then(account => resolve(account))
              .catch(error => {
                  showErrorToast(this, 'Account', error.message || 'Cannot retrieve account')
                  reject()
              })
        })
    }

    /**
     * Returns the current logged account.
     * @return {Promise<{Object}>} a promise that resolves to an account object
     */
    getCurrentAccount() {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(() => this.$storageApi.getCurrentAccount(this.$network.get()))
                .then(account => resolve(account))
                .catch(error => {
                    showErrorToast(this, 'Account', error.message || 'Cannot retrieve account')
                    reject()
                })
        })
    }

    /**
     * It changes the current network to a new network.
     * @param selectedNetwork the new network
     * @param networks the networks
     * @return {Promise<unknown>} a promises that resolves to the new network
     */
    changeNetwork(selectedNetwork, networks) {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async () => {
                const network = getNetworkByValue(selectedNetwork, networks)
                if (!network) {
                    throw new Error('Network not found')
                }

                await this.$storageApi.selectNetwork(network)
                const accountsForNetwork = await this.$storageApi.getAccountsForNetwork(network)

                if (accountsForNetwork.length === 0) {
                    return {network, newAccount: true}
                } else {
                    await this.$storageApi.setAccountAuth(accountsForNetwork[0], true)
                    return {network, newAccount: false}
                }
            }).then(result => {
                resolve(result)
                this.$eventsApi.emit(NETWORK_CHANGED, result.network)
            }).catch(e => {
                showErrorToast(this, 'Network', e.message || 'Cannot set network')
                reject()
            })
        })
    }

    /**
     * It connects to a new network.
     * @param url the url of the network
     * @param name the name of the network
     * @return {Promise<unknown>} a promise that resolves to the network object
     */
    connectToNetwork(url, name) {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async () => {
                const splittedUrl = url.split("://")
                const networkName = name && name.length > 0 ? name : null

                const network = {
                    url: url,
                    protocol: splittedUrl[0],
                    text: networkName ? networkName : splittedUrl[1],
                    value: networkName ? networkName + '_' + splittedUrl[1] : splittedUrl[1],
                    selected: true
                }

                const validNetwork = await this.testNetwork(network)
                if (!validNetwork) {
                    throw new Error('Cannot connect to network')
                }

                // add and set network as selected
                await this.$storageApi.addNetwork(network)
                await this.$storageApi.selectNetwork(network)
                await this.$storageApi.logoutAllAccounts()

                return network
            }).then(network => {
                resolve(network)
                this.$eventsApi.emit(NETWORK_CHANGED, network)
            }).catch(error => {
                reject(error)
            })
        })
    }

    /**
     * Helper method to test if a network is a valid network.
     * @param network the network to test
     * @return {Promise<boolean>} a promise that resolves to true if the network is valid, false otherwise
     */
    async testNetwork(network) {
        try {
            const takamakaCode = await new RemoteNode(network.url).getTakamakaCode()
            return takamakaCode && takamakaCode.hash
        } catch (e) {
            return false
        }
    }

    /**
     * It switches to a new account.
     * @param account the new account
     * @param password the password of the new account
     * @return {Promise<void>} a promise that resolves to void
     */
    switchToAccount(account, password) {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async () => {

                // set new password
                await this.$storageApi.setPassword(password)
                await this.$storageApi.setAccountAuth(account, true)
                await this.$storageApi.selectNetwork(account.network)
                const currentNetwork = await this.$storageApi.getCurrentNetwork()
                this.$network.set(currentNetwork)

                // notify network change
                EventBus.$emit('networkChange', currentNetwork)

            }).then(() => {
                resolve()
                console.log(account)
                this.$eventsApi.emit(ACCOUNT_CHANGED, account)
            }).catch(err => {
                showErrorToast(this, 'Accounts', err.message || 'Cannot switch to the selected account')
                reject()
            })
        })
    }
}