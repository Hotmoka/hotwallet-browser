<template>
  <div class="content">
    <h6 class="mb-4 text-center">Create key</h6>

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

        <b-form-group
            id="i-c-pwd"
            label="Confirm password"
            label-for="i-c-pwd"
            :invalid-feedback="invalidFeedbackConfirmPassword"
            :state="stateConfirmPassword"
        >
          <b-form-input type="password" id="i-c-pwd" v-model="confirmPassword" :state="stateConfirmPassword" trim></b-form-input>
        </b-form-group>


        <b-button @click="onCreateClick" variant="primary" :disabled="!statePassword || !stateName || !stateConfirmPassword">Create</b-button>
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
import {AccountHelper, Bip39Dictionary} from "hotweb3";
import {replaceRoute} from "../../internal/router";


export default {
  name: "CreateKey",
  data() {
    return {
      password: null,
      confirmPassword: null,
      name: null
    }
  },
  computed: {
    statePassword() {
      return statePassword(this.password)
    },
    stateName() {
      return stateFieldNotEmpty(this.name)
    },
    stateConfirmPassword() {
      return this.confirmPassword === null ? null : (this.confirmPassword.length >= 8 && this.confirmPassword === this.password)
    },
    invalidFeedbackPassword() {
      return invalidPasswordFeedback(this.password)
    },
    invalidFeedbackName() {
      return fieldNotEmptyFeedback(this.name, 'Please enter a name')
    },
    invalidFeedbackConfirmPassword() {
      return fieldNotEmptyFeedback(this.confirmPassword, 'The passwords don\'t match')
    },
  },
  methods: {
    onCreateClick() {

      WrapPromiseTask(async () => {

        // create key
        const account = AccountHelper.createKey(this.password, Bip39Dictionary.ENGLISH)

        // set password for the private store and add account
        await this.$storageApi.setPassword(this.password)
        await this.$storageApi.addAccount(
            {
              name: this.name,
              reference: null,
              nonce: 0,
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
      }).then(() => replaceRoute('/home'))
        .catch(err => showErrorToast(this, 'Create key', err.message ? err.message : 'Error during key creation'))
    }
  }
}
</script>

<style scoped>

</style>