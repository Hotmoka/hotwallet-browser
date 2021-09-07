<template>
  <div class="header">
      <img src="../assets/img/hotmoka_logo.png" height="32" width="32" alt="hotmoka" @click="onHeaderImageClick">
      <h6 class="hotwallet-title text-secondary">Hotwallet</h6>
      <b-form-select
          v-model="selectedNetwork"
          @change="onNetworkChange"
          :options="networks"
          size="sm"
          class="ml-auto h-network"></b-form-select>
  </div>
</template>

<script>
import {showInfoToast} from "../internal/utils";
import {replaceRoute} from "../internal/router";

export default {
  name: "Header",
  data() {
    return {
      selectedNetwork: null,
      networks: [
        { value: 'panarea', text: 'panarea.hotmoka.io', protocol: 'http', network: 'http://panarea.hotmoka.io' },
        { value: 'newNetwork', text: 'Connect to custom network' },
      ]
    }
  },
  methods: {
    setNetwork() {
      this.$browser.getFromStorage('network', network => {
        if (!network) {
          this.selectedNetwork = this.networks[0].value
          this.$browser.setToStorage({
            network: {...this.networks[0]}
          })
        } else {
          this.selectedNetwork = network.value
        }
      })
    },
    onNetworkChange(selectedNetwork) {
      if (selectedNetwork === 'newNetwork') {
        showInfoToast(this,'Network', 'Feature')
        this.selectedNetwork = this.networks[0].value
      }
    },
    onHeaderImageClick() {
      replaceRoute('/home')
    }
  },
  created() {
   this.setNetwork()
  }
}
</script>

<style scoped>

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

.hotwallet-title {
  margin-right: 12px;
  margin-bottom: 2px;
}

</style>