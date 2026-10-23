import { defineConfig } from 'wxt';

// See https://wxt.dev/api/reference/wxt/interfaces/inlineconfig.html
export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifest: {
        name: 'Dashload Extension',
        permissions: [
            "downloads",
            "cookies"
        ],
        host_permissions: [
            'http://localhost:*/*', // Required in MV3 to fetch localhost without CORS blocking
            'http://127.0.0.1:*/*',
            "<all_urls>"
        ],
    },
});
