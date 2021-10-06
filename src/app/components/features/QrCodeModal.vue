<template>
  <b-modal v-model="modal.showModal" centered :hideHeaderClose="true" :title="modal.title">
    <p class="h-txt">{{ modal.subtitle }}</p>

    <div class="qr-code-container" v-if="qrCodeImage">
      <img :src="qrCodeImage" alt="qrcode">
    </div>

    <template #modal-footer>
      <b-button @click="onCloseClick" variant="primary">Close</b-button>
    </template>

  </b-modal>
</template>

<script>

import * as Qrious from 'qrious'

export default {
  name: "QrCodeModal",
  data() {
    return {
      modal: {
        showModal: false,
        title: 'QrCode',
        subtitle: 'Scan the qrcode below'
      },
      qrCodeImage: null,
      showError: false
    }
  },
  methods: {
    generateQrCode(props) {
      this.modal.title = props.title || this.modal.title
      this.modal.subtitle = props.subtitle || this.modal.subtitle
      this.modal.showModal = true

      try {
        this.qrCodeImage = new Qrious({
          value: props.value
        }).toDataURL();
      } catch (e) {
        this.showError = true
      }
    },
    onCloseClick() {
      this.modal.showModal = false
      this.qrCodeImage = null
      this.showError = false
    }
  }
}
</script>

<style scoped>
.qr-code-container {
  text-align: center;
}

.qr-code-container img {
  height: 170px;
}

</style>