<template>
  <div class="navigation">
    <b-link class="float-left text-primary" v-if="canShowNavigation" @click="onBackClick">
      <b-icon width="18" icon="arrow-left" variant="primary"></b-icon>
      Back
    </b-link>

    <b-link class="float-right" v-if="isPopup" @click="onExpandAppClick">
      <b-icon width="18" icon="arrows-angle-expand" variant="primary"></b-icon>
    </b-link>
  </div>
</template>

<script>
export default {
  name: "Navigation",
  props: {
    isPopup: Boolean
  },
  data() {
    return {
      showNavigation: false
    }
  },
  watch: {
    $route(to, from) {
      this.showNavigation = to && this.isPathForNavigation(to.path)
    }
  },
  computed: {
    canShowNavigation() {
      return this.showNavigation
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
}
</script>

<style scoped>

.navigation {
  width: 100%;
  height: 50px;
  padding-top: 0.8rem;
  padding-right: 1rem;
  padding-left: 1rem;
}

.navigation a:hover {
  text-decoration: none !important;
}

.navigation a:hover > svg {
  color: darkblue !important;
}
</style>