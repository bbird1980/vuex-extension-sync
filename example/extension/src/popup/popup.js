import {createApp} from 'vue';
import App from '../common/App.vue';
import store from '../common/store';

const app = createApp(App, {title: 'Popup'});
app.use(store);
app.mount('#app');
