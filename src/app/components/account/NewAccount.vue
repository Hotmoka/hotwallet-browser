<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">New account</h6>

    <div class="d-flex justify-content-center">
      <div class="text-left form-container">
        <b-form-group
            id="i-name"
            label="Nome"
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
            :invalid-feedback="invalidFeedback"
            :state="state"
        >
          <b-form-input type="password" id="i-pwd" v-model="password" :state="state" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-c-pwd"
            label="Conferma password"
            label-for="i-c-pwd"
            :invalid-feedback="invalidFeedbackConfirmPassword"
            :state="stateConfirmPassword"
        >
          <b-form-input type="password" id="i-c-pwd" v-model="confirmPassword" :state="stateConfirmPassword" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-token"
            label="Token"
            label-for="i-token"
        >
          <span class="copy-container"><b-icon width="18" variant="primary" icon="clipboard" @click="onCopyContentClick"></b-icon></span>
          <b-form-textarea no-auto-shrink no-resize style="padding-right: 28px" disabled type="text" id="i-token" v-model="token" trim></b-form-textarea>
        </b-form-group>

        <b-button @click="onCreateAccountClick" variant="primary" :disabled="!state || !stateConfirmPassword || !stateName">Crea</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {RemoteNode, AccountHelper, Algorithm} from "hotweb3"
import {getSessionPeriod, EventBus} from "../../internal/utils";

export default {
  name: "NewWallet",
  data() {
    return {
      name: null,
      confirmPassword: null,
      password: null,
      token: null
    }
  },
  computed: {
    stateName() {
      return this.name === null ? null : this.name.length > 0
    },
    state() {
      return this.password === null ? null : this.password.length >= 8
    },
    stateConfirmPassword() {
      return this.confirmPassword === null ? null : (this.confirmPassword.length >= 8 && this.confirmPassword === this.password)
    },
    invalidFeedback() {
      if (this.password === null) {
        return null
      }
      if (this.password.length > 0) {
        return 'Si prega di inserire almeno 8 caratteri'
      }
      return 'Si prega di inserire una password'
    },
    invalidFeedbackConfirmPassword() {
      if (this.confirmPassword === null) {
        return null
      }
      return 'Le password non corrispondono'
    },
    invalidFeedbackName() {
      if (this.name === null) {
        return null
      }
      return "Si prega di inserire il nome dell'account"
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
        this.$bvToast.toast("Errore durante la creazione dell'account", {
          title: 'Nuovo Account',
          autoHideDelay: 5000,
          variant: 'danger',
          solid: true
        })
      })
    },
    onCopyContentClick() {
      navigator.clipboard.writeText(this.token).then(() => {
        this.$bvToast.toast("Token copiato", {
          title: 'Token',
          autoHideDelay: 1500,
          variant: 'info',
          solid: true
        })
      })
    }
  },
  created() {
    this.token = AccountHelper.generateEntropy()
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  position: absolute;
  right: 0;
  margin-right: 25px;
  margin-top: 20px;
}

textarea {
  overflow: hidden;
}
</style>
