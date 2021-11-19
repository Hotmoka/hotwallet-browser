import Vue from "vue";
import {
    EventBus,
    filterAccount,
    filterNetwork,
    getNetworkByValue,
    showErrorToast,
    storageReferenceFrom, storageReferenceToString,
    WrapPromiseTask
} from "./utils";
import {
    AccountHelper,
    Algorithm, Base58,
    Bip39Dictionary, InstanceMethodCallTransactionRequestModel, KeyPair,
    NonVoidMethodSignatureModel,
    RemoteNode, SendCoinsHelper,
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
        return WrapPromiseTask(async () => {

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
        }).then(account => this.$eventsApi.emit(CONNECTED, filterAccount(account)))
    }

    /**
     * It performs a logout from Hotwallet.
     * @param account the current account
     * @return {Promise<void>} a promise that resolves to void
     */
    logout(account) {
        return WrapPromiseTask(async () => this.$storageApi.setAccountAuth(account, false))
            .then(() => this.$eventsApi.emit(DISCONNECTED))
    }

    /**
     * Returns the current public selected account.
     * @return {Promise<{name, publicKey}>} a promise that resolves to an account object
     */
    getCurrentPublicAccount() {
        return WrapPromiseTask(async () => {
            const account = await this.$storageApi.getStore('account')
            if (!account) {
                throw new Error('Cannot retrieve account')
            }
            return account
        })
    }

    /**
     * Returns the current logged account.
     * @return {Promise<{Object}>} a promise that resolves to an account object
     */
    getCurrentAccount() {
        return WrapPromiseTask(async () => this.$storageApi.getCurrentAccount(this.$network.get()))
    }

    /**
     * It changes the current network with a new network.
     * If the network holds an account, the current account will be changed with the first account of the network.
     * @param network the new network
     * @param networks the networks
     * @return {Promise<unknown>} a promises that resolves to the new network
     */
    changeNetwork(network, networks) {
        return WrapPromiseTask(async () => {
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
            this.$eventsApi.emit(NETWORK_CHANGED, filterNetwork(result.network))
            this.$eventsApi.emit(ACCOUNT_CHANGED, result.newAccount ? null : result.account)
        })
    }

    /**
     * It connects to a new network and logs out from the current account.
     * @param url the url of the network
     * @param name the name of the network
     * @return {Promise<unknown>} a promise that resolves to the network object
     */
    connectToNetwork(url, name) {
        return WrapPromiseTask(async () => {
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
            this.$eventsApi.emit(NETWORK_CHANGED, filterNetwork(network))
            this.$eventsApi.emit(ACCOUNT_CHANGED, null)
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
     * It returns the balance of an account.
     * @param storageReference the storage reference of the account
     * @return {Promise<string>} a promise that resolves to the balance
     */
    getBalanceOfAccount(storageReference) {
        return new AccountHelper(new RemoteNode(this.$network.get().url)).getBalance(storageReference)
    }

    /**
     * It switches to a new account.
     * @param account the new account
     * @param password the password of the new account
     * @return {Promise<void>} a promise that resolves to void
     */
    switchToAccount(account, password) {
        return WrapPromiseTask(async () => {

            // set new password
            await this.$storageApi.setPassword(password)
            await this.$storageApi.setAccountAuth(account, true)
            await this.$storageApi.selectNetwork(account.network)
            const currentNetwork = await this.$storageApi.getCurrentNetwork()
            this.$network.set(currentNetwork)

            // notify network change
            EventBus.$emit('networkChange', currentNetwork)

        }).then(() => {
            this.$eventsApi.emit(ACCOUNT_CHANGED, filterAccount(account))
            this.$eventsApi.emit(NETWORK_CHANGED, filterNetwork(account.network))
        })
    }

    /**
     * It returns the transaction details from the store.
     * @param uuid the uuid of the transaction
     * @return {Promise<unknown>} a promise that resolves to the transaction
     */
    getTransactionDetails(uuid) {
        return WrapPromiseTask(async () => {

            if (!uuid) {
                throw new Error('Transaction id non valid')
            }

            const transactions = await this.$storageApi.getStore('transactions')
            if (!transactions || !transactions.hasOwnProperty(uuid)) {
                throw new Error('Transaction non found')
            }

            return transactions[uuid]
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
        return WrapPromiseTask(async () => {
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
        })
    }

    /**
     * It verifies if the given account is actually an account object in the remote node.
     * @param account the account
     * @return {Promise<void>} a promise that resolves to void
     */
    verifyAccount(account) {
        return WrapPromiseTask(async () => {

            let storageRefOfAccount = null
            try {
                storageRefOfAccount = storageReferenceFrom(account.reference)
            } catch (e) {
                throw new Error('Invalid address of account')
            }

            const accountHelper = new AccountHelper(new RemoteNode(this.$network.get().url))
            const isVerified = await accountHelper.verifyAccount(storageRefOfAccount, account.publicKey)

            if (!isVerified) {
                throw new Error('Cannot verify account')
            }

            await this.$storageApi.updateAccount(account)
        })
    }

    /**
     * It creates an account from faucet.
     * @param newAccount the account to create
     * @param balance the initial balance of the account
     * @return {Promise<void>} a promise that resolves to void
     */
    createAccountFromFaucet(newAccount, balance) {
        return WrapPromiseTask(async () => {

            const remoteNode = new RemoteNode(this.$network.get().url)
            const gamete = await remoteNode.getGamete()
            const balanceOfFaucet = await this.getBalanceOfAccount(gamete)

            if ((balance - Number(balanceOfFaucet)) > 0) {
                throw new Error('Cannot transfer more than ' + balanceOfFaucet + ' from faucet')
            }

            // generate key pair
            const keyPair = AccountHelper.generateEd25519KeyPairFrom(newAccount.password, Bip39Dictionary.ENGLISH)
            const account = await new AccountHelper(remoteNode).createAccountFromFaucet(Algorithm.ED25519, keyPair, balance.toString(), "0")

            // set password for the private store and add account
            await this.$storageApi.setPassword(newAccount.password)
            await this.$storageApi.addAccount(
                {
                    name: newAccount.name,
                    reference: storageReferenceToString(account.reference),
                    entropy: keyPair.entropy,
                    publicKey: keyPair.publicKey,
                    selected: true,
                    logged: true,
                    network: {value: this.$network.get().value, url: this.$network.get().url},
                    created: new Date().getTime()
                }
            )
        })
    }

    /**
     * It creates an account from a payer.
     * @param newAccount the account to create
     * @param payer the payer
     * @param passwordOfPayer the password of the payer
     * @return {Promise<void>} a promise that resolves to void
     */
    createAccountFromPayer(newAccount, payer, passwordOfPayer) {
        return WrapPromiseTask(async () => {
            const balance = Math.round(Number(newAccount.balance))

            const remoteNode = new RemoteNode(this.$network.get().url)
            const storageReferenceOfPayer = storageReferenceFrom(payer.reference)
            const balanceOfPayer = await this.getBalanceOfAccount(storageReferenceOfPayer)

            if ((balance - Number(balanceOfPayer)) > 0) {
                throw new Error('Cannot transfer more than ' + balanceOfPayer + ' from payer ' + payer.name)
            }

            // generate key pair of payer
            const keyPairOfPayer = AccountHelper.generateEd25519KeyPairFrom(passwordOfPayer, Bip39Dictionary.ENGLISH, payer.entropy)

            // generate key pair for the new account
            const keyPair = AccountHelper.generateEd25519KeyPairFrom(newAccount.password, Bip39Dictionary.ENGLISH)
            const account = await new AccountHelper(remoteNode).createAccountFromPayer(
                Algorithm.ED25519,
                storageReferenceOfPayer,
                keyPairOfPayer,
                keyPair,
                balance.toString(),
                "0",
                false
            )

            // set password for the private store and add account
            await this.$storageApi.setPassword(newAccount.password)
            await this.$storageApi.addAccount(
                {
                    name: newAccount.name,
                    reference: storageReferenceToString(account.reference),
                    entropy: keyPair.entropy,
                    publicKey: keyPair.publicKey,
                    selected: true,
                    logged: true,
                    network: {value: this.$network.get().value, url: this.$network.get().url},
                    created: new Date().getTime()
                }
            )
        })
    }

    /**
     * It creates a key from a given name and password.
     * @param name the name of local account
     * @param password the password
     * @return {Promise<void>} a promise that resolves to void
     */
    createKey(name, password) {
        return WrapPromiseTask(async () => {

            // create key
            const account = AccountHelper.createKey(password, Bip39Dictionary.ENGLISH)

            // set password for the private store and add account
            await this.$storageApi.setPassword(password)
            await this.$storageApi.addAccount(
                {
                    name: name,
                    reference: null,
                    entropy: account.entropy,
                    publicKey: account.publicKey,
                    publicKeyBase58: account.name,
                    balance: account.balance,
                    selected: true,
                    logged: true,
                    network: {value: this.$network.get().value, url: this.$network.get().url},
                    created: new Date().getTime()
                }
            )
        })
    }

    /**
     * It imports an account from the given name, password and words.
     * @param name the name of the account
     * @param password the password of the account
     * @param words the 36 mnemonic words
     * @return {Promise<unknown>}
     */
    importAccount(name, password, words) {
        return WrapPromiseTask(async () => {

            for (let i = 0; i < 36; i++) {
                if (!words[i]) {
                    throw new Error('Please enter all 36 words')
                }
            }

            // generate account from mnemonic
            const mnemonic = words.join(' ')
            const account = await new AccountHelper(new RemoteNode(this.$network.get().url)).importAccount(name, mnemonic, Bip39Dictionary.ENGLISH, password)

            // set password and add account
            await this.$storageApi.setPassword(password)
            await this.$storageApi.addAccount(
                {
                    name: name,
                    reference: storageReferenceToString(account.reference),
                    entropy: account.entropy,
                    publicKey: account.publicKey,
                    balance: account.balance,
                    selected: true,
                    logged: true,
                    network: {value: this.$network.get().value, url: this.$network.get().url},
                    created: new Date().getTime()
                }
            )
        })
    }

    /**
     * It returns the accounts of the wallet.
     * @return {Promise<[Object]>} a promise that resolves to an array of account object
     */
    getAccounts() {
        return WrapPromiseTask(async () => this.$storageApi.getAccounts())
            .then(accounts => accounts.sort((a, b)  => a.selected ? -1 : 1))
    }

    /**
     * It returns the current logged account with the faucet property.
     * @return {Promise<{account: Object, allowsUnsignedFaucet: boolean}>} a promise that resolves to the result account and the faucet property
     */
    getCurrentAccountWithFaucet() {
        return WrapPromiseTask(async () => {
            const account = await this.$storageApi.getCurrentAccount(this.$network.get())
            const allowsUnsignedFaucet = await new RemoteNode(this.$network.get().url).allowsUnsignedFaucet()
            return { account, allowsUnsignedFaucet }
        })
    }

    /**
     * It sends an amount of coins to an account address.
     * @param payer the payer
     * @param keyPairOfPayer the key pair of the payer
     * @param destination the destination account address
     * @param amount the amount to send
     * @param resultTransactionCallback a callback to be invoked after the payment with the transaction of the payment
     * @return {Promise<void>} a promise that resolves to void
     */
    sendCoinsToAccount(payer, keyPairOfPayer, destination, amount, resultTransactionCallback) {
        return new SendCoinsHelper(new RemoteNode(this.$network.get().url)).fromPayer(
            storageReferenceFrom(payer.reference),
            keyPairOfPayer,
            storageReferenceFrom(destination),
            amount,
            '0',
            transactions => {
                if (transactions && transactions.length > 0) {
                    resultTransactionCallback(transactions[0])
                }
            }
        )
    }

    /**
     * It sends an amount of coins to an account address. The payer is the faucet.
     * @param destination the destination account address
     * @param amount the amount to send
     * @param resultTransactionCallback a callback to be invoked after the payment with the transaction of the payment
     * @return {Promise<void>} a promise that resolves to void
     */
    sendCoinsToAccountFromFaucet(destination, amount, resultTransactionCallback) {
        return new SendCoinsHelper(new RemoteNode(this.$network.get().url)).fromFaucet(
            storageReferenceFrom(destination),
            amount,
            '0',
            transaction => resultTransactionCallback(transaction)
        )
    }

    /**
     * It sends an amount of coins to a public key.
     * @param payer the payer
     * @param keyPairOfPayer the key pair of the payer
     * @param destination the destination public key
     * @param amount the amount to send
     * @param anonymous true if anonymous, false otherwise
     * @param resultTransactionCallback a callback to be invoked after the payment with the transaction of the payment
     * @return {Promise<Account>} a promise that resolves to a newly created account
     */
    sendCoinsToPublicKey(payer, keyPairOfPayer, destination, amount, anonymous, resultTransactionCallback) {
        return new AccountHelper(new RemoteNode(this.$network.get().url)).createAccountFromPayer(
            Algorithm.ED25519,
            storageReferenceFrom(payer.reference),
            keyPairOfPayer,
            new KeyPair(null, Base58.decode(destination).toString(), null),
            amount,
            "0",
            anonymous,
            transactions => {
                if (transactions && transactions.length > 0) {
                    resultTransactionCallback(transactions[0])
                }
            }
        )
    }

    /**
     * It returns a Ed25519 key pair from a given password and entropy.
     * @param password the password
     * @param entropy the entropy
     * @return {Promise<KeyPair>} a promise that resolves to a key pair object
     */
    generateEd25519KeyPairFrom(password, entropy) {
        return WrapPromiseTask(async () => AccountHelper.generateEd25519KeyPairFrom(password, Bip39Dictionary.ENGLISH, entropy))
    }

    /**
     * It returns the details of an account
     * @param accountReference the reference of the account
     * @return {Promise<StateModel>} a promise that resolves to the StateModel object
     */
    getAccountDetails(accountReference) {
        return WrapPromiseTask(async () => new RemoteNode(this.$network.get().url).getState(storageReferenceFrom(accountReference)))
    }

    /**
     * It removes the given account or key.
     * @param account the account or key
     * @return {Promise<void>} a promise that resolves to void
     */
    removeAccount(account) {
        return WrapPromiseTask(async () => this.$storageApi.removeAccount(account))
    }
}