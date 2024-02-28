import path from 'path';
import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {viteStaticCopy} from 'vite-plugin-static-copy';

export default defineConfig({
    root: 'src',
    build: {
        rollupOptions: {
            input: {
                popup: path.join(__dirname, 'src', 'popup', 'popup.html'),
                background: path.join(__dirname, 'src', 'background', 'background.js'),
                options: path.join(__dirname, 'src', 'options', 'options.html'),
            },
            output: {
                dir: 'dist',
                format: 'es',
                entryFileNames: () => 'assets/[name].js',
                chunkFileNames: () => 'assets/[name].js',
                manualChunks: (path, {getModuleInfo}) => {
                    if (path.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
    },
    plugins: [
        vue(),
        viteStaticCopy({
            targets: [
                {
                    src: path.resolve(__dirname, 'src', 'manifest.json'),
                    dest: path.resolve(__dirname, 'dist'),
                },
            ],
        }),
    ],
});

