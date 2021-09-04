<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">Import account</h6>

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
            id="i-token"
            label="Token"
            label-for="i-token"
            :invalid-feedback="invalidFeedbackToken"
            :state="stateToken"
        >
          <b-form-textarea no-resize no-auto-shrink max-rows="2" rows="2" type="text" id="i-token" v-model="token" :state="stateToken" trim></b-form-textarea>
        </b-form-group>

        <b-button @click="onImportAccountClick" variant="primary" :disabled="!state || !stateToken || !stateName">Importa</b-button>
      </div>
    </div>
  </div>
</template>

<script>
import {AccountHelper, Algorithm, RemoteNode} from "hotweb3";
import {EventBus, getSessionPeriod} from "../../internal/utils";

export default {
  name: "ImportWallet",
  data() {
    return {
      password: null,
      token: null,
      name: null
    }
  },
  computed: {
    state() {
      return this.password === null ? null : this.password.length >= 8
    },
    stateToken() {
      return this.token === null ? null : this.token.length > 0
    },
    stateName() {
      return this.name === null ? null : this.name.length > 0
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
    invalidFeedbackToken() {
      if (this.token === null) {
        return null
      }
      return 'Si prega di inserire il token'
    },
    invalidFeedbackName() {
      if (this.name === null) {
        return null
      }
      return "Si prega di inserire il nome dell'account"
    }
  },
  methods: {
    onImportAccountClick() {
      const remoteNode = new RemoteNode(this.$blockchainConfig.remoteNodeUrl)
      const accountHelper = new AccountHelper(remoteNode)


      // TODO verify if the account exist in blockchain
    }
  }
}
</script>

<style scoped>

</style>
