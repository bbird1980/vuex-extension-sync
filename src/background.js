import _omit from 'lodash/omit';
import _pick from 'lodash/pick';
import {SYNC_FROM_KEY, SYNC_MUTATION_KEY, SYNC_STATE_KEY, SYNC_STORAGE_KEY} from './const';

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

class Background {
    store;
    options;
    ports = new Set();

    constructor({store, options}) {
        this.store = store;
        this.options = options;

        chrome.runtime.onConnect.addListener(this.onConnect.bind(this));
        store.subscribe(this.onMutation.bind(this));
        this.initPersistentStore().finally();
    }

    onConnect(port) {
        console.log(`[syncPlugin][Background][onConnect][${port.name}] Connected`);
        this.ports.add(port);
        port.onMessage.addListener(message => this.onMessage(message, port));
        port.onDisconnect.addListener(() => this.onDisconnect(port));
        this.syncState(port);
    }

    async onMutation(mutation) {
        const {type, payload} = mutation;
        const senderPortName = payload?.[SYNC_FROM_KEY] ?? 'self';
        console.log(`[syncPlugin][Background][onMutation] Received mutation from "${senderPortName}"`, mutation);

        if (this.options.ignore && this.options.ignore.includes(type)) {
            console.warn(`[syncPlugin][Background][onMutation] Mutation "${type}" is ignored`);
            return;
        }

        this.ports.forEach(openedPort => {
            if (openedPort.name !== senderPortName) {
                const message = {
                    type: SYNC_MUTATION_KEY,
                    data: {type, payload: _omit(payload, [SYNC_FROM_KEY])},
                };
                openedPort.postMessage(message);
                console.log(`[syncPlugin][Background][onMutation] Broadcast from "${senderPortName}" to "${openedPort.name}":`, message);
            }
        });

        await this.persistState();
    }

    onMessage(message, port) {
        console.log(`[syncPlugin][Background][onMessage][${port.name}] Received message`, message);
        if (message.type === SYNC_MUTATION_KEY) {
            console.log(`[syncPlugin][Background][onMessage][${port.name}] Applying mutation`);
            const {type, payload} = message.data;
            const injectedPayload = {...payload, [SYNC_FROM_KEY]: port.name};
            this.store.commit(type, injectedPayload);
        }
    }

    onDisconnect(port) {
        console.log(`[syncPlugin][Background][onDisconnect][${port.name}] Disconnected`);
        this.ports.delete(port);
    }

    syncState(port) {
        console.log(`[syncPlugin][Background][syncState][${port.name}] Sync state with port`);
        port.postMessage({
            type: SYNC_STATE_KEY,
            data: this.store.state,
        });
    }

    async persistState() {
        console.log(`[syncPlugin][Background][persistState] Persisting state`);
        if (!this.options.persist?.length) {
            console.log(`[syncPlugin][Background][persistState] No keys defined`);
            return;
        }
        const data = _pick(this.store.state, this.options.persist);
        try {
            console.log(`[syncPlugin][Background][persistState] Writing to localstorage`, this.options.persist);
            await setLocalStoragePromisified({[SYNC_STORAGE_KEY]: data});
            console.log(`[syncPlugin][Background][persistState] Successfully`);
        } catch (e) {
            console.error(`[syncPlugin][Background][persistState] Error:`, e);
        }
    }

    async initPersistentStore() {
        console.log(`[syncPlugin][Background][initPersistentStore] Init persisted state`);
        if (!this.options.persist?.length) {
            console.log(`[syncPlugin][Background][initPersistentStore] No keys defined`);
            return;
        }
        console.log(`[syncPlugin][Background][initPersistentStore] Reading from localstorage`);
        try {
            const data = await getLocalStoragePromisified(SYNC_STORAGE_KEY);
            if (data === null) {
                console.log(`[syncPlugin][Background][initPersistentStore] Localstorage is empty`);
                return;
            }
            this.store.replaceState(_pick(data, this.options.persist));
            console.log(`[syncPlugin][Background][initPersistentStore] Localstorage found, sync it with all ports`);
            this.ports.forEach(this.syncState);
            console.log(`[syncPlugin][Background][initPersistentStore] Successfully`);
        } catch (e) {
            console.error(`[syncPlugin][Background][initPersistentStore] Error:`, e);
        }
    }
}

export default Background;
