<template>
  <div class="content text-center">
    <div class="center">
      <h6 class="title">Are you new to Hotwallet ?</h6>

      <b-button @click="onNewAccountClick" variant="outline-primary mt-3">Create account</b-button>
      <p class="mt-3">or</p>
      <b-button @click="onImportAccountClick" variant="outline-primary">Import account</b-button>
    </div>

  </div>
</template>

<script>

export default {
  name: "Introduction",
  methods: {
    onNewAccountClick() {
      this.$router.push('/new-account')
    },
    onImportAccountClick() {
      this.$router.push('/import-account')
    }
  }
};
</script>

<style lang="scss" scoped>
.center {
  position: absolute;
  top: 40%;
  left: 50%;
  -ms-transform: translateX(-50%) translateY(-50%);
  -webkit-transform: translate(-50%,-50%);
  transform: translate(-50%,-50%);
}

.title {
  margin-top: 4rem;
  margin-bottom: 4rem;
}
</style>
