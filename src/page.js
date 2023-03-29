import {SYNC_MUTATION_KEY, SYNC_STATE_KEY} from './const';
import Sync from './sync';

class Page extends Sync {
    port;
    connectionName;
    initialized = false;
    pendingMutationsQueue = [];
    externalMutations = [];

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
            this.externalMutations.push(data);
            this.store.commit(type, payload);
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
        const externalMutation = this.externalMutations.findIndex(sm => sm.type === mutation.type && sm.payload === mutation.payload);
        if (externalMutation === -1) {
            this.log(`[Page][${this.connectionName}][onMutation] Sync it to bg`);
            this.port.postMessage({
                type: SYNC_MUTATION_KEY,
                data: {type: mutation.type, payload: mutation.payload},
            });
        } else {
            this.externalMutations.splice(externalMutation, 1);
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
