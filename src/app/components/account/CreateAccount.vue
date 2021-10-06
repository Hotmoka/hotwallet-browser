<template>
  <div class="content">

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
            :invalid-feedback="invalidFeedbackPassword"
            :state="statePassword"
        >
          <label for="i-pwd">Password  <b-icon id="i-pwd-help" width="18" icon="question-circle-fill" variant="info"></b-icon></label>
          <b-form-input type="password" id="i-pwd" v-model="newAccount.password" :state="statePassword" trim></b-form-input>

          <b-tooltip target="i-pwd-help" triggers="hover">
            Keep note of the password, since there is no way to recover it later
          </b-tooltip>
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
          <b-form-input type="number" id="i-balance" min="0" v-model="newAccount.balance" trim></b-form-input>
        </b-form-group>

        <b-form-group
            v-if="allowsUnsignedFaucet"
            id="i-faucet"
        >
          <b-form-checkbox
              id="checkbox-faucet"
              v-model="fromFaucet"
              name="checkbox-1"
              :value="true"
              :unchecked-value="false"
          >
            Use faucet as payer
          </b-form-checkbox>
        </b-form-group>

        <b-form-group
            v-if="payer && payer.reference && !fromFaucet"
            id="i-address"
        >
          <label>Payer</label>
          <p class="txt-secondary"> {{ payer.name }} - {{ payerAddress }}</p>
        </b-form-group>

        <b-button @click="onCreateAccountClick" variant="primary" :disabled="stateFormDisabled">Create</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {RemoteNode, AccountHelper, Algorithm, Bip39Dictionary, StorageReferenceModel} from "hotweb3"
import {EventBus, showErrorToast, trimAddress, WrapPromiseTask} from "../../internal/utils";
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
      fromFaucet: false,
      newAccount: {
        name: null,
        confirmPassword: null,
        password: null,
        balance: null
      },
      allowsUnsignedFaucet: false,
      payer: null
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
    },
    payerAddress() {
      return this.payer ? trimAddress(this.payer.reference) : ''
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
      }).then(() => replaceRoute('/account'))
        .catch(err => showErrorToast(this, 'New account', err.message || 'Error during account creation'))
    },
    createAccountFromCurrentAccount(balance) {
      WrapPromiseTask(async () => {

        const remoteNode = new RemoteNode(this.$network.get().url)
        const balanceOfPayer = await this.getBalanceOfAccount(this.payer.reference)

        if ((balance - Number(balanceOfPayer)) > 0) {
          throw new Error('Cannot transfer more than ' + balanceOfPayer + ' from payer ' + this.payer.name)
        }

        // generate key pair of payer
        const keyPairOfPayer = AccountHelper.generateEd25519KeyPairFrom(this.payer.password, Bip39Dictionary.ENGLISH, this.payer.entropy)

        // generate key pair for the new account
        const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.newAccount.password, Bip39Dictionary.ENGLISH)
        const account = await new AccountHelper(remoteNode).createAccountFromPayer(
            Algorithm.ED25519,
            StorageReferenceModel.newStorageReference(this.payer.reference),
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
        .catch(err => showErrorToast(this, 'New account', err.message || 'Error during account creation'))
    },
    onCreateAccountClick() {
      WrapPromiseTask(async () => {

        if (!this.newAccount.balance || isNaN(this.newAccount.balance)) {
          throw new Error('Illegal balance. Please insert a valid number of Panrea coins')
        }

        if (!this.payer.reference && !this.fromFaucet) {
          throw new Error('Cannot use a key as a payer' + (this.allowsUnsignedFaucet ? '. Use faucet as payer' : ''))
        }

        const balance = Math.round(Number(this.newAccount.balance))
        if (balance < 1) {
          throw new Error('Balance cannot be less than 1 Panarea')
        }

        return balance
      }).then(balance => {
        if (this.fromFaucet) {
          this.createAccountFromFaucet(balance)
        } else {
          this.createAccountFromCurrentAccount(balance)
        }
      }).catch(err => showErrorToast(this, 'New account', err.message || 'An error occurred while creating the account'))
    },
    getBalanceOfAccount: async function (hashOfStorageReference) {
      return new AccountHelper(new RemoteNode(this.$network.get().url))
          .getBalance(StorageReferenceModel.newStorageReference(hashOfStorageReference))
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Create account')

    WrapPromiseTask(async () => {
      const account = await this.$storageApi.getCurrentAccount(this.$network.get())
      const allowsUnsignedFaucet = await new RemoteNode(this.$network.get().url).allowsUnsignedFaucet()
      return { account, allowsUnsignedFaucet }
    }).then(result => {
      this.allowsUnsignedFaucet = result.allowsUnsignedFaucet
      this.payer = result.account
    }).catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
