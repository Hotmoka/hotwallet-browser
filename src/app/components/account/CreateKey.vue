<template>
  <div class="content">

    <p class="h-txt">Here you can create a key. Once you (or somebody else) pay to that key, it will become an account,
      that you can control through the password specified below
    </p>

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
            :invalid-feedback="invalidFeedbackPassword"
            :state="statePassword"
        >
          <label for="i-pwd">Password  <b-icon id="i-pwd-help" width="18" icon="question-circle-fill" variant="info"></b-icon></label>
          <b-form-input type="password" id="i-pwd" v-model="password" :state="statePassword" trim></b-form-input>

          <b-tooltip target="i-pwd-help" triggers="hover">
            Keep note of the password, since there is no way to recover it later
          </b-tooltip>
        </b-form-group>

        <b-form-group
            id="i-c-pwd"
            label="Confirm password"
            label-for="i-c-pwd"
            :invalid-feedback="invalidFeedbackConfirmPassword"
            :state="stateConfirmPassword"
        >
          <b-form-input type="password" id="i-c-pwd" v-model="confirmPassword" :state="stateConfirmPassword" trim></b-form-input>
        </b-form-group>


        <b-button @click="onCreateClick" variant="primary" :disabled="!statePassword || !stateName || !stateConfirmPassword">Create</b-button>
      </div>
    </div>

  </div>
</template>

<script>
import {
  fieldNotEmptyFeedback,
  invalidPasswordFeedback,
  stateFieldNotEmpty,
  statePassword
} from "../../internal/validators";
import {EventBus, showErrorToast} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import {Service} from "../../internal/Service";

export default {
  name: "CreateKey",
  data() {
    return {
      password: null,
      confirmPassword: null,
      name: null
    }
  },
  computed: {
    statePassword() {
      return statePassword(this.password)
    },
    stateName() {
      return stateFieldNotEmpty(this.name)
    },
    stateConfirmPassword() {
      return this.confirmPassword === null ? null : (this.confirmPassword.length >= 8 && this.confirmPassword === this.password)
    },
    invalidFeedbackPassword() {
      return invalidPasswordFeedback(this.password)
    },
    invalidFeedbackName() {
      return fieldNotEmptyFeedback(this.name, 'Please enter a name')
    },
    invalidFeedbackConfirmPassword() {
      return fieldNotEmptyFeedback(this.confirmPassword, 'The passwords don\'t match')
    },
  },
  methods: {
    onCreateClick() {
      new Service()
          .createKey(this.name, this.password)
          .then(() => replaceRoute('/home'))
          .catch(err => showErrorToast(this, 'Create key', err.message || 'Error during key creation'))
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Create key')
  }
}
</script>

<style scoped>

</style>