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

Available levels: `trace`, `debug`, `info`, `warn`, `error`.

Boolean values mapping: `true -> debug`, `false -> info`.  

```javascript
VuexExtensionSync({
  debug: 'warn',
})
```

## Keepalive background worker

To prevent background worker from termination by timeout use `keepAlive: Boolean` plugin option. Default `true`.

```javascript
VuexExtensionSync({
  keepAlive: true,
})
```

## Strategy

In a real extension, I ran into a problem with state synchronization between all pages.

I have music player control panel extension, when popup play button pressed mutation PLAY sent to content-script and activate play on site.

When site's player starts playing content-script sent back to background mutation PLAY with actual playing state, background updates it's store.

Now if I opened two tabs with same player site, popup's button click sent PLAY to both pages, they started playing and sent back PLAY, background got it from first and replicated to second, second stopped playing and sent it back. So we have a recursion.

To solve this problem I added new broadcast strategy to sync mutations only with master content-script page and ignore other content-script pages, but keep syncing with popup, options pages. Master page is elected by function. When master page is closed there is new election called.

Plugin options:
`strategy: "broadcast" | "master"` - default `broadcast`.
When `broadcast` chosen it's sync between all pages;
When `master` chosen it's sync only with master content-script which elected by default function "first is master";
`electionFunc: function` - default `null` means function "first is master":

```typescript
function electionFuncFirstIsMaster(ports: Map<Port, Meta>): Port | undefined {
  const [[port] = []] = [...ports.entries()]
    .filter(([, meta]) => meta.usedInMasterStrategy)
    .sort(([, aMeta], [, bMeta]) => aMeta.created - bMeta.created);
  return port;
}

type Port = {
  //@see https://developer.chrome.com/docs/extensions/reference/runtime/#type-Port
}

type Meta = {
    usedInMasterStrategy: boolean, //is used for master port election, cs pages only 
    master: boolean, //is master
    created: number //timestamp
}
```
