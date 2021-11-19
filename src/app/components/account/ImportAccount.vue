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

import {EventBus} from "../../internal/utils";
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";
import {replaceRoute} from "../../internal/router";
import {Service} from "../../internal/Service";

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
      new Service()
        .importAccount(this.name, this.password, this.words)
        .then(() => replaceRoute('/home'))
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
