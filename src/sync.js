class Sync {
    store;
    options;
    logLevel = 'info';

    constructor({store, options}) {
        this.store = store;
        this.options = {
            persist: [],
            ignore: [],
            debug: false,
            strategy: 'broadcast',
            electionFunc: null,
            //todo: serializer: JSON.stringify,
            //todo: deserializer: JSON.parse,
            ...options,
        };
        this.logLevel = this.options.debug === true ? 'debug' : (
            this.options.debug === false ? 'info' : (this.options.debug || 'info')
        );
        this.store.subscribe(this.onMutation.bind(this));
    }

    onMutation(mutation, stat) {
        throw new TypeError('onMutation must be implemented');
    }
}

export default Sync;
