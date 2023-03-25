const path = require('path');
const {defineConfig} = require('vite');

module.exports = defineConfig({
    build: {
        sourcemap: true,
        lib: {
            entry: path.resolve(__dirname, 'src', 'index.js'),
            name: 'vuex-extension-sync',
            formats: ['cjs', 'es'],
            fileName: 'index',
        },
        rollupOptions: {
            external: ['lodash', 'vuex'],
        },
    },
});
