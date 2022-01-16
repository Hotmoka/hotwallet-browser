<template>
  <div class="content">

    <div class="d-flex justify-content-center">
      <div class="text-left form-container">

        <b-form-group
            id="i-name"
            label="Name"
            label-for="i-name"
            :invalid-feedback="fieldNotEmptyFeedback(name, 'Please enter a name')"
            :state="stateFieldNotEmpty(name)"
        >
          <b-form-input type="text" id="i-name" v-model="name" :state="stateFieldNotEmpty(name)" trim></b-form-input>
        </b-form-group>

        <b-form-group
            id="i-pwd"
            label="Password"
            label-for="i-pwd"
            :invalid-feedback="fieldNotEmptyFeedback(password, 'Please enter a password')"
            :state="stateFieldNotEmpty(password)"
        >
          <b-form-input type="password" id="i-pwd" v-model="password" :state="stateFieldNotEmpty(password)" trim></b-form-input>
        </b-form-group>

        <b-form-group>
          <label>Words  <b-icon id="i-words-help" width="18" icon="question-circle-fill" variant="info"></b-icon></label>
          <b-tooltip target="i-words-help" triggers="hover">
            Insert the 36 words that have been provided at time of creation of the account, in their sequential order.
            You can copy and paste the words in any cell.
          </b-tooltip>

          <div class="row">
            <div class="h-cell col-4" v-for="index in 36" :key="index">
              <b-form-input
                  :id="'i-words-' + index"
                  :placeholder="'word ' + index"
                  v-model="words[index - 1]"
                  @input="onInput"
                  trim
              ></b-form-input>
            </div>
          </div>
        </b-form-group>

        <b-button @click="onImportAccountClick" variant="primary" :disabled="stateFormDisabled">Import</b-button>
      </div>
    </div>
  </div>
</template>

<script>

import {EventBus, showErrorToast} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import {Service} from "../../internal/Service";
import {validator} from "../../internal/mixins";

export default {
  name: "ImportAccount",
  mixins: [validator],
  data() {
    return {
      password: null,
      name: null,
      words: []
    }
  },
  computed: {
    stateFormDisabled() {
      return !this.stateFieldNotEmpty(this.password) ||
          !this.stateFieldNotEmpty(this.name)
    }
  },
  methods: {
    onImportAccountClick() {
      new Service()
          .importAccount(this.name, this.password, this.words)
          .then(() => replaceRoute('/home'))
          .catch(error => showErrorToast(this, 'Import account', error.message || 'Cannot import account'))
    },
    onInput(e) {
      if (e.length > 30) {
        const words = e.split(" ")
        if (words.length === 36) {
          this.words = words
        }
      }
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
