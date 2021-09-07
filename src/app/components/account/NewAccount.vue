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
import {getSessionPeriod, showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";

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
    createAccountFromFaucet: async function(balance) {

      WrapPromiseTask(async () => {
        const remoteNode = new RemoteNode(this.$blockchainConfig.remoteNodeUrl)
        const gamete = await remoteNode.getGamete()
        const balanceOfFaucet = await this.getBalanceOfAccount(gamete.transaction.hash)

        if ((balance - Number(balanceOfFaucet)) > 0) {
          return Promise.resolve({error: 'Cannot transfer more than ' + balanceOfFaucet + ' from faucet'})
        }

        const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.newAccount.password, Bip39Dictionary.ENGLISH)
        const account = await new AccountHelper(remoteNode).createAccountFromFaucet(Algorithm.ED25519, keyPair, balance.toString(), "0")
        const committed = await this.$browser.setToStorage({
          account: {
            sessionPeriod: getSessionPeriod(),
            name: this.newAccount.name,
            reference: account.reference,
            entropy: keyPair.entropy,
            publicKey: keyPair.publicKey,
          }
        })

        console.log('committed', committed)
        return Promise.resolve({committed: committed})

      }).then(result => {
        console.log('result', result)
        if (result.error) {
          showErrorToast(this, 'New account', result.error)
        } else if (result.committed) {
          replaceRoute('/account')
        } else {
          showErrorToast(this, 'New account', 'Cannot save account to Hotwallet')
        }
      }).catch(err => {
        showErrorToast(this, 'New account', err.message ? err.message : 'Error during account creation')
      })
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
      return await new AccountHelper(new RemoteNode(this.$blockchainConfig.remoteNodeUrl))
          .getBalance(StorageReferenceModel.newStorageReference(hashOfStorageReference))
    },
    isFaucetAllowed() {
      WrapPromiseTask(async () => {
        return new RemoteNode(this.$blockchainConfig.remoteNodeUrl).allowsUnsignedFaucet()
      }).then(result => {
        this.faucet.allowsUnsignedFaucet = result
      }).catch(error => {
        showErrorToast(this, 'Faucet', error.message ? error.message : 'Cannot retrieve faucet')
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
