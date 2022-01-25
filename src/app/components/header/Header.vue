<template>
  <div class="header">
    <div class="d-flex align-items-center">
      <img src="../../assets/img/hotmoka_logo.png" height="32" width="32" alt="hotmoka" @click="onHeaderImageClick">
      <h6 class="hotwallet-title text-secondary">Hotwallet</h6>
    </div>

    <div class="w-100 text-right" v-if="showNetwork && currentNetwork">
      <div class="network-badge text-secondary"><b-icon icon="globe" variant="info"></b-icon> {{ currentNetwork.text }}</div>
    </div>

  </div>
</template>

<script>
import {EventBus, showErrorToast} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";
import CustomNetworkModal from "../features/CustomNetworkModal";

export default {
  name: "Header",
  components: {CustomNetworkModal},
  data() {
    return {
      showNetwork: true,
      currentNetwork: null
    }
  },
  watch: {
    $route(to, from) {
      if (to && to.path) {
        this.showNetwork = to.path !== '/create-key' && to.path !== '/import-account'
      }
    }
  },
  methods: {
    onHeaderImageClick() {
      if (this.$route.path.indexOf('/transaction') !== -1) {
        return
      }

      if (this.$route.path === '/home') {
        EventBus.$emit('reloadAccount')
      } else {
        replaceRoute('/home')
      }
    },
    initNetwork: async function () {
      try {
        this.currentNetwork = await this.$storageApi.getCurrentNetwork()
      } catch (e) {
        showErrorToast(this, 'Network', 'Network error')
      }
    }
  },
  created() {
    this.showNetwork = this.$route.path !== '/create-key' && this.$route.path !== '/import-account'
    EventBus.$on('networkChange', network => this.currentNetwork = network)
    this.initNetwork()
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/variables';

.header {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(186, 239, 233, 0.2);
  padding: 1rem
}

.header img {
  margin-right: 12px;
  cursor: pointer;
}

.network-badge {
  display: inline-block;
  padding: 8px 12px;
  border: 1px solid theme-color('info');
  background-color: #fff;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
  height: 42px;
  max-width: 260px;
}

.hotwallet-title {
  margin-right: 12px;
  margin-bottom: 2px;
}

</style>