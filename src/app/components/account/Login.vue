<template>
    <div class="content">
      <h6 class="mt-4 mb-4">Login</h6>

      <div class="d-flex justify-content-center">
        <div class="text-left form-container">
          <b-form-group
              id="i-pwd"
              label="Password"
              label-for="i-pwd"
              :invalid-feedback="invalidFeedback"
              :state="state"
          >
            <b-form-input type="password" id="i-pwd" v-model="password" :state="state" trim></b-form-input>
          </b-form-group>

          <b-button @click="onLoginClick" variant="primary" :disabled="!btnDisabled">Login</b-button>
        </div>
      </div>
    </div>
</template>

<script>
import {AccountHelper} from "hotweb3";
import {getSessionPeriod} from "../../internal/utils";

export default {
  name: "Login",
  data() {
    return {
      errorMessage: null,
      password: null
    }
  },
  computed: {
    state() {
      return this.password === null ? null : (this.password.length >= 8 && this.errorMessage === null)
    },
    btnDisabled() {
      return this.password === null ? null : this.password.length >= 8
    },
    invalidFeedback() {
      if (this.password === null) {
        return null
      }

      if (this.errorMessage) {
        return this.errorMessage
      }

      if (this.password.length > 0) {
        return 'Si prega di inserire almeno 8 caratteri'
      }

      return 'Si prega di inserire la password'
    },
  },
  methods: {
    onLoginClick() {
      this.errorMessage = null
      this.$browser.storage.local.get('account').then(result => {

        if (result && result.account) {
          const {entropy, keyPair} = result.account

          if (!AccountHelper.checkPassword(entropy, this.password, keyPair.publicKey, keyPair.privateKey)) {
            this.errorMessage = 'Password non corretta'
          } else {

            result.account.sessionPeriod = getSessionPeriod()
            this.$browser.storage.local.set({...result}).then(() => {
              this.$router.replace("/home")
            })
          }
        }

      })
    }
  }
}
</script>

<style scoped>

</style>
