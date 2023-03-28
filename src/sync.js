class Sync {
    store;
    options;

    constructor({store, options}) {
        this.store = store;
        this.options = {
            persist: [],
            ignore: [],
            debug: false,
            //todo: serializer: JSON.stringify,
            //todo: deserializer: JSON.parse,
            ...options,
        };
        this.store.subscribe(this.onMutation.bind(this));
    }

    log(msg, ...args) {
        if (this.options.debug) {
            this.#logger('log', msg, args);
        }
    }

    warn(msg, ...args) {
        this.#logger('warn', msg, args);
    }

    error(msg, ...args) {
        this.#logger('error', msg, args);
    }

    onMutation(mutation, stat) {
        throw new TypeError('onMutation must be implemented');
    }

    #logger(type, msg, args) {
        console[type].apply(null, [`[vuex-extension-sync]${msg}`, ...args]);
    }
}

export default Sync;
