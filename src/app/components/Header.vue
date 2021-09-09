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
import {showErrorToast, showInfoToast, WrapPromiseTask} from "../internal/utils";
import {replaceRoute} from "../internal/router";
import {getNetwork, networks} from "../internal/networks";

export default {
  name: "Header",
  data() {
    return {
      selectedNetwork: null,
      networks: [...networks]
    }
  },
  methods: {
    setNetwork() {
      this.$storageApi.getNetwork(this.$network).then(network => {
        this.selectedNetwork = network.value
        this.$network = network
      })
    },
    onNetworkChange(selectedNetwork) {
      if (selectedNetwork === 'customNetwork') {
        showInfoToast(this,'Network', 'Feature not implemented')
        this.selectedNetwork = networks[0].value

      } else {
        const network = getNetwork(selectedNetwork)
        if (!network) {
          showErrorToast(this,'Network', 'Network not found')
        } else {

          WrapPromiseTask(() => this.$storageApi.setNetwork(network))
          .then(result => {
            if (result) {
              this.selectedNetwork = selectedNetwork
              this.$network = network
            } else {
              showErrorToast(this,'Network', 'Cannot set network')
            }
          })
          .catch(() => showErrorToast(this,'Network', 'Cannot set network'))
        }
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