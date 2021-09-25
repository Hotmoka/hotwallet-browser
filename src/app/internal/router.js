import VueRouter from "vue-router";
import Welcome from "../components/Welcome";
import Home from "../components/Home";
import Login from "../components/account/Login";
import ImportAccount from "../components/account/ImportAccount";
import CreateAccount from "../components/account/CreateAccount";
import Account from "../components/account/Account";
import Transaction from "../components/Transaction";
import Vue from "vue";
import ListAccounts from "../components/account/ListAccounts";
import CreateKey from "../components/account/CreateKey";


export const router = new VueRouter({
    routes: [
        { path: '/welcome', component: Welcome },
        { path: '/home', component: Home },
        { path: '/login', component: Login },
        { path: '/create-key', component: CreateKey },
        { path: '/import-account', component: ImportAccount },
        { path: '/create-account', name: 'create-account', component: CreateAccount, props: true },
        { path: '/account', component: Account, props: {editAccount: false, isAccount: true} },
        { path: '/edit-account', name: 'edit-account', component: Account, props: true },
        { path: '/account-list', component: ListAccounts },
        { path: '/transaction/:uuid', component: Transaction },
        { path: '*', redirect: '/welcome' }
    ]
})

export const replaceRoute = (route, params) => {
    if (router.currentRoute.path !== route) {
        if (params && typeof params === 'object') {
            router.push({ name: route.substring(1), params: params}).catch(() => {})
        } else {
            router.replace(route).catch(() => {})
        }
    }
}

export const pushRoute = (route, params) => {
    if (params && typeof params === 'object') {
        router.push({ name: route.substring(1), params: params}).catch(() => {})
    } else {
        router.push(route).catch(() => {})
    }
}

router.beforeEach(async (to, from, next) => {
    const publicPages = ['/login', '/welcome'];
    const publicSubpages = ['/import-account', '/create-key']
    const inSubpages = publicSubpages.includes(to.path);
    const authRequired = !publicPages.includes(to.path);
    const auth = await Vue.prototype.$storageApi.getAuthentication()

    let route = null
    if (authRequired) {
        if (auth.hasAccount && !auth.authenticated) {
            route = '/login'
        } else if (!auth.hasAccount && !inSubpages) {
            route = '/welcome'
        }
    } else {

        if (auth.hasAccount) {
            if (!auth.authenticated) {
                route = '/login'
            } else {
                route = '/home'
            }
        } else {
            route = '/welcome'
        }
    }

    if (route && route !== to.path) {
        next(route)
    } else {
        next()
    }
});

