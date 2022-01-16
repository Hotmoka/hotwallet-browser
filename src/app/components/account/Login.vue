<template>
    <div class="content text-center">
      <img src="../../assets/img/logo-web-transparent.png" height="128" width="400" alt="hotmoka" id="logo-hotmoka">

      <h5 class="title" v-if="account && account.name">Welcome back <br/><span class="text-secondary">{{account.name}}</span></h5>

      <div class="d-flex justify-content-center">
        <div class="text-left form-container">
          <b-form-group
              id="i-pwd"
              label="Password"
              label-for="i-pwd"
              :invalid-feedback="fieldNotEmptyFeedback(password, 'Please enter a password')"
              :state="stateFieldNotEmpty(password)"
          >
            <b-form-input type="password" id="i-pwd" v-model="password" :state="stateFieldNotEmpty(password)" @keydown.enter.native="onLoginClick" trim></b-form-input>
          </b-form-group>

          <b-button @click="onLoginClick" variant="primary" :disabled="stateFormDisabled">Login</b-button>
        </div>
      </div>
    </div>
</template>

<script>
import {replaceRoute} from "../../internal/router";
import {Service} from "../../internal/Service"
import {showErrorToast} from "../../internal/utils";
import {validator} from "../../internal/mixins";

export default {
  name: "Login",
  mixins: [validator],
  data() {
    return {
      password: null,
      account: null
    }
  },
  computed: {
    stateFormDisabled() {
      return !this.stateFieldNotEmpty(this.password)
    }
  },
  methods: {
    onLoginClick() {
      if (!this.stateFieldNotEmpty(this.password)) {
        return
      }

      new Service()
          .login(this.password)
          .then(() => replaceRoute('/home'))
          .catch(error => showErrorToast(this, 'Login', error.message || 'Error during login'))
    }
  },
  created() {
    new Service()
        .getCurrentPublicAccount()
        .then(account => this.account = account)
        .catch(error => showErrorToast(this, 'Account', error.message || 'Cannot retrieve account'))
  }
}
</script>

<style scoped>
.title {
  margin-top: 4rem;
  margin-bottom: 2rem;
}
</style>
