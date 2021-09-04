<template>
  <div class="navigation-container" v-if="showNavigationContainer">
    <div class="navigation">
      <b-link class="float-left text-primary" v-if="showNavigation" @click="onBackClick">
        <b-icon width="18" icon="arrow-left" variant="primary"></b-icon>
        Back
      </b-link>

      <b-link class="float-right" v-if="isPopup" @click="onExpandAppClick">
        <b-icon width="18" icon="arrows-angle-expand" variant="primary"></b-icon>
      </b-link>
    </div>
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
      showNavigation: false,
      showNavigationContainer: true
    }
  },
  watch: {
    $route(to, from) {
      if (to) {
        this.setNavigationVisibility(to.path)
      }
    }
  },
  methods: {
    setNavigationVisibility(path) {
      this.showNavigation = this.isPathForNavigation(path)
      this.showNavigationContainer = path !== '/' && this.showNavigation
    },
    isPathForNavigation(path) {
      return path !== '/login' && path !== '/home' && path !== '/transaction'
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
    this.setNavigationVisibility(this.$route.path)
  }
}
</script>

<style scoped>

.navigation-container {
  width: 100%;
  border-bottom: 1px solid rgba(186, 239, 233, 0.4);
}

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