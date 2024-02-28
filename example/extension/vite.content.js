import path from 'path';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    root: 'src',
    build: {
        rollupOptions: {
            input: {
                'content-scripts': path.join(__dirname, 'src', 'content-scripts', 'content.js'),
            },
            output: {
                dir: 'dist',
                format: 'es',
                inlineDynamicImports: true,
                entryFileNames: () => 'assets/[name].js',
                chunkFileNames: () => 'assets/[name].js',
            },
        },
    },
    plugins: [
        vue(),
    ],
});

