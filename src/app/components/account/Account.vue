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
          <b-form-input type="text" id="i-name" v-model="account.name" :state="stateName" trim></b-form-input>
        </b-form-group>

        <p> {{account.storageReference.transaction.hash}}</p>

        <div v-if="account.words">
          <label>Words<span class="copy-container"><b-icon width="18" variant="primary" icon="clipboard"
                                                           @click="onCopyContentClick"></b-icon></span></label>

          <div class="row">
            <div class="col-3" v-for="word in account.words" :key="word">
              <b-badge variant="success">{{ word }}</b-badge>
            </div>
          </div>

        </div>

        <b-button @click="onSaveAccountClick" variant="primary"
                  :disabled="!stateName">Save edits
        </b-button>

      </div>
    </div>
  </div>
</template>

<script>
import {showErrorToast, showInfoToast} from "../../internal/utils";
import {AccountHelper, Bip39Dictionary} from "hotweb3";

export default {
  name: "Account",
  data() {
    return {
      account: null
    }
  },
  computed: {
    stateName() {
      return this.account.name === null ? null : this.account.name.length > 0
    },
    invalidFeedbackName() {
      if (this.account.name === null) {
        return null
      }
      return 'Please enter the account\'s name'
    }
  },
  methods: {
    onSaveAccountClick() {
      // TODO
    },
    onCopyContentClick() {
      navigator.clipboard.writeText(this.token).then(() => {
        showInfoToast(this, 'Info', 'Words copied to clipboard')
      })
    }
  },
  created() {
    this.$browser.getFromStorage('account', account => {
      if (!account) {
        showErrorToast(this, 'Account', 'Cannot retrieve account')
      } else {
        this.account = account
        this.account.words = AccountHelper.generateMnemonicWordsFrom(account.entropy, account.storageReference.transaction.hash, Bip39Dictionary.ENGLISH)
      }
    })
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
