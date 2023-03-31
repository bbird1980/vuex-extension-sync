import Page from './page';
import Background from './background';

const pageType = this.constructor.name === 'ServiceWorkerGlobalScope' ? 'bg' : (
    !chrome.action ? 'cs' : (
        this.location.href.includes('popup') ? 'popup' : (
            this.location.href.includes('options') ? 'options' : 'page'
        )
    )
);

export default function(options) {
    if (options.persist && !(Array.isArray(options.persist) && options.persist.every(i => typeof i === 'string'))) {
        throw TypeError('options.persist must be Array of strings');
    }
    if (options.ignore && !(Array.isArray(options.ignore) && options.ignore.every(i => typeof i === 'string'))) {
        throw TypeError('options.ignore must be Array of strings');
    }
    if (options.strategy && !['broadcast', 'master'].includes(options.strategy)) {
        throw TypeError('options.strategy must be one of [\'broadcast\', \'master\']');
    }
    if (options.electionFunc && typeof options.electionFunc !== 'function') {
        throw TypeError('options.electionFunc must be function(ports)');
    }

    return function(store) {
        if (pageType === 'bg') {
            return new Background({options, store});
        } else {
            return new Page({options, store, pageType});
        }
    };
}
