<template>
    <div class="content text-center">
      <img src="../../assets/img/logo-web-transparent.png" height="128" width="400" alt="hotmoka" id="logo-hotmoka">

      <h5 class="title" v-if="account && account.name">Welcome back <br/><span class="text-secondary">{{account.name}}</span></h5>

      <div class="d-flex justify-content-center">
        <div class="text-left form-container">
          <b-form-group
              id="i-pwd"
              label="Password"
              label-for="i-pwd"
              :invalid-feedback="invalidFeedback"
              :state="state"
          >
            <b-form-input type="password" id="i-pwd" v-model="password" :state="state" @keydown.enter.native="onLoginClick" trim></b-form-input>
          </b-form-group>

          <b-button @click="onLoginClick" variant="primary" :disabled="!state">Login</b-button>
        </div>
      </div>
    </div>
</template>

<script>
import {AccountHelper, Bip39Dictionary} from "hotweb3";
import {showErrorToast, WrapPromiseTask} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import {statePassword, invalidPasswordFeedback} from "../../internal/validators";

export default {
  name: "Login",
  data() {
    return {
      password: null,
      account: null
    }
  },
  computed: {
    state() {
      return statePassword(this.password)
    },
    invalidFeedback() {
      return invalidPasswordFeedback(this.password)
    }
  },
  methods: {
    onLoginClick() {
      if (!this.state) {
        return
      }

      WrapPromiseTask(async () => {

        // set password and init store
        await this.$storageApi.setPassword(this.password)
        await this.$storageApi.initPrivateStore()
        const account = await this.$storageApi.getCurrentAccount(this.$network.get())

        // verify public key
        const publicKeyVerified = AccountHelper.verifyPublicKey(
            this.password,
            account.entropy,
            Bip39Dictionary.ENGLISH,
            account.publicKey
        )

        if (publicKeyVerified) {
          await this.$storageApi.setAccountAuth(account, true)
        } else {
          throw new Error('Wrong password')
        }

      }).then(() => replaceRoute('/home'))
        .catch(error => showErrorToast(this, 'Login', error.message || 'Error during login'))
    },
    getCurrentAccountName() {
      WrapPromiseTask(async () => {

        const account = await this.$storageApi.getStore('account')
        if (!account) {
          throw new Error('Cannot retrieve account')
        }
        return account
      }).then(account => this.account = account)
        .catch(error => showErrorToast(this, 'Login', error.message || 'Cannot retrieve account'))
    }
  },
  created() {
    this.getCurrentAccountName()
  }
}
</script>

<style scoped>
.title {
  margin-top: 4rem;
  margin-bottom: 2rem;
}

#logo-hotmoka {
  margin-top: 1.5rem;
}

@media only screen and (max-width: 768px) {
  #logo-hotmoka {
    width: 246px;
    height: 76px;
  }
}
</style>
