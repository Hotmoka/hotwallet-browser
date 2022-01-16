<template>
  <div class="content">

    <div class="d-flex justify-content-center" v-if="account">
      <div class="text-left form-container">
        <b-form-group
            id="i-name"
            label="Name"
            label-for="i-name"
            :invalid-feedback="fieldNotEmptyFeedback(account.name, 'Please enter the account\'s name')"
            :state="stateFieldNotEmpty(account.name)"
        >
          <b-form-input v-if="editAccount" type="text" id="i-name" v-model="account.name" :state="stateFieldNotEmpty(account.name)" :disabled="!editAccount" trim></b-form-input>
          <p v-if="!editAccount" class="txt-secondary">{{account.name}}</p>
        </b-form-group>

        <b-form-group
            v-if="isAccount"
            id="i-address"
        >
          <label>Address</label>
          <p class="txt-secondary address-txt" @click="copyToClipboard(account.reference)">{{ account.reference }}</p>
        </b-form-group>

        <b-form-group
            v-if="!isAccount"
            id="i-address"
        >
          <label>Public key</label>
          <p class="txt-secondary address-txt" @click="copyToClipboard(account.publicKeyBase58)"> {{account.publicKeyBase58}}</p>
        </b-form-group>

        <b-form-group
            :invalid-feedback="invalidFeedbackReference"
            :state="stateReference"
            v-if="!isAccount"
        >
          <label for="i-reference">Address of account  <b-icon id="i-reference-help" width="18" icon="question-circle-fill" variant="info"></b-icon></label>
          <b-form-input type="text" id="i-reference" v-model="account.reference" :state="stateReference" trim></b-form-input>

          <b-tooltip target="i-reference-help" triggers="hover">
            You can bind a Hotmoka account address if you (or somebody else) payed to this key
          </b-tooltip>
        </b-form-group>

        <div v-if="words && words.length > 0">
          <label>Words <b-icon id="i-words-help" width="18" icon="question-circle-fill" variant="info"></b-icon>
            <span class="copy-container"><b-icon width="18" variant="primary" icon="clipboard" @click="onCopyContentClick"></b-icon></span>
          </label>

          <b-tooltip target="i-words-help" triggers="hover">
            Please write down on paper the following mnemonic phrase of 36 words, in their sequential order (left to right).
            You will need them if you want to (re)install the account in this or another application.
            If you delete the account and lose these words, you will lose access to this account for ever!
          </b-tooltip>

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
                  :disabled="stateFormDisabled">Save edits
        </b-button>

        <b-button v-if="!editAccount"
                  @click="onContinueClick"
                  variant="primary"
                  style="margin-top: 1.5rem;">Continue
        </b-button>

      </div>
    </div>

    <VerifyPasswordModal ref="verifyPasswordComponent" @onPasswordVerified="onPasswordVerified"></VerifyPasswordModal>

  </div>
</template>

<script>
import {
  EventBus,
  getHashOfStorageReference,
  showErrorToast,
  showInfoToast,
  WrapPromiseTask
} from "../../internal/utils";
import {AccountHelper, Bip39Dictionary} from "hotweb3";
import {replaceRoute} from "../../internal/router";
import VerifyPasswordModal from "../features/VerifyPasswordModal";
import {Service} from "../../internal/Service";
import {accountUtils, validator} from "../../internal/mixins";

export default {
  name: "Account",
  mixins: [accountUtils, validator],
  components: {VerifyPasswordModal},
  props: {
    editAccount: Boolean
  },
  data() {
    return {
      showModal: false,
      account: null,
      isAccount: true,
      words: []
    }
  },
  computed: {
    stateFormDisabled() {
      return !this.stateFieldNotEmpty(this.account.name) || (!this.isAccount && !this.stateReference)
    },
    stateReference() {
      if (this.isAccount) {
        return true
      }
      return this.stateFieldNotEmpty(this.account.reference)
    },
    invalidFeedbackReference() {
      if (this.isAccount) {
        return null
      }
      return this.fieldNotEmptyFeedback(this.account.reference, 'Please enter the account\'s address')
    }
  },
  methods: {
    onContinueClick() {
      replaceRoute('/home')
    },
    onSaveAccountClick() {
      if (this.isAccount) {
        WrapPromiseTask(async () => this.$storageApi.updateAccount(this.account))
            .then(() => replaceRoute("/home"))
            .catch(err => showErrorToast(this, 'Account', err.message || 'Cannot update account'))
      } else {
        this.$refs.verifyPasswordComponent.showModal({
          account: this.account,
          title: 'Key verification',
          subtitle: 'Insert password to verify key ' + this.account.publicKeyBase58,
          btnActionName: 'Verify'
        })
      }
    },
    onCopyContentClick() {
      const words = this.words.join(' ')
      navigator.clipboard.writeText(words).then(() => {
        showInfoToast(this, 'Info', 'Words copied to clipboard')
      })
    },
    onPasswordVerified(result) {
      if (result.verified) {
        new Service()
            .verifyAccount(this.account)
            .then(() => replaceRoute("/home"))
            .catch(err => showErrorToast(this, 'Account', err.message || 'Cannot update account'))
      }
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Account')

    new Service()
        .getCurrentAccount()
        .then(account => {
          this.account = account
          this.isAccount = account.reference !== null && account.reference !== undefined

          if (this.isAccount) {
            this.words = AccountHelper.generateMnemonicWordsFrom(account.entropy, getHashOfStorageReference(account.reference), Bip39Dictionary.ENGLISH)
          }
        })
        .catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
  }
}
</script>

<style lang="scss" scoped>
.copy-container {
  margin-left: 8px;
  cursor: pointer;
}
</style>
