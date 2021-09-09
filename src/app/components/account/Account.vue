<template>
  <div class="content">
    <h6 class="mt-4 mb-4 text-center">Account</h6>

    <div class="d-flex justify-content-center" v-if="account">
      <div class="text-left form-container">
        <b-form-group
            id="i-name"
            label="Name"
            label-for="i-name"
            :invalid-feedback="invalidFeedbackName"
            :state="stateName"
        >
          <b-form-input v-if="editAccount" type="text" id="i-name" v-model="account.name" :state="stateName" :disabled="!editAccount" trim></b-form-input>
          <p v-if="!editAccount" class="txt-secondary">{{account.name}}</p>
        </b-form-group>

        <b-form-group
            v-if="account.reference"
            id="i-address"
        >
          <label>Address</label>
          <p class="txt-secondary"> {{account.reference}}#{{ parseInt(account.nonce).toString(16) }}</p>
        </b-form-group>


        <div v-if="words">
          <label>Words<span class="copy-container"><b-icon width="18" variant="primary" icon="clipboard"
                                                           @click="onCopyContentClick"></b-icon></span></label>

          <div class="row">
            <div class="col-3" v-for="(word,index) in words" :key="'word' + index">
              <b-badge variant="success">{{ word }}</b-badge>
            </div>
          </div>

        </div>

        <b-button v-if="editAccount"
                  @click="onSaveAccountClick"
                  variant="primary"
                  style="margin-top: 1.5rem;"
                  :disabled="!stateName">Save edits
        </b-button>

        <b-button v-if="!editAccount"
                  @click="onContinueClick"
                  variant="primary"
                  style="margin-top: 1.5rem;">Continue
        </b-button>

      </div>
    </div>
  </div>
</template>

<script>
import {showErrorToast, showInfoToast, WrapPromiseTask} from "../../internal/utils";
import {AccountHelper, Bip39Dictionary} from "hotweb3";
import {replaceRoute} from "../../internal/router";
import {fieldNotEmptyFeedback, stateFieldNotEmpty} from "../../internal/validators";

export default {
  name: "Account",
  props: {
    editAccount: Boolean
  },
  data() {
    return {
      account: null,
      words: []
    }
  },
  computed: {
    stateName() {
      return stateFieldNotEmpty(this.account.name)
    },
    invalidFeedbackName() {
      return fieldNotEmptyFeedback(this.account.name, 'Please enter the account\'s name')
    }
  },
  methods: {
    onContinueClick() {
      replaceRoute('/home')
    },
    onSaveAccountClick() {
      this.$storageApi.setToStore({account: this.account}).then(() => replaceRoute("/home"))
    },
    onCopyContentClick() {
      const words = this.words.join(' ')
      navigator.clipboard.writeText(words).then(() => {
        showInfoToast(this, 'Info', 'Words copied to clipboard')
      })
    }
  },
  created() {
    WrapPromiseTask(() => this.$storageApi.getCurrentAccount())
        .then(account => {
          if (!account) {
            showErrorToast(this, 'Account', 'Cannot retrieve account')
          } else {
            this.account = account
            this.words = AccountHelper.generateMnemonicWordsFrom(account.entropy, account.reference, Bip39Dictionary.ENGLISH)
          }
        })
        .catch(() => showErrorToast(this, 'Account', 'Cannot retrieve account'))
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
