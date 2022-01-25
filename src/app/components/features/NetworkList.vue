<template>
  <div class="content">
    <b-list-group v-if="networks" class="mt-4">
      <b-list-group-item
          v-for="(network, index) in networks"
          :active="network.selected"
      >

        <span style="color: #000; word-break: break-word">
            <b-icon width="18" icon="globe"></b-icon>
            {{ network.url }}
        </span>

        <br/>

        <div class="d-flex mt-3 justify-content-end" v-if="!network.selected">
          <b-button variant="danger" size="sm" style="padding: 6px 12px" @click="onRemoveNetworkClick(index)"><b-icon width="18" icon="trash"></b-icon></b-button>
        </div>

      </b-list-group-item>
    </b-list-group>

    <CustomNetworkModal ref="customNetworkModal" />
    <AskForConfirmationModal ref="askForConfirmationComponent" @onYes="removeNetwork" />
  </div>
</template>

<script>
import {EventBus, showErrorToast, showSuccessToast} from "../../internal/utils";
import {validator} from "../../internal/mixins";
import CustomNetworkModal from "./CustomNetworkModal";
import AskForConfirmationModal from "./AskForConfirmationModal";
import {Service} from "../../internal/Service";

export default {
  name: "Network",
  components: {CustomNetworkModal, AskForConfirmationModal},
  mixins: [validator],
  data() {
    return {
      networkToRemove: null,
      networks: []
    }
  },
  methods: {
    onRemoveNetworkClick(index) {
      this.networkToRemove = this.networks[index]
      this.$refs.askForConfirmationComponent.showModal({
        title: 'Remove network',
        subtitle: 'Are you sure you want to remove the ' + this.networkToRemove.text + ' network ?' +
            " All accounts will also be removed."
      })
    },
    removeNetwork() {
      new Service()
          .removeNetwork(this.networkToRemove)
          .then(() => {
            showSuccessToast(this, 'Network', 'Network removed')
            this.setNetworks()
          })
          .catch(() => showErrorToast(this, 'Network', 'An error occurred while removing the network'))
    },
    setNetworks: async function () {
      try {
        const unsortedNetworks = await this.$storageApi.getNetworks()
        this.networks = unsortedNetworks.sort((a, b) => a.selected ? -1 : 1)
      } catch (e) {
        showErrorToast(this, 'Network', 'Cannot load the network list')
      }
    }
  },
  created() {
    EventBus.$emit('titleChange', 'Networks')
    this.setNetworks()
  }
}
</script>

<style scoped>
.list-group-item.active {
  background-color: #eee;
  border: 1px solid rgba(0, 0, 0, 0.125);
}
</style>