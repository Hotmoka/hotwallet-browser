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
            :invalid-feedback="fieldNotEmptyFeedback(name, 'Please enter a name')"
            :state="stateFieldNotEmpty(name)"
        >
          <b-form-input type="text" id="i-name" v-model="name" :state="stateFieldNotEmpty(name)" trim></b-form-input>
        </b-form-group>

        <b-form-group
            :invalid-feedback="fieldNotEmptyFeedback(password, 'Please enter a password')"
            :state="stateFieldNotEmpty(password)"
        >
          <label for="i-pwd">Password  <b-icon id="i-pwd-help" width="18" icon="question-circle-fill" variant="info"></b-icon></label>
          <b-form-input type="password" id="i-pwd" v-model="password" :state="stateFieldNotEmpty(password)" trim></b-form-input>

          <b-tooltip target="i-pwd-help" triggers="hover">
            Keep note of the password, since there is no way to recover it later
          </b-tooltip>
        </b-form-group>

        <b-form-group
            id="i-c-pwd"
            label="Confirm password"
            label-for="i-c-pwd"
            :invalid-feedback="fieldNotEmptyFeedback(confirmPassword, 'The passwords don\'t match')"
            :state="stateEqualFields(confirmPassword, password)"
        >
          <b-form-input type="password" id="i-c-pwd" v-model="confirmPassword" :state="stateEqualFields(confirmPassword, password)" trim></b-form-input>
        </b-form-group>


        <b-button @click="onCreateClick" variant="primary" :disabled="stateFormDisabled">Create</b-button>
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
  name: "CreateKey",
  mixins: [validator],
  data() {
    return {
      password: null,
      confirmPassword: null,
      name: null
    }
  },
  computed: {
    stateFormDisabled() {
      return !this.stateFieldNotEmpty(this.password) ||
          !this.stateEqualFields(this.confirmPassword, this.password) ||
          !this.stateFieldNotEmpty(this.name)
    }
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