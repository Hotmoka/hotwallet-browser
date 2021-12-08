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
      <div :class="isPopup ? 'popup' : 'card'" v-if="isBrowserAllowed">
        <Header/>
        <Navigation :isPopup="isPopup"/>
        <router-view v-if="showView"></router-view>
      </div>
      <div class="browser-not-supported" v-if="!isBrowserAllowed">
        Browser not supported <br/>
        Please use <strong>Chrome</strong> or <strong>Firefox</strong>
      </div>
    </div>
  </b-overlay>
</template>

<script>

import {EventBus, isBrowserAllowed, showErrorToast, WrapPromiseTask} from "../internal/utils";
import Header from "./header/Header"
import Navigation from "./header/Navigation";

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
      showSpinner: false,
      showView: false,
      isBrowserAllowed: false
    }
  },
  computed: {
    isPopup() {
      return this.appType === 'popup'
    }
  },
  created() {
    this.isBrowserAllowed = isBrowserAllowed()
    EventBus.$on('showSpinner', show => this.showSpinner = show)

    WrapPromiseTask(() => this.$network.init())
        .then(() => {
          this.showView = true
        })
        .catch(() => showErrorToast(this, 'Error', 'An error occurred'))
  }
};
</script>
<style lang="scss">
@import '../assets/scss/variables';

#app-content {
  height: 100%;
  overflow: hidden !important;
}

.card {
  height: 100%;
}

.popup {
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

.txt-secondary {
  color: theme-color('secondary');
  margin-bottom: 0;
  word-break: break-word;
}

.h-txt {
  word-break: break-word;
}

.address-txt {
  cursor: pointer;
}

.b-popover .popover-body {
  padding: 0 !important;
}

.b-popover {
  width: 200px;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
}

.browser-not-supported {
  text-align: center;
  margin-top: 50%;
}

#logo-hotmoka {
  margin-top: 1.5rem;
}

@media only screen and (max-width: 768px) {
  #logo-hotmoka {
    width: 236px;
    height: 76px;
  }
}

@media only screen and (max-width: 768px) {
  .content {
    max-height: 540px;
    padding-bottom: 76px;
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
    padding-bottom: 1.5rem;
    padding-top: 1.5rem;
  }
}

</style>
