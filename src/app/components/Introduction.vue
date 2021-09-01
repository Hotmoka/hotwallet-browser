<template>
  <div class="text-center">
    <h6 class="mt-4 mb-4">Sei nuovo su Hotwallet ?</h6>

    <b-button @click="onNewWalletClick" variant="outline-primary mt-3">Crea wallet</b-button>
    <p class="mt-3">oppure</p>
    <b-button @click="onImportWalletClick" variant="outline-primary">Importa wallet</b-button>
  </div>
</template>

<script>

export default {
  name: "Introduction",
  methods: {
    onNewWalletClick() {
      this.$router.push('/new-wallet')
    },
    onImportWalletClick() {
      this.$router.push('/import-wallet')
    }
  }
};
</script>

<style lang="scss" scoped>

</style>
