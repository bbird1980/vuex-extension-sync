import Page from './page';
import Background from './background';

export default function(options) {
    if (options.persist && !(Array.isArray(options.persist) && options.persist.every(i => typeof i === 'string'))) {
        throw TypeError('options.persist must be Array of strings');
    }
    if (options.ignore && !(Array.isArray(options.ignore) && options.ignore.every(i => typeof i === 'string'))) {
        throw TypeError('options.ignore must be Array of strings');
    }

    return function(store) {
        if (!('getBackgroundPage' in chrome.runtime) && 'onStartup' in chrome.runtime) {
            return new Background({options, store});
        } else {
            const connectionName = `cs_${Math.random().toString(36).substr(2, 9)}`;
            return new Page({options, store, connectionName});
        }
    };
}
