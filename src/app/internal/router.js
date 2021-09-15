import VueRouter from "vue-router";
import Welcome from "../components/Welcome";
import Home from "../components/Home";
import Login from "../components/account/Login";
import ImportWallet from "../components/account/ImportAccount";
import NewWallet from "../components/account/NewAccount";
import Account from "../components/account/Account";
import Transaction from "../components/Transaction";
import Vue from "vue";
import ListAccounts from "../components/account/ListAccounts";

export const router = new VueRouter({
    routes: [
        { path: '/welcome', component: Welcome },
        { path: '/home', component: Home },
        { path: '/login', component: Login },
        { path: '/import-account', component: ImportWallet },
        { path: '/new-account', component: NewWallet },
        { path: '/account', component: Account, props: {editAccount: false} },
        { path: '/edit-account', component: Account, props: {editAccount: true} },
        { path: '/account-list', component: ListAccounts },
        { path: '/transaction', name: 'transaction', component: Transaction, props: true },
        { path: '*', redirect: '/welcome' }
    ]
})

export const replaceRoute = (route) => {
    if (router.currentRoute.path !== route) {
        router.replace(route).catch(() => {})
    }
}

export const pushRoute = (route) => {
    if (router.currentRoute.path !== route) {
        router.push(route).catch(() => {})
    }
}

router.beforeEach(async (to, from, next) => {
    const publicPages = ['/login', '/welcome'];
    const publicSubpages = ['/import-account', '/new-account']
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

