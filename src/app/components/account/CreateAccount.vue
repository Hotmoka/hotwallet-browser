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
      return stateFieldNotEmpty(this.newAccount.name)
    },
    statePassword() {
      return statePassword(this.newAccount.password)
    },
    statePayerPassword() {
      if (this.faucet.fromFaucet) {
        return true
      }
      return statePassword(this.payer.password)
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
      return invalidPasswordFeedback(this.newAccount.password)
    },
    invalidFeedbackPayerPassword() {
      return invalidPasswordFeedback(this.payer.password)
    },
    invalidFeedbackConfirmPassword() {
      return fieldNotEmptyFeedback(this.newAccount.confirmPassword, 'The passwords don\'t match')
    },
    invalidFeedbackName() {
      return fieldNotEmptyFeedback(this.newAccount.name, 'Please enter the account\'s name')
    },
    invalidFeedbackPayer() {
      return fieldNotEmptyFeedback(this.payer.hashOfStorageReference, 'Please enter a valid address of 64 characters')
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
    this.isFaucetAllowed()
    console.log('network', this.$network.get())
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
