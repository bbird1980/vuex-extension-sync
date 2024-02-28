# Example

Simple app with service worker, popup, options pages and content-script.

## Usage

`cd example/extension`

`npm install`

`npm run build`

Next install chrome extension from dist folder.

## Popup & Options

Click on extension icon opens popup with content:

`Content-scripts counter: 34`

`[Click me]`

Click on button changes persisted state counter.

## Content script 

Open any URL and you'll see absolute positioned block with content:

`Content-scripts counter: 34`

`[Click me]`

Click on button changes persisted state counter.

## Service worker 

Open devtools on service worker from extensions page. 

You'll get message in console on every state counter changed.

`> counter 34`

To change counter from service worker use console command:

```javascript
ServiceWorkerGlobalScope.counter()
```

## Next 

Open all pages and devtools at the same time and click any button, all changes will be synced across opened resources.
