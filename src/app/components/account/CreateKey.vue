<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">Create key</h6>

    <p>Once you (or somebody else) pay to that key, it will become an account,
      that you can control through the password specified below. Keep note of that password,
      since there is no way to recover it later
    </p>

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

        <b-button @click="onCreateClick" variant="primary" :disabled="!statePassword || !stateName">Create</b-button>
      </div>
    </div>

  </div>
</template>

<script>
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";
import {showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {AccountHelper, Base58, Bip39Dictionary} from "hotweb3";
import {replaceRoute} from "../../internal/router";


export default {
  name: "CreateKey",
  data() {
    return {
      password: null,
      name: null
    }
  },
  computed: {
    statePassword() {
      return statePassword(this.password)
    },
    invalidFeedbackPassword() {
      return invalidPasswordFeedback(this.password)
    },
    stateName() {
      return stateFieldNotEmpty(this.name)
    },
    invalidFeedbackName() {
      return fieldNotEmptyFeedback(this.name, 'Please enter a name')
    }
  },
  methods: {
    onCreateClick() {

      WrapPromiseTask(async () => {

        // generate key pair
        const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.password, Bip39Dictionary.ENGLISH)
        const publicKeyBase58 = Base58.encode(keyPair.publicKey)

        // set password for the private store and add account
        await this.$storageApi.setPassword(this.password)
        await this.$storageApi.addAccount(
            {
              name: this.name,
              reference: null,
              nonce: 0,
              entropy: keyPair.entropy,
              publicKey: keyPair.publicKey,
              publicKeyBase58: publicKeyBase58,
              selected: true,
              logged: true,
              network: {value: this.$network.get().value, url: this.$network.get().url},
              created: new Date().getTime()
            }
        )
      }).then(() => replaceRoute('/home'))
      .catch(err => showErrorToast(this, 'Create key', err.message ? err.message : 'Error during key creation'))
    }
  }
}
</script>

<style scoped>

</style>