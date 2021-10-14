<template>
  <div class="content">

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

        <b-form-group>
          <label>Words  <b-icon id="i-words-help" width="18" icon="question-circle-fill" variant="info"></b-icon></label>
          <b-tooltip target="i-words-help" triggers="hover">
            Insert the 36 words that have been provided at time of creation of the account, in their sequential order
          </b-tooltip>

          <div class="row">
            <div class="h-cell col-4" v-for="index in 36" :key="index">
              <b-form-input
                  :id="'i-words-' + index"
                  :placeholder="'word ' + index"
                  v-model="words[index - 1]"
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
import {AccountHelper, Bip39Dictionary, RemoteNode} from "hotweb3";
import {EventBus, showErrorToast, storageReferenceToString, WrapPromiseTask} from "../../internal/utils";
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";
import {replaceRoute} from "../../internal/router";

export default {
  name: "ImportAccount",
  data() {
    return {
      password: null,
      name: null,
      words: []
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
      WrapPromiseTask(async () => {

        for (let i = 0; i < 36; i++) {
          if (!this.words[i]) {
            throw new Error('Please enter all 36 words')
          }
        }

        // generate account from mnemonic
        const mnemonic = this.words.join(' ')
        const account = await new AccountHelper(new RemoteNode(this.$network.get().url)).importAccount(this.name, mnemonic, Bip39Dictionary.ENGLISH, this.password)

        // set password and add account
        await this.$storageApi.setPassword(this.password)
        await this.$storageApi.addAccount(
            {
              name: this.name,
              reference: storageReferenceToString(account.reference),
              entropy: account.entropy,
              publicKey: account.publicKey,
              balance: account.balance,
              selected: true,
              logged: true,
              network: {value: this.$network.get().value, url: this.$network.get().url},
              created: new Date().getTime()
            }
        )

      }).then(() => replaceRoute('/home'))
        .catch(error => showErrorToast(this, 'Import account', error.message || 'Cannot import account'))

    }
  },
  created() {
    EventBus.$emit('titleChange', 'Import account')

    for (let i = 0; i < 36; i++) {
      this.words.push(null)
    }
  }
}
</script>

<style scoped>
.h-cell {
  padding-bottom: 6px;
}
</style>
