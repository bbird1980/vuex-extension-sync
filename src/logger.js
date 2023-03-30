export default function createLogger(namespace, level = 'info') {
    return {
        levels: ['debug', 'info', 'warn', 'error'],
        level,
        namespace,
        setLevel(level) {
            if (this.levels.includes(level)) {
                this.level = level;
            } else {
                throw new Error(`Invalid log level: ${level}`);
            }
        },
        log(level, ...args) {
            const index = this.levels.indexOf(level);
            if (index >= this.levels.indexOf(this.level)) {
                console[level](Array.isArray(this.namespace) ? `[${this.namespace.join('][')}]` : `[${this.namespace}]`, ...args);
            }
        },
        debug(...args) {
            this.log('debug', ...args);
        },
        info(...args) {
            this.log('info', ...args);
        },
        warn(...args) {
            this.log('warn', ...args);
        },
        error(...args) {
            this.log('error', ...args);
        },
    };
}
