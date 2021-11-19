<template>
  <b-modal v-model="modal.showModal" centered :hideHeaderClose="true" :title="modal.title">
    <p class="h-txt">{{ modal.subtitle }}</p>

    <template #modal-footer>
      <b-button @click="onNoClick" variant="secondary">{{ modal.btnNoName }}</b-button>
      <b-button @click="onYesClick" variant="primary">{{ modal.btnYesName }}</b-button>
    </template>

  </b-modal>
</template>

<script>


export default {
  name: "AskForConfirmationModal",
  data() {
    return {
      modal: {
        showModal: false,
        title: '',
        subtitle: '',
        btnYesName: '',
        btnNoName: '',
      }
    }
  },
  methods: {
    showModal(options) {
      this.modal.title = options.title || ''
      this.modal.subtitle = options.subtitle || ''
      this.modal.btnYesName = options.btnYesName || 'Yes'
      this.modal.btnNoName = options.btnNoName || 'No'
      this.modal.showModal = true
    },
    closeModal() {
      this.modal.showModal = false
    },
    onNoClick() {
      this.closeModal()
      this.$emit('onNo')
    },
    onYesClick() {
      this.closeModal()
      this.$emit('onYes')
    }
  }
}
</script>

<style scoped>

</style>