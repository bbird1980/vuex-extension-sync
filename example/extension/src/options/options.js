import {createApp} from 'vue';
import App from '../common/App.vue';
import store from '../common/store';

const app = createApp(App, {title: 'Options'});
app.use(store);
app.mount('#app');
