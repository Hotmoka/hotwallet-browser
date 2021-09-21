<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">Create account</h6>

    <div class="d-flex justify-content-center">
      <div class="text-left form-container">

        <b-form-group
            id="i-name"
            label="Name"
            label-for="i-name"
            :invalid-feedback="invalidFeedbackName"
            :state="stateName"
        >
          <b-form-input type="text" id="i-name" v-model="newAccount.name" :state="stateName" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-pwd"
            label="Password"
            label-for="i-pwd"
            :invalid-feedback="invalidFeedbackPassword"
            :state="statePassword"
        >
          <b-form-input type="password" id="i-pwd" v-model="newAccount.password" :state="statePassword" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-c-pwd"
            label="Confirm password"
            label-for="i-c-pwd"
            :invalid-feedback="invalidFeedbackConfirmPassword"
            :state="stateConfirmPassword"
        >
          <b-form-input type="password" id="i-c-pwd" v-model="newAccount.confirmPassword" :state="stateConfirmPassword" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-balance"
            label="Balance"
            label-for="i-balance"
        >
          <b-form-input type="number" id="i-balance" v-model="newAccount.balance" trim></b-form-input>
        </b-form-group>

        <b-form-group
            v-if="allowsUnsignedFaucet"
            id="i-faucet"
        >
          <b-form-checkbox
              id="checkbox-faucet"
              v-model="faucet.fromFaucet"
              name="checkbox-1"
              :value="true"
              :unchecked-value="false"
          >
            Use faucet as payer
          </b-form-checkbox>
        </b-form-group>


        <b-button @click="onCreateAccountClick" variant="primary" :disabled="stateFormDisabled">Create</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {RemoteNode, AccountHelper, Algorithm, Bip39Dictionary, StorageReferenceModel} from "hotweb3"
import {showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";

export default {
  name: "CreateAccount",
  props: {
    allowsUnsignedFaucet: Boolean,
    hasAccount: Boolean
  },
  data() {
    return {
      faucet: {
        fromFaucet: false
      },
      newAccount: {
        name: null,
        confirmPassword: null,
        password: null,
        balance: null
      }
    }
  },
  computed: {
    stateName() {
      return stateFieldNotEmpty(this.newAccount.name)
    },
    statePassword() {
      return statePassword(this.newAccount.password)
    },
    stateConfirmPassword() {
      return this.newAccount.confirmPassword === null ? null : (this.newAccount.confirmPassword.length >= 8 && this.newAccount.confirmPassword === this.newAccount.password)
    },
    stateFormDisabled() {
      return !this.statePassword || !this.stateConfirmPassword || !this.stateName
    },
    invalidFeedbackPassword() {
      return invalidPasswordFeedback(this.newAccount.password)
    },
    invalidFeedbackConfirmPassword() {
      return fieldNotEmptyFeedback(this.newAccount.confirmPassword, 'The passwords don\'t match')
    },
    invalidFeedbackName() {
      return fieldNotEmptyFeedback(this.newAccount.name, 'Please enter the account\'s name')
    }
  },
  methods: {
    createAccountFromFaucet(balance) {
      WrapPromiseTask(async () => {

        const remoteNode = new RemoteNode(this.$network.get().url)
        const gamete = await remoteNode.getGamete()
        const balanceOfFaucet = await this.getBalanceOfAccount(gamete.transaction.hash)

        if ((balance - Number(balanceOfFaucet)) > 0) {
          throw new Error('Cannot transfer more than ' + balanceOfFaucet + ' from faucet')
        }

        // generate key pair
        const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.newAccount.password, Bip39Dictionary.ENGLISH)
        const account = await new AccountHelper(remoteNode).createAccountFromFaucet(Algorithm.ED25519, keyPair, balance.toString(), "0")

        // set password for the private store and add account
        await this.$storageApi.setPassword(this.newAccount.password)
        await this.$storageApi.addAccount(
            {
              name: this.newAccount.name,
              reference: account.reference.transaction.hash,
              nonce: account.reference.progressive,
              entropy: keyPair.entropy,
              publicKey: keyPair.publicKey,
              selected: true,
              logged: true,
              network: {value: this.$network.get().value, url: this.$network.get().url},
              created: new Date().getTime()
            }
        )
      }).then(() =>
          replaceRoute('/account')
      ).catch(err => showErrorToast(this, 'New account', err.message ? err.message : 'Error during account creation'))

    },
    createAccountFromCurrentAccount(balance) {
      WrapPromiseTask(async () => {

        const remoteNode = new RemoteNode(this.$network.get().url)
        const payer = await this.$storageApi.getCurrentAccount(this.$network.get())
        const balanceOfPayer = await this.getBalanceOfAccount(payer.reference)

        if ((balance - Number(balanceOfPayer)) > 0) {
          throw new Error('Cannot transfer more than ' + balanceOfPayer + ' from payer ' + payer.name)
        }

        // generate key pair of payer
        const keyPairOfPayer = AccountHelper.generateEd25519KeyPairFrom(payer.password, Bip39Dictionary.ENGLISH, payer.entropy)

        // generate key pair for the new account
        const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.newAccount.password, Bip39Dictionary.ENGLISH)
        const account = await new AccountHelper(remoteNode).createAccountFromPayer(
            Algorithm.ED25519,
            StorageReferenceModel.newStorageReference(payer.reference),
            keyPairOfPayer,
            keyPair,
            balance.toString(),
            "0",
            false
        )

        // set password for the private store and add account
        await this.$storageApi.setPassword(this.newAccount.password)
        await this.$storageApi.addAccount(
            {
              name: this.newAccount.name,
              reference: account.reference.transaction.hash,
              nonce: account.reference.progressive,
              entropy: keyPair.entropy,
              publicKey: keyPair.publicKey,
              selected: true,
              logged: true,
              network: {value: this.$network.get().value, url: this.$network.get().url},
              created: new Date().getTime()
            }
        )
      }).then(() => replaceRoute('/account'))
        .catch(err => showErrorToast(this, 'New account', err.message ? err.message : 'Error during account creation'))
    },
    onCreateAccountClick() {
      if (isNaN(this.newAccount.balance)) {
        showErrorToast(this, 'New account', 'Illegal balance. Please insert a valid number of coins')
        return
      }

      const balance = Math.round(Number(this.newAccount.balance))
      if (this.faucet.fromFaucet) {
        this.createAccountFromFaucet(balance)
      } else {
        this.createAccountFromCurrentAccount(balance)
      }
    },
    getBalanceOfAccount: async function (hashOfStorageReference) {
      return new AccountHelper(new RemoteNode(this.$network.get().url))
          .getBalance(StorageReferenceModel.newStorageReference(hashOfStorageReference))
    },
    isFaucetAllowed() {
      WrapPromiseTask(() => new RemoteNode(this.$network.get().url).allowsUnsignedFaucet())
          .then(result => this.faucet.allowsUnsignedFaucet = result)
          .catch(error => showErrorToast(this, 'Faucet', error.message ? error.message : 'Cannot retrieve faucet'))
    }
  },
  created() {
 //   this.isFaucetAllowed()
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
