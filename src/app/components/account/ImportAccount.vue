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
                  v-model="accountImporter.words[index]"
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
import {AccountHelper, RemoteNode} from "hotweb3";
import {EventBus, showErrorToast} from "../../internal/utils";
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";

export default {
  name: "ImportWallet",
  data() {
    return {
      password: null,
      name: null,
      accountImporter: {
        words: []
      }
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

      for (let i = 0; i < 36; i++) {
        if (!this.accountImporter.words[i]) {
          showErrorToast(this, 'Account', 'Please enter all 36 words')
          return
        }
      }

      // TODO import account
      /*const remoteNode = new RemoteNode(this.$blockchainConfig.remoteNodeUrl)
      const accountHelper = new AccountHelper(remoteNode)*/
    }
  },
  created() {
    for (let i = 0; i < 36; i++) {
      this.accountImporter.words.push(null)
    }
  }
}
</script>

<style scoped>
.h-cell {
  padding-bottom: 6px;
}
</style>
