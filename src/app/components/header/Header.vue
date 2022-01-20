<template>
  <div class="header">
      <img src="../../assets/img/hotmoka_logo.png" height="32" width="32" alt="hotmoka" @click="onHeaderImageClick">
      <h6 class="hotwallet-title text-secondary">Hotwallet</h6>

    <div class="w-100 text-right" v-if="currentNetwork">
      <div class="network-badge text-secondary"><b-icon icon="globe" variant="info"></b-icon> {{ currentNetwork.text }}</div>
    </div>

  </div>
</template>

<script>
import {EventBus, showErrorToast} from "../../internal/utils";
import {replaceRoute} from "../../internal/router";

export default {
  name: "Header",
  data() {
    return {
      currentNetwork: null
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
    setCurrentNetwork: async function () {
      try {
        this.currentNetwork = await this.$storageApi.getCurrentNetwork()
        this.$network.set(this.currentNetwork)
      } catch (e) {
        showErrorToast(this, 'Network', 'Network error')
      }
    }
  },
  created() {
    EventBus.$on('networkChange', network => this.currentNetwork = network)
    this.setCurrentNetwork()
  }
}
</script>

<style lang="scss" scoped>
@import '../../assets/scss/variables';

.header {
  height: 62px;
  display: flex;
  align-items: center;
  background-color: rgba(186, 239, 233, 0.2);
  padding: 1rem
}

.header img {
  margin-right: 12px;
  cursor: pointer;
}

.h-network {
  width: auto !important;
}

.network-badge {
  display: inline-block;
  padding: 8px 12px;
  border: 1px solid theme-color('info');
  background-color: #fff;
  color: black;
  border-radius: 100px;
  font-size: 14px;
  font-weight: 500;
}

.hotwallet-title {
  margin-right: 12px;
  margin-bottom: 2px;
}

</style>