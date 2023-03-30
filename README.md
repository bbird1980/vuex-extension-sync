> Original great project [MitsuhaKitsune/vuex-webextensions](https://github.com/MitsuhaKitsune/vuex-webextensions), unfortunately it's not working with Manifest v3 and Vue3+Vuex4, so this is completly rewritten version.

# Vuex extension sync

A Vuex plugin to sync shared store between background worker script and other extensions contexts: content script, popup, options. Any commit of mutation synced with others automatically and can be persisted in storage.

Current limitations:
* Only mutations synced, not actions (I don't plan to do it because conceptually the action doesn't change the state)
* Only chrome extensions
* Vue3 + Vuex4

## Installation

`npm i vuex-extension-sync`

## Usage

Import the plugin into your store file:

```javascript
import {createStore} from 'vuex';
import VuexExtensionSync from 'vuex-extension-sync';

export default createStore({
  ...
  plugins: [VuexExtensionSync({
    persist: ['somePersistedKey'],
    ignore: ['SOME_MUTATION'],
    debug: false,
  })],
});
```

## Persistent states

> ⚠ Persistent states using `chrome.storage.local` to save the state keys in your browser's storage, be sure to grant `storage` permision.

It's usefull for save settings between browser reload. Use `persist: String[]` plugin option.

```javascript
VuexExtensionSync({
  persist: ['somePersistedKey'],
})
```

## Ignored mutations 

For skip syncing some mutations use `ignore: String[]` plugin option. 

```javascript
VuexExtensionSync({
  ignore: ['SOME_MUTATION_1', 'SOME_MUTATION_N'],
})
```

## Debug 

For debugging use `debug: Boolean|String` plugin option. Default `info`.

Available levels: `debug`, `info`, `warn`, `error`.

Boolean values mapping: `true -> debug`, `false -> info`.  

```javascript
VuexExtensionSync({
  debug: true,
})
```
