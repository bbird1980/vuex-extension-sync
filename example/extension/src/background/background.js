import store from '../common/store';

store.subscribe(mutation => {
    switch (mutation.type) {
        case 'COUNTER':
            console.log('counter', store.state.counter);
            break;
    }
});

ServiceWorkerGlobalScope.counter = function() {
    store.commit('COUNTER');
}
