import _omit from 'lodash/omit';
import {SYNC_KEY, SYNC_MUTATION_KEY, SYNC_STATE_KEY} from './const';
import Sync from './sync';

class Page extends Sync {
    port;
    connectionName;
    initialized = false;
    pendingMutationsQueue = [];

    constructor(params) {
        super(params);

        this.connectionName = params.connectionName;
        this.port = chrome.runtime.connect({name: this.connectionName});
        this.port.onMessage.addListener(this.onMessage.bind(this));
    }

    onMessage(message) {
        this.log(`[Page][${this.connectionName}][onMessage] Received message:`, message);
        const {type, data} = message;
        if (type === SYNC_STATE_KEY) {
            this.log(`[Page][${this.connectionName}][onMessage] Replacing state with`, message.data);
            this.store.replaceState(message.data);
            this.initialized = true;
            this.processPendingMutationsQueue();
        } else if (type === SYNC_MUTATION_KEY) {
            if (!this.initialized) {
                this.warn(`[Page][${this.connectionName}][onMessage] Not initialized yet`);
                return;
            }
            //apply mutation
            this.log(`[Page][${this.connectionName}][onMessage] Applying mutation`);
            const {type, payload} = data;
            const injectedPayload = {...payload, [SYNC_KEY]: true};
            this.store.commit(type, injectedPayload);
        }
    }

    onMutation(mutation) {
        this.log(`[Page][${this.connectionName}][onMutation] Mutation fired`, mutation);
        if (this.options.ignore && this.options.ignore.includes(mutation.type)) {
            this.warn(`[Page][${this.connectionName}][onMutation] Mutation "${mutation.type}" is ignored`);
            return;
        }
        if (!this.initialized) {
            this.warn(`[Page][${this.connectionName}][onMutation] Not initialized yet`);
            this.pendingMutationsQueue.push(mutation);
            return;
        }
        //do not send back to bg applied mutation
        if (!(mutation.payload && SYNC_KEY in mutation.payload)) {
            this.log(`[Page][${this.connectionName}][onMutation] Sync it to bg`);
            this.port.postMessage({
                type: SYNC_MUTATION_KEY,
                data: {type: mutation.type, payload: _omit(mutation.payload, [SYNC_KEY])},
            });
        } else {
            this.log(`[Page][${this.connectionName}][onMutation] Skip applied`);
        }
    }

    processPendingMutationsQueue() {
        this.log(`[Page][${this.connectionName}][processPendingMutationsQueue] Processing pending mutation queue`);
        if (this.pendingMutationsQueue.length === 0) {
            this.log(`[Page][${this.connectionName}][processPendingMutationsQueue] Empty queue`);
            return;
        }
        do {
            const pendingMutation = this.pendingMutationsQueue.shift();
            const {type, payload} = pendingMutation;
            this.log(`[Page][${this.connectionName}][processPendingMutationsQueue] Processing pending mutation`, type, payload);
            this.store.commit(type, payload);
        } while (this.pendingMutationsQueue.length > 0);
    }
}

export default Page;
