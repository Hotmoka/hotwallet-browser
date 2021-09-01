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

        <div class="navigation">
          <b-link class="float-left text-primary" v-if="canShowNavigation" @click="onBackClick">
            <b-icon width="18" icon="arrow-left" variant="primary"></b-icon>
            Indietro
          </b-link>

          <b-link class="float-right" v-if="isPopup" @click="onExpandAppClick">
            <b-icon width="18" icon="arrows-angle-expand" variant="primary"></b-icon>
          </b-link>
        </div>

        <div class="header">
          <img src="../assets/img/hotmoka_logo.png" height="32" width="32" alt="hotmoka">
          <h5 class="title">Hotwallet</h5>
        </div>

        <router-view></router-view>
      </div>
    </div>
  </b-overlay>
</template>

<script>

import {EventBus} from "../internal/utils";

export default {
  name: "App",
  props: {
    appType: String
  },
  data() {
    return {
      showSpinner: false,
      showNavigation: false
    }
  },
  computed: {
    isPopup() {
      return this.appType === 'popup'
    },
    canShowNavigation() {
      return this.showNavigation
    }
  },
  watch: {
    $route(to, from) {
      this.showNavigation = to && this.isPathForNavigation(to.path)
    }
  },
  methods: {
    isPathForNavigation(path) {
      return path && path !== '/' && path !== '/login' && path !== '/home' && path !== '/transaction'
    },
    onExpandAppClick() {
      this.$browser.tabs.create({
        url: this.$browser.runtime.getURL("app/index.html")
      });
    },
    onBackClick() {
      this.$router.go(-1)
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
        this.showNavigation = this.isPathForNavigation(this.$router.history.current.path)
      }
    }).catch(() => this.showNavigation = this.isPathForNavigation(this.$router.history.current.path))
  }
};
</script>
<style lang="scss">

#app-content {
  height: 100%;
  overflow: hidden !important;
}

.popup {
  margin-top: 1rem;
}

.card {
  margin-top: 3rem;
  padding: 1rem 1.2rem 2rem 1.2rem;
}

.form-container, .form-container button {
  width: 100% !important;
}

.navigation {
  width: 100%;
  height: 30px;
  margin-bottom: 12px;
}

.navigation a:hover {
  text-decoration: none !important;
}

.navigation a:hover > svg {
  color: darkblue !important;
}

.header {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 2rem;
}

.title {
  margin-left: 6px;
  margin-bottom: 0;
}

@media only screen and (max-width: 768px) {
  .container {
    width: 100% !important;
  }
}

@media only screen and (min-width: 769px) {
  .container {
    width: 600px !important;
  }
}

</style>
