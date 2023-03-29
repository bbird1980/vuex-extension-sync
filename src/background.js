import _pick from 'lodash/pick';
import _isEqual from 'lodash/isEqual';
import {SYNC_MUTATION_KEY, SYNC_STATE_KEY, SYNC_STORAGE_KEY} from './const';
import Sync from './sync';

function getLocalStoragePromisified(key) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(key, data => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(data[key]);
            }
        });
    });
}

function setLocalStoragePromisified(items) {
    return new Promise((resolve, reject) => {
        chrome.storage.local.set(items, () => {
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve();
            }
        });
    });
}

class Background extends Sync {
    ports = new Set();
    prevPersistedState;
    syncFromMutations = [];

    constructor(params) {
        super(params);

        chrome.runtime.onConnect.addListener(this.onConnect.bind(this));
        this.prevPersistedState = _pick(this.store.state, this.options.persist);
        this.initPersistentStore().finally();
        this.store.getters.picked = state => _pick(state, this.options.persist);
    }

    onConnect(port) {
        this.log(`[Background][onConnect][${port.name}] Connected`);
        this.ports.add(port);
        port.onMessage.addListener(message => this.onMessage(message, port));
        port.onDisconnect.addListener(() => this.onDisconnect(port));
        this.syncState(port);
    }

    async onMutation(mutation, state) {
        const {type, payload} = mutation;
        const syncFromMutationIndex = this.syncFromMutations.findIndex(sm => sm.type === type && sm.payload === payload);
        const senderPortName = syncFromMutationIndex === -1 ? 'self' : this.syncFromMutations[syncFromMutationIndex].from;
        this.log(`[Background][onMutation] Received mutation from "${senderPortName}"`, mutation);

        if (this.options.ignore && this.options.ignore.includes(type)) {
            this.warn(`[Background][onMutation] Mutation "${type}" is ignored`);
            return;
        }

        this.ports.forEach(openedPort => {
            if (openedPort.name !== senderPortName) {
                const message = {
                    type: SYNC_MUTATION_KEY,
                    data: {type, payload},
                };
                openedPort.postMessage(message);
                this.log(`[Background][onMutation] Broadcast from "${senderPortName}" to "${openedPort.name}":`, message);
            }
        });

        this.syncFromMutations.splice(syncFromMutationIndex, 1);

        if (this.options.persist?.length) {
            const newPersistedState = _pick(state, this.options.persist);
            if (!_isEqual(this.prevPersistedState, newPersistedState)) {
                this.log('[Background][persistState] Persisting state', this.options.persist);
                await this.persistState(newPersistedState);
            }
        }
        this.prevPersistedState = _pick(state, this.options.persist);
    }

    onMessage(message, port) {
        this.log(`[Background][onMessage][${port.name}] Received message`, message);
        if (message.type === SYNC_MUTATION_KEY) {
            this.log(`[Background][onMessage][${port.name}] Applying mutation`);
            const {type, payload} = message.data;
            this.syncFromMutations.push({type, payload, from: port.name});
            this.store.commit(type, payload);
        }
    }

    onDisconnect(port) {
        this.log(`[Background][onDisconnect][${port.name}] Disconnected`);
        this.ports.delete(port);
    }

    syncState(port) {
        this.log(`[Background][syncState][${port.name}] Sync state with port`);
        port.postMessage({
            type: SYNC_STATE_KEY,
            data: this.store.state,
        });
    }

    async persistState(data) {
        try {
            this.log('[Background][persistState] Writing to localstorage');
            await setLocalStoragePromisified({[SYNC_STORAGE_KEY]: data});
            this.log('[Background][persistState] Successfully');
        } catch (e) {
            this.error('[Background][persistState] Error:', e);
        }
    }

    async initPersistentStore() {
        this.log('[Background][initPersistentStore] Init persisted state');
        if (!this.options.persist?.length) {
            this.log('[Background][initPersistentStore] No keys defined');
            return;
        }
        this.log('[Background][initPersistentStore] Reading from localstorage');
        try {
            const data = await getLocalStoragePromisified(SYNC_STORAGE_KEY);
            if (data === null) {
                this.log('[Background][initPersistentStore] Localstorage is empty');
                return;
            }
            this.store.replaceState({...this.store.state, ..._pick(data, this.options.persist)});
            this.log('[Background][initPersistentStore] Localstorage found, sync it with all ports');
            this.ports.forEach(this.syncState);
            this.log('[Background][initPersistentStore] Successfully');
        } catch (e) {
            this.error('[Background][initPersistentStore] Error:', e);
        }
    }
}

export default Background;
