import _omit from 'lodash/omit';
import {SYNC_KEY, SYNC_MUTATION_KEY, SYNC_STATE_KEY} from './const';


class Page {
    store;
    options;
    port;
    connectionName;
    initialized = false;
    pendingMutationsQueue = [];

    constructor({store, options, connectionName}) {
        this.store = store;
        this.options = options;
        this.connectionName = connectionName;
        this.port = chrome.runtime.connect({name: connectionName});
        this.port.onMessage.addListener(this.onMessage.bind(this));
        this.store.subscribe(this.onMutation.bind(this));
    }

    onMessage(message) {
        console.log(`[syncPlugin][page][${this.connectionName}][onMessage] Received message:`, message);
        const {type, data} = message;
        if (type === SYNC_STATE_KEY) {
            console.log(`[syncPlugin][page][${this.connectionName}][onMessage] Replacing state with`, message.data);
            this.store.replaceState(message.data);
            this.initialized = true;
            this.processPendingMutationsQueue();
        } else if (type === SYNC_MUTATION_KEY) {
            if (!this.initialized) {
                console.warn(`[syncPlugin][page][${this.connectionName}][onMessage] Not initialized yet`);
                return;
            }
            //apply mutation
            console.log(`[syncPlugin][page][${this.connectionName}][onMessage] Applying mutation`);
            const {type, payload} = data;
            const injectedPayload = {...payload, [SYNC_KEY]: true};
            this.store.commit(type, injectedPayload);
        }
    }

    onMutation(mutation) {
        console.log(`[syncPlugin][page][${this.connectionName}][onMutation] Mutation fired`, mutation);
        if (this.options.ignore && this.options.ignore.includes(mutation.type)) {
            console.warn(`[syncPlugin][page][${this.connectionName}][onMutation] Mutation "${mutation.type}" is ignored`);
            return;
        }
        if (!this.initialized) {
            console.warn(`[syncPlugin][page][${this.connectionName}][onMutation] Not initialized yet`);
            this.pendingMutationsQueue.push(mutation);
            return;
        }
        //do not send back to bg applied mutation
        if (!(mutation.payload && SYNC_KEY in mutation.payload)) {
            console.log(`[syncPlugin][page][${this.connectionName}][onMutation] Sync it to bg`);
            this.port.postMessage({
                type: SYNC_MUTATION_KEY,
                data: {type: mutation.type, payload: _omit(mutation.payload, [SYNC_KEY])},
            });
        } else {
            console.log(`[syncPlugin][page][${this.connectionName}][onMutation] Skip applied`);
        }
    }

    processPendingMutationsQueue() {
        console.log(`[syncPlugin][page][${this.connectionName}][processPendingMutationsQueue] Processing pending mutation queue`);
        if (this.pendingMutationsQueue.length === 0) {
            console.log(`[syncPlugin][page][${this.connectionName}][processPendingMutationsQueue] Empty queue`);
            return;
        }
        do {
            const pendingMutation = this.pendingMutationsQueue.shift();
            const {type, payload} = pendingMutation;
            console.log(`[syncPlugin][page][${this.connectionName}][processPendingMutationsQueue] Processing pending mutation`, type, payload);
            this.store.commit(type, payload);
        } while (this.pendingMutationsQueue.length > 0);
    }
}

export default Page;
