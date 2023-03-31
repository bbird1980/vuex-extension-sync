export default function createLogger(namespace, level = 'info') {
    return {
        levels: ['trace', 'debug', 'info', 'warn', 'error'],
        colors: ['\x1b[34m', '\x1b[35m', '\x1b[32m', '\x1b[33m', '\x1b[31m'],
        level,
        namespace,
        setLevel(level) {
            if (this.levels.includes(level)) {
                this.level = level;
            } else {
                throw new Error(`Invalid log level: ${level}`);
            }
        },
        _log(level, ...args) {
            const index = this.levels.indexOf(level);
            if (index >= this.levels.indexOf(this.level)) {
                console[['debug', 'trace', 'info'].includes(level) ? 'log' : level](Array.isArray(this.namespace) ? `${this.colors[index]}${level.toUpperCase()}\x1b[0m: [${this.namespace.join('][')}]` : `[${this.namespace}]`, ...args);
            }
        },
        trace(...args) {
            this._log('trace', ...args);
        },
        debug(...args) {
            this._log('debug', ...args);
        },
        info(...args) {
            this._log('info', ...args);
        },
        log(...args) {
            this._log('info', ...args);
        },
        warn(...args) {
            this._log('warn', ...args);
        },
        error(...args) {
            this._log('error', ...args);
        },
    };
}
