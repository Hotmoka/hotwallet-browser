<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">New account</h6>

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
            v-if="faucet.allowsUnsignedFaucet"
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

        <b-form-group
            v-if="!faucet.fromFaucet"
            id="i-payer"
            label="Payer"
            label-for="i-payer"
            :invalid-feedback="invalidFeedbackPayer"
            :state="statePayer"
        >
          <b-form-input type="text" id="i-payer" v-model="payer.hashOfStorageReference" :state="statePayer" trim></b-form-input>
        </b-form-group>

        <b-form-group
            v-if="!faucet.fromFaucet"
            id="i-payer-pwd"
            label="Password of Payer"
            label-for="i-payer-pwd"
            :invalid-feedback="invalidFeedbackPayerPassword"
            :state="statePayerPassword"
        >
          <b-form-input type="text" id="i-payer-pwd" v-model="payer.password" :state="statePayerPassword" trim></b-form-input>
        </b-form-group>

        <b-button @click="onCreateAccountClick" variant="primary" :disabled="stateForm">Create</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {RemoteNode, AccountHelper, Algorithm, Bip39Dictionary, StorageReferenceModel} from "hotweb3"
import {EventBus, getSessionPeriod, showErrorToast, WrapNetworkPromiseTask} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";

export default {
  name: "NewWallet",
  data() {
    return {
      faucet: {
        allowsUnsignedFaucet: false,
        fromFaucet: false
      },
      payer: {
        hashOfStorageReference: null,
        password: null
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
      return this.newAccount.name === null ? null : this.newAccount.name.length > 0
    },
    statePassword() {
      return this.newAccount.password === null ? null : this.newAccount.password.length >= 8
    },
    statePayerPassword() {
      if (this.faucet.fromFaucet) {
        return true
      }
      return this.payer.password === null ? null : this.payer.password.length >= 8
    },
    stateConfirmPassword() {
      return this.newAccount.confirmPassword === null ? null : (this.newAccount.confirmPassword.length >= 8 && this.newAccount.confirmPassword === this.newAccount.password)
    },
    statePayer() {
      if (this.faucet.fromFaucet) {
        return true
      }
      return this.payer.hashOfStorageReference === null ? null : this.payer.hashOfStorageReference.length === 64
    },
    stateForm() {
      return !this.statePassword || !this.stateConfirmPassword || !this.stateName || !this.statePayer || !this.statePayerPassword
    },
    invalidFeedbackPassword() {
      if (this.newAccount.password === null) {
        return null
      }
      if (this.newAccount.password.length > 0) {
        return 'Please enter at least 8 characters'
      }
      return 'Please enter a password'
    },
    invalidFeedbackPayerPassword() {
      if (this.payer.password === null) {
        return null
      }
      if (this.payer.password.length > 0) {
        return 'Please enter at least 8 characters'
      }
      return 'Please enter a password'
    },
    invalidFeedbackConfirmPassword() {
      if (this.newAccount.confirmPassword === null) {
        return null
      }
      return 'The passwords don\'t match'
    },
    invalidFeedbackName() {
      if (this.newAccount.name === null) {
        return null
      }
      return 'Please enter the account\'s name'
    },
    invalidFeedbackPayer() {
      if (this.newAccount.name === null) {
        return null
      }
      return 'Please enter a valid address of 64 characters'
    }
  },
  methods: {
    createAccountFromFaucet: async function(balance) {
      try {
        EventBus.$emit('showSpinner', true)
        const remoteNode = new RemoteNode(this.$blockchainConfig.remoteNodeUrl)
        const gamete = await remoteNode.getGamete()
        const balanceOfFaucet = await this.getBalanceOfAccount(gamete.transaction.hash)

        if ((balance - balanceOfFaucet) > 0) {
          EventBus.$emit('showSpinner', false)
          showErrorToast(this, 'New account', 'Cannot transfer more than ' + balanceOfFaucet + ' from faucet')
          return
        }

        const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.newAccount.password, Bip39Dictionary.ENGLISH)
        const account = await new AccountHelper(remoteNode).createAccountFromFaucet(Algorithm.ED25519, keyPair, balance.toString(), "0")
        EventBus.$emit('showSpinner', false)

        this.$browser.setToStorage({
          account: {
            sessionPeriod: getSessionPeriod(),
            name: this.newAccount.name,
            reference: account.reference,
            entropy: keyPair.entropy,
            publicKey: keyPair.publicKey,
          }
        }, committed => {
          if (committed) {
            replaceRoute('/account')
          } else {
            showErrorToast(this, 'New account', 'Cannot save account to Hotwallet')
          }
        })

      } catch (err) {
        console.error('account creation', err)
        EventBus.$emit('showSpinner', false)
        showErrorToast(this, 'New account', 'Error during account creation')
      }
    },
    createAccountFromAnotherAccount(balance) {
      // TODO
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
        this.createAccountFromAnotherAccount(balance)
      }
    },
    getBalanceOfAccount: async function (hashOfStorageReference) {
      const balance = await new AccountHelper(new RemoteNode(this.$blockchainConfig.remoteNodeUrl))
          .getBalance(StorageReferenceModel.newStorageReference(hashOfStorageReference))
      return Number(balance)
    },
    isFaucetAllowed() {
      const promiseTask = new RemoteNode(this.$blockchainConfig.remoteNodeUrl).allowsUnsignedFaucet()
      WrapNetworkPromiseTask(promiseTask, (allowsUnsignedFaucet, error) => {
        this.faucet.allowsUnsignedFaucet = !error && allowsUnsignedFaucet
      })
    }
  },
  created() {
    this.isFaucetAllowed()
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
