<template>
    <div class="content text-center">
      <h6 class="title">Login</h6>

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

          <b-button @click="onLoginClick" variant="primary" :disabled="!state">Login</b-button>
        </div>
      </div>
    </div>
</template>

<script>
import {AccountHelper, Bip39Dictionary} from "hotweb3";
import {getSessionPeriod, showErrorToast} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import {statePassword, invalidPasswordFeedback} from "../../internal/validators";

export default {
  name: "Login",
  data() {
    return {
      password: null
    }
  },
  computed: {
    state() {
      return statePassword(this.password)
    },
    invalidFeedback() {
      return invalidPasswordFeedback(this.password)
    },
  },
  methods: {
    onLoginClick() {
      this.$browser.getFromStorage('account').then(account => {
        if (account) {
          const keyPair = AccountHelper.generateEd25519KeyPairFrom(this.password, Bip39Dictionary.ENGLISH, account.entropy)

          if (keyPair.publicKey === account.publicKey) {
            account.sessionPeriod = getSessionPeriod()
            this.$browser.setToStorage({
              account: {
                ...account
              }
            }).then(() => replaceRoute("/home"))
          } else {
            showErrorToast(this, 'Login', 'Wrong password')
          }
        } else {
          showErrorToast(this, 'Login', 'Cannot retrieve account')
        }
      })
    }
  }
}
</script>

<style scoped>
.title {
  margin-top: 4rem;
  margin-bottom: 2rem;
}
</style>
