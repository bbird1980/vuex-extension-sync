import {createApp} from 'vue';
import store from '../common/store.js';
import App from '../common/App.vue';

window.onload = async () => {
    const el = document.querySelector('body');
    if (el) {
        el.insertAdjacentHTML(
            'afterend',
            '<div id="crx-app" style="position: absolute; border-radius: 1em; left: 1em; top: 1em; font-size: 14px; z-index: 9999; background-color: #fff; color: #000; padding: 1em"></div>',
        );
        const app = createApp(App, {title: 'Content-scripts'});
        app.use(store);
        app.mount('#crx-app');
    }
};
