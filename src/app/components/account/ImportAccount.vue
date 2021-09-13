<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">Import account</h6>

    <div class="d-flex justify-content-center">
      <div class="text-left form-container">

        <b-form-group
            id="i-name"
            label="Name"
            label-for="i-name"
            :invalid-feedback="invalidFeedbackName"
            :state="stateName"
        >
          <b-form-input type="text" id="i-name" v-model="name" :state="stateName" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-pwd"
            label="Password"
            label-for="i-pwd"
            :invalid-feedback="invalidFeedbackPassword"
            :state="statePassword"
        >
          <b-form-input type="password" id="i-pwd" v-model="password" :state="statePassword" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-words"
            label="Words"
            label-for="i-words"
        >
          <div class="row">
            <div class="h-cell col-4" v-for="index in 36" :key="index">
              <b-form-input
                  :id="'i-words-' + index"
                  :placeholder="'word ' + index"
                  v-model="words[index - 1]"
                  trim
              ></b-form-input>
            </div>
          </div>
        </b-form-group>

        <b-button @click="onImportAccountClick" variant="primary" :disabled="!statePassword || !stateName">Import</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {AccountHelper, Bip39Dictionary, RemoteNode} from "hotweb3";
import {showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";
import {replaceRoute} from "../../internal/router";

export default {
  name: "ImportWallet",
  data() {
    return {
      password: null,
      name: null,
      words: []
    }
  },
  computed: {
    statePassword() {
      return statePassword(this.password)
    },
    stateName() {
      return stateFieldNotEmpty(this.name)
    },
    invalidFeedbackPassword() {
      return invalidPasswordFeedback(this.password)
    },
    invalidFeedbackName() {
      return fieldNotEmptyFeedback(this.name, "Please enter the account\'s name")
    }
  },
  methods: {

    onImportAccountClick() {

      WrapPromiseTask(async () => {

        for (let i = 0; i < 36; i++) {
          if (!this.words[i]) {
            return {error: 'Please enter all 36 words'}
          }
        }

        // generate account from mnemonic
        const mnemonic = this.words.join(' ')
        const account = AccountHelper.generateAccountFrom(mnemonic, Bip39Dictionary.ENGLISH)

        // generate key pair
        const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.password, Bip39Dictionary.ENGLISH, account.entropy)

        // get public key of the generated account
        const publicKey = await new AccountHelper(new RemoteNode(this.$network.url)).getPublicKey(account.reference)

        // check if generated public key matches the public key from the remote node
        if (keyPair.publicKey === publicKey) {
          // init store and add account
          await this.$storageApi.initStore(this.password)
          const committed = await this.$storageApi.addAccount(
              {
                name: this.name,
                reference: account.reference.transaction.hash,
                nonce: account.reference.progressive,
                entropy: keyPair.entropy,
                publicKey: keyPair.publicKey,
                selected: true,
                logged: true,
                network: this.$network,
                timestamp: new Date().getTime()
              }
          )

          if (!committed) {
            throw new Error('Cannot set account')
          }

          // reinit store
          await this.$storageApi.reinitStore()

        } else {
          throw new Error('Invalid words or password')
        }

      }).then(() =>
          replaceRoute('/home')
      ).catch(error => showErrorToast(this, 'Import account', error.message ? error.message : 'Cannot import account'))

    }
  },
  created() {
    for (let i = 0; i < 36; i++) {
      this.words.push(null)
    }
  }
}
</script>

<style scoped>
.h-cell {
  padding-bottom: 6px;
}
</style>
