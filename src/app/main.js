import Vue from 'vue'
import PortalVue from 'portal-vue'
import {BootstrapVue, IconsPlugin} from "bootstrap-vue";
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import VueRouter from 'vue-router'
import App from './components/App'
import {router} from "./internal/router";
import {StorageApi} from "./internal/StorageApi";
import {NetworkHolder} from "./internal/NetworkHolder";
const browser = require('webextension-polyfill')

Vue.use(VueRouter)
Vue.use(BootstrapVue)
Vue.use(IconsPlugin)
Vue.use(PortalVue)
Vue.config.productionTip = false

Vue.prototype.$browser = browser
Vue.prototype.$storageApi = new StorageApi(browser)
Vue.prototype.$network = new NetworkHolder(Vue.prototype.$storageApi)

const root = document.getElementById('app')
Vue.prototype.$isPopup = root.attributes['app-type'].value === 'popup'

new Vue({
  router,
  el: '#app',
  render: (h) => h(App, {
    props: {
      appType: root.attributes['app-type'].value
    }
  })
})

