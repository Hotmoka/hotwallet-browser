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
      <div :class="isPopup ? 'popup' : 'card'">
        <Header/>
        <Navigation :isPopup="isPopup"/>
        <router-view v-if="showView"></router-view>
      </div>
    </div>
  </b-overlay>
</template>

<script>

import {EventBus, showErrorToast, WrapPromiseTask} from "../internal/utils";
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
      showSpinner: false,
      showView: false
    }
  },
  computed: {
    isPopup() {
      return this.appType === 'popup'
    }
  },
  created() {
    EventBus.$on('showSpinner', show => this.showSpinner = show)

    WrapPromiseTask(() => this.$network.init())
        .then(() => {
          this.showView = true

          // check if from transaction
          if (this.$route.redirectedFrom && this.$route.redirectedFrom.indexOf('/transaction') !== -1) {
            const uuid = this.$route.redirectedFrom.split(":")[1]
            this.$router.replace({name: 'transaction', params: {uuid: uuid}})
          }
        })
        .catch(() => showErrorToast(this, 'Error', 'An error occured'))
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
  word-break: break-all;
}

.b-popover .popover-body {
  padding: 0 !important;
}

.b-popover {
  width: 200px;
  box-shadow: 0 4px 8px 0 rgba(0,0,0,0.2);
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
