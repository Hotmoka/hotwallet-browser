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

        <b-form-group
            id="i-words"
        >
          <label>Words<span class="copy-container"><b-icon width="18" variant="primary" icon="clipboard"
                                                             @click="onCopyContentClick"></b-icon></span></label>

          <div class="row">
            <div class="col-3" v-for="word in accountCreation.words" :key="word">
              <b-badge variant="success">{{ word }}</b-badge>
            </div>
          </div>
        </b-form-group>

        <b-button @click="onCreateAccountClick" variant="primary" :disabled="!statePassword || !stateConfirmPassword || !stateName">Create</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {RemoteNode, AccountHelper, Algorithm} from "hotweb3"
import {getSessionPeriod, EventBus, showInfoToast, showErrorToast} from "../../internal/utils";

export default {
  name: "NewWallet",
  data() {
    return {
      name: null,
      confirmPassword: null,
      password: null,
      accountCreation: {
        words: ["marine", "one", "doctor", "sponsor", "ecology", "about", "concert", "canoe",
          "dinosaur", "embody", "flight", "cheap", "little", "lizard", "space", "north", "nothing", "where", "tomorrow",
          "dress", "pupil", "axis", "spoil", "clap", "coral", "napkin", "style", "nasty", "warm", "ball", "viable", "science",
          "vivid", "arrive", "pony", "hire"]
      }
    }
  },
  computed: {
    stateName() {
      return this.name === null ? null : this.name.length > 0
    },
    statePassword() {
      return this.password === null ? null : this.password.length >= 8
    },
    stateConfirmPassword() {
      return this.confirmPassword === null ? null : (this.confirmPassword.length >= 8 && this.confirmPassword === this.password)
    },
    invalidFeedbackPassword() {
      if (this.password === null) {
        return null
      }
      if (this.password.length > 0) {
        return 'Please enter at least 8 characters'
      }
      return 'Please enter a password'
    },
    invalidFeedbackConfirmPassword() {
      if (this.confirmPassword === null) {
        return null
      }
      return 'The passwords don\'t match'
    },
    invalidFeedbackName() {
      if (this.name === null) {
        return null
      }
      return 'Please enter the account\'s name'
    }
  },
  methods: {
    onCreateAccountClick() {
      const accountHelper = new AccountHelper(new RemoteNode(this.$blockchainConfig.remoteNodeUrl))
      const keyPair = AccountHelper.generateEd25519KeyPair(this.token, this.password)

      EventBus.$emit('showSpinner', true)
      accountHelper.createAccountFromFaucet(Algorithm.ED25519, keyPair.publicKey, "10000000000", "0").then(res => {
        EventBus.$emit('showSpinner', false)

        this.$browser.storage.local.set({
          account: {
            name: this.name,
            address: res.reference,
            entropy: this.token,
            keyPair: keyPair,
            sessionPeriod: getSessionPeriod()
          }
        }).then(() => {
          this.$router.replace('/home')
        })

      }).catch(err => {
        EventBus.$emit('showSpinner', false)
        showErrorToast(this, 'New account', 'Error during account creation')
      })
    },
    onCopyContentClick() {
      navigator.clipboard.writeText(this.token).then(() => {
        showInfoToast(this, 'Info', 'Words copied to clipboard')
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
