<template>
  <div class="content">
    <h6 class="mb-4 text-center">Account</h6>

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
            v-if="isAccount && account.reference"
            id="i-address"
        >
          <label>Address</label>
          <p class="txt-secondary"> {{account.reference}}#{{ parseInt(account.nonce).toString(16) }}</p>
        </b-form-group>

        <b-form-group
            v-if="!isAccount"
            id="i-address"
        >
          <label>Public key</label>
          <p class="txt-secondary"> {{account.publicKeyBase58}}</p>
        </b-form-group>

        <b-form-group
            id="i-reference"
            label="Address of account"
            label-for="i-reference"
            :invalid-feedback="invalidFeedbackReference"
            :state="stateReference"
            v-if="!isAccount"
        >
          <b-form-input type="text" id="i-reference" v-model="account.reference" :state="stateReference" trim></b-form-input>
        </b-form-group>

        <div v-if="words && words.length > 0">
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
                  :disabled="!stateName || (!this.isAccount && !stateReference)">Save edits
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
import {showErrorToast, showInfoToast, WrapPromiseTask} from "../../internal/utils";
import {AccountHelper, Bip39Dictionary, RemoteNode, StorageReferenceModel} from "hotweb3";
import {replaceRoute} from "../../internal/router";
import {fieldNotEmptyFeedback, stateFieldNotEmpty} from "../../internal/validators";
import VerifyPasswordModal from "./VerifyPasswordModal";

export default {
  name: "Account",
  components: {VerifyPasswordModal},
  props: {
    editAccount: Boolean,
    isAccount: Boolean
  },
  data() {
    return {
      showModal: false,
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
    },
    stateReference() {
      if (this.isAccount) {
        return true
      }
      return stateFieldNotEmpty(this.account.reference)
    },
    invalidFeedbackReference() {
      if (this.isAccount) {
        return null
      }
      return fieldNotEmptyFeedback(this.account.name, 'Please enter the account\'s address')
    }
  },
  methods: {
    onContinueClick() {
      replaceRoute('/home')
    },
    onSaveAccountClick() {
      if (this.isAccount) {
        WrapPromiseTask(() => this.$storageApi.updateAccount(this.account))
            .then(() => replaceRoute("/home"))
            .catch(err => showErrorToast(this, 'Account', err.message ? err.message : 'Cannot update account'))
      } else {
        this.$refs.verifyPasswordComponent.showModal({
          account: this.account,
          title: 'Login',
          subtitle: 'Insert password to verify account',
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
        WrapPromiseTask(async () => {

          try {
            const accountHelper = new AccountHelper(new RemoteNode(this.$network.get()))
            const isVerified = await accountHelper.verifyAccount(StorageReferenceModel.newStorageReference(this.account.reference), this.account.publicKey)

            if (!isVerified) {
              throw new Error()
            }
          } catch (e) {
            throw new Error('Invalid address of account')
          }

          await this.$storageApi.updateAccount(this.account)
        }).then(() => replaceRoute("/home"))
          .catch(err => showErrorToast(this, 'Account', err.message ? err.message : 'Cannot update account'))
      }
    }
  },
  created() {
    WrapPromiseTask(() => this.$storageApi.getCurrentAccount(this.$network.get()))
        .then(account => {
          this.account = account

          if (this.isAccount) {
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
