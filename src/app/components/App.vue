<template>
  <b-overlay
      id="overlay-background"
      :show="showSpinner"
      :variant="'white'"
      :opacity="0.80"
  >
    <template #overlay>
      <div class="d-flex justify-content-center mb-3">
        <b-spinner label="Loading..." variant="primary" style="width: 3rem; height: 3rem;"></b-spinner>
      </div>
    </template>

    <div class="container">
      <div :class="isPopup ? '' : 'card'">
        <Header/>
        <Navigation :isPopup="isPopup"/>
        <router-view></router-view>
      </div>
    </div>
  </b-overlay>
</template>

<script>

import {EventBus} from "../internal/utils";
import Header from "./Header"
import Navigation from "./Navigation";

export default {
  name: "App",
  components: {
    Header,
    Navigation
  },
  props: {
    appType: String
  },
  data() {
    return {
      showSpinner: false
    }
  },
  computed: {
    isPopup() {
      return this.appType === 'popup'
    }
  },
  created() {
    EventBus.$on('showSpinner', show => this.showSpinner = show)

    // check if from transaction
    if (this.$route.redirectedFrom && this.$route.redirectedFrom.indexOf('/transaction') !== -1) {
      const uuid = this.$route.redirectedFrom.split(":")[1]
      this.$router.replace({ name: 'transaction', params: { uuid: uuid }})
      return
    }

    // check if logged
    this.$browser.storage.local.get('account').then(result => {
      if (result && result.account) {
        if (result.account.sessionPeriod && new Date() > new Date(result.account.sessionPeriod)) {
          this.$router.replace('/login')
        } else {
          this.$router.replace('/home')
        }
      } else {
        console.error('No account found')
      }
    }).catch(err => console.error(err))
  }
};
</script>
<style lang="scss">
$theme-colors: (
    "primary": #00BEBA
);
@import "~bootstrap/scss/bootstrap.scss";
@import '~bootstrap-vue/dist/bootstrap-vue.css';

#app-content {
  height: 100%;
  overflow: hidden !important;
}

.card {
  height: 100%;
}

.content {
  height: 100vh;
  overflow-y: auto;
  padding: 1rem
}

.form-container, .form-container button {
  width: 100% !important;
}

@media only screen and (max-width: 768px) {
  .content {
    max-height: 488px;
  }

  .container {
    height: 100vh;
    width: 100% !important;
    padding: 0
  }
}

@media only screen and (min-width: 769px) {
  .container {
    width: 600px !important;
    height: 100vh;
    padding-bottom: 2.5rem;
    padding-top: 2.5rem;
  }
}

</style>
