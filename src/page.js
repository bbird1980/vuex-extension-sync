import {SYNC_MUTATION_KEY, SYNC_RECONNECT_MUTATION_KEY, SYNC_STATE_KEY} from './const';
import Sync from './sync';
import createLogger from './logger';

class Page extends Sync {
    logger = createLogger(['vuex-extension-sync', 'Page'], this.logLevel);
    port;
    connectionName;
    initialized = false;
    pendingMutationsQueue = [];
    externalMutations = [];

    constructor(params) {
        super(params);

        this.connectionName = `${params.pageType}_${Math.random().toString(36).substring(2, 9)}`;
        this.connect();
    }

    connect(reconnect = false) {
        this.port = chrome.runtime.connect({name: this.connectionName});
        this.port.onMessage.addListener(this.onMessage.bind(this));
        this.port.onDisconnect.addListener(() => {
            this.connect(true);
        });
        if (reconnect) {
            this.store.commit(SYNC_RECONNECT_MUTATION_KEY);
        }
    }

    onMessage(message) {
        this.logger.debug(`[${this.connectionName}][onMessage] Received message:`, message);
        const {type, data} = message;
        if (type === SYNC_STATE_KEY) {
            this.logger.debug(`[${this.connectionName}][onMessage] Replacing state with`, message.data);
            this.store.replaceState(message.data);
            this.initialized = true;
            this.processPendingMutationsQueue();
        } else if (type === SYNC_MUTATION_KEY) {
            if (!this.initialized) {
                this.logger.warn(`[${this.connectionName}][onMessage] Not initialized yet`);
                return;
            }
            //apply mutation
            this.logger.debug(`[${this.connectionName}][onMessage] Applying mutation`);
            const {type, payload} = data;
            this.externalMutations.push(data);
            this.store.commit(type, payload);
        }
    }

    onMutation(mutation) {
        this.logger.debug(`[${this.connectionName}][onMutation] Mutation fired`, mutation);
        if (this.options.ignore && this.options.ignore.includes(mutation.type)) {
            this.logger.warn(`[${this.connectionName}][onMutation] Mutation "${mutation.type}" is ignored`);
            return;
        }
        if (!this.initialized) {
            this.logger.warn(`[${this.connectionName}][onMutation] Not initialized yet`);
            this.pendingMutationsQueue.push(mutation);
            return;
        }
        //do not send back to bg applied mutation
        const externalMutation = this.externalMutations.findIndex(sm => sm.type === mutation.type && sm.payload === mutation.payload);
        if (externalMutation === -1) {
            this.logger.debug(`[${this.connectionName}][onMutation] Sync it to bg`);
            this.port.postMessage({
                type: SYNC_MUTATION_KEY,
                data: {type: mutation.type, payload: mutation.payload},
            });
        } else {
            this.externalMutations.splice(externalMutation, 1);
            this.logger.debug(`[${this.connectionName}][onMutation] Skip applied`);
        }
    }

    processPendingMutationsQueue() {
        this.logger.debug(`[${this.connectionName}][processPendingMutationsQueue] Processing pending mutation queue`);
        if (this.pendingMutationsQueue.length === 0) {
            this.logger.debug(`[${this.connectionName}][processPendingMutationsQueue] Empty queue`);
            return;
        }
        do {
            const pendingMutation = this.pendingMutationsQueue.shift();
            const {type, payload} = pendingMutation;
            this.logger.debug(`[${this.connectionName}][processPendingMutationsQueue] Processing pending mutation`, type, payload);
            this.store.commit(type, payload);
        } while (this.pendingMutationsQueue.length > 0);
    }
}

export default Page;
