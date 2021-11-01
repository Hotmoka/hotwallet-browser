import Vue from "vue";
import {showErrorToast, WrapPromiseTask} from "./utils";
import {AccountHelper, Bip39Dictionary} from "hotweb3";

/**
 * Service class that wraps common tasks.
 */
export class Service extends Vue {

    /**
     * Method to log in to Hotwallet.
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

            }).then(() => resolve())
              .catch(error => {
                  showErrorToast(this, 'Login', error.message || 'Error during login')
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
}