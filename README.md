# nip07-node

A nip07 provider and polyfill for node js.

Depends on the _@nostr-tools_ package.

## Installation

```
npm i nip07-node
```

## Usage

```js
const { Nip07Provider } = require("nip07-node");

// Instantiate the NIP07Provider with a ConfigObject and register its methods on the global object.
new Nip07Provider({
    secretKeyMethod: "file",
    keyFilePath: "/your/path/to/keyfile",
}).register();

// Once the provider is registered it will polyfill the global window object with nip07 methods:
window.nostr
    .signEvent({
        kind: 1,
        content: "This is a test",
        tags: [],
        created_at: Math.floor(Date.now() / 1000),
    })
    .then((event) => {
        console.log(event);
    });

window.nostr.getPublicKey().then((pubkey) => {
    console.log(pubkey);
});
```

### Config Object

-   secretKeyMethod
    -   throwaway: create a new key for this process and save it in memory
    -   file: read a key from a utf-8 encoded text file
    -   nip46: WIP - Communicate with a remote signer as per NIP-46
-   keyFilePath: The path to a local key file (Required when secretKeyMethod is 'file').

```ts
type ProviderConfig = {
    secretKeyMethod: "throwaway" | "file" | "nip46";
    keyFilePath?: string;
};
```
