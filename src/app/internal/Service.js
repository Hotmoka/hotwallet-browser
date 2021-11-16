import Vue from "vue";
import {
    EventBus,
    filterAccount,
    filterNetwork,
    getNetworkByValue,
    showErrorToast,
    storageReferenceFrom,
    WrapPromiseTask
} from "./utils";
import {
    AccountHelper,
    Algorithm,
    Bip39Dictionary, InstanceMethodCallTransactionRequestModel,
    NonVoidMethodSignatureModel,
    RemoteNode,
    Signer,
    VoidMethodSignatureModel
} from "hotweb3";
import {ACCOUNT_CHANGED, CONNECTED, DISCONNECTED, NETWORK_CHANGED} from "./EventsApi";

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

                return account
            }).then(account => {
                resolve()
                this.$eventsApi.emit(CONNECTED, filterAccount(account))
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
     * It changes the current network with a new network.
     * If the network holds an account, the current account will be changed with the first account of the network.
     * @param network the new network
     * @param networks the networks
     * @return {Promise<unknown>} a promises that resolves to the new network
     */
    changeNetwork(network, networks) {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async () => {
                const network = getNetworkByValue(network, networks)
                if (!network) {
                    throw new Error('Network not found')
                }

                await this.$storageApi.selectNetwork(network)
                const accountsForNetwork = await this.$storageApi.getAccountsForNetwork(network)

                if (accountsForNetwork.length === 0) {
                    return {network, newAccount: true}
                } else {
                    await this.$storageApi.setAccountAuth(accountsForNetwork[0], true)
                    return {network, newAccount: false, account: accountsForNetwork[0]}
                }
            }).then(result => {
                resolve(result)
                this.$eventsApi.emit(NETWORK_CHANGED, filterNetwork(result.network))
                this.$eventsApi.emit(ACCOUNT_CHANGED, result.newAccount ? null : result.account)
            }).catch(e => {
                showErrorToast(this, 'Network', e.message || 'Cannot set network')
                reject()
            })
        })
    }

    /**
     * It connects to a new network and logs out from the current account.
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
                this.$eventsApi.emit(NETWORK_CHANGED, filterNetwork(network))
                this.$eventsApi.emit(ACCOUNT_CHANGED, null)
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
                this.$eventsApi.emit(ACCOUNT_CHANGED, filterAccount(account))
                this.$eventsApi.emit(NETWORK_CHANGED, filterNetwork(account.network))
            }).catch(err => {
                showErrorToast(this, 'Accounts', err.message || 'Cannot switch to the selected account')
                reject()
            })
        })
    }

    /**
     * It returns the transaction details from the store.
     * @param uuid the uuid of the transaction
     * @return {Promise<unknown>} a promise that resolves to the transaction
     */
    getTransactionDetails(uuid) {
        return new Promise((resolve, reject) => {
            WrapPromiseTask(async() => {

                if (!uuid) {
                    throw new Error('Transaction id non valid')
                }

                const transactions = await this.$storageApi.getStore('transactions')
                if (!transactions || !transactions.hasOwnProperty(uuid)) {
                    throw new Error('Transaction non found')
                }

                return transactions[uuid]
            }).then(result => resolve(result))
              .catch(err => reject(err))
        })
    }

    /**
     * It performs the transaction on behalf of the current account.
     * @param transaction the transaction object
     * @param account the account
     * @param privateKey the private key of the account to sign the transaction
     * @return {Promise<{storageValue: StorageValueModel, transaction: TransactionReferenceModel}>} a promise that resolves to a result object
     */
    performTransaction(transaction, account, privateKey) {
        return new Promise((resolve, reject) => {

            WrapPromiseTask(async () => {
                const remoteNode = new RemoteNode(this.$network.get().url, new Signer(Algorithm.ED25519, privateKey))

                const caller = storageReferenceFrom(account.reference)
                const nonceOfCaller = await remoteNode.getNonceOf(caller)
                const gasPrice = await remoteNode.getGasPrice()
                const chainId = await remoteNode.getChainId()

                // we sign the optional base64 data
                if (transaction.base64DataToSign) {
                    const signedData = remoteNode.signer.sign(Buffer.from(transaction.base64DataToSign))
                    transaction.actuals.push({
                        type: 'java.lang.String',
                        value: signedData
                    })
                    transaction.methodSignature.formals.push('java.lang.String')
                }

                const method = transaction.methodSignature.voidMethod ?
                    new VoidMethodSignatureModel(transaction.methodSignature.definingClass, transaction.methodSignature.methodName, transaction.methodSignature.formals) :
                    new NonVoidMethodSignatureModel(transaction.methodSignature.definingClass, transaction.methodSignature.methodName, transaction.methodSignature.returnType, transaction.methodSignature.formals)

                const request = new InstanceMethodCallTransactionRequestModel(
                    caller,
                    nonceOfCaller,
                    chainId,
                    transaction.gas,
                    gasPrice,
                    transaction.smartContractAddress,
                    method,
                    transaction.receiver,
                    transaction.actuals,
                    remoteNode.signer
                )
                const storageValue = await remoteNode.addInstanceMethodCallTransaction(request);

                return {storageValue, transaction: request.getReference(request.signature)}

            }).then(result => resolve(result))
              .catch(err => reject(err))
        })
    }
}