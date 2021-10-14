<template>
  <div class="navigation-container" v-if="showNavigationContainer">
    <div class="navigation">

      <div v-if="!showBackNavigation"></div>
      <b-link class="float-left text-primary" v-if="showBackNavigation" @click="onBackClick">
        <b-icon width="18" icon="arrow-left" variant="primary"></b-icon>
        Back
      </b-link>

      <h6 class="text-center" v-if="title">{{ title }}</h6>
      <b-link class="float-right" style="width: 18px;">
        <b-icon width="18" icon="arrows-angle-expand" variant="primary" v-if="isPopup" @click="onExpandAppClick"></b-icon>
      </b-link>
    </div>
  </div>
</template>

<script>
import {EventBus} from "../../internal/utils";

export default {
  name: "Navigation",
  props: {
    isPopup: Boolean
  },
  data() {
    return {
      showBackNavigation: false,
      showNavigationContainer: true,
      title: null
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
      this.showBackNavigation = this.isPathForBackNavigation(path)
      this.showNavigationContainer = this.isPathForNavigation(path)
    },
    isPathForNavigation(path) {
      if (path.indexOf("/transaction") !== -1) {
        return false
      }
      return !['/login', '/home', '/welcome'].includes(path)
    },
    isPathForBackNavigation(path) {
      return this.isPathForNavigation(path) && path !== '/account'
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
    EventBus.$on('titleChange', title => this.title = title)
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
  padding-right: 0.8rem;
  padding-left: 0.8rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navigation h6 {
  margin: 0 0 0 -22px;
  padding: 0;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  max-width: 224px;
}

.navigation a:hover {
  text-decoration: none !important;
}

.navigation a:hover, .navigation a:hover > svg {
  color: darkblue !important;
}

</style>