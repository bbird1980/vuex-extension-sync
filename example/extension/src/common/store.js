import {createStore} from 'vuex';
import VuexExtensionSync from 'vuex-extension-sync';

export default createStore({
    state: {
        counter: 0,
    },
    mutations: {
        COUNTER(state) {
            state.counter++;
        },
    },
    plugins: [
        VuexExtensionSync({
            persist: ['counter'],
            debug: false,
        }),
    ],
});
