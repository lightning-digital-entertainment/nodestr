import {
    Event,
    EventTemplate,
    generatePrivateKey,
    getEventHash,
    getPublicKey,
    getSignature,
} from "nostr-tools";
import fs from "fs";
import { readFile } from "fs/promises";

declare global {
    interface Window {
        nostr: {
            signEvent: (e: EventTemplate) => Promise<Event>;
            getPublicKey: () => Promise<string>;
        };
    }
}

type SecretKeyMethod = "throwaway" | "file" | "nip46";

type ProviderConfig = {
    secretKeyMethod: SecretKeyMethod;
    keyFilePath?: string;
};

export class Nip07Provider {
    private secretKeyMethod: SecretKeyMethod;

    private secretKey?: string;

    private keyFilePath?: string;

    constructor(configObject: ProviderConfig) {
        if (!configObject || !configObject.secretKeyMethod) {
            throw new Error(
                "Nip07Provider requires a ConfigObject with the secretKeyMethod property"
            );
        }
        if (
            configObject.secretKeyMethod !== "throwaway" &&
            configObject.secretKeyMethod !== "file" &&
            configObject.secretKeyMethod !== "nip46"
        ) {
            throw new Error(
                "Invalid secretKeyMethod! Must be one of 'throwaway', 'file', 'nip46'"
            );
        }
        this.secretKeyMethod = configObject.secretKeyMethod;
        if (configObject.secretKeyMethod === "throwaway") {
            this.secretKey = generatePrivateKey();
        }
        if (configObject.secretKeyMethod === "file") {
            if (!configObject.keyFilePath) {
                throw new Error(
                    "Invalid ConfigObject! Must specify a keyFilePath if secretKeyMethod is 'file'!"
                );
            }
            if (!fs.existsSync(configObject.keyFilePath)) {
                throw new Error("Invalid keyFilePath: File does not exist");
            }
            this.keyFilePath = configObject.keyFilePath;
        }
    }

    private async getSecretKey() {
        if (this.secretKeyMethod === "throwaway") {
            return this.secretKey;
        }
        if (this.secretKeyMethod === "file") {
            if (!this.keyFilePath) {
                throw new Error(
                    "Unable to retrieve key: No keyFilePath available!"
                );
            }
            return readFile(this.keyFilePath, "utf-8");
        }
    }

    async signEvent(eventTemplate: EventTemplate): Promise<Event> {
        const secretKey = await this.getSecretKey();
        if (!secretKey) {
            throw new Error("Unable to sign: No secret key available!");
        }
        const publicKey = getPublicKey(secretKey);
        const eventHash = getEventHash({
            ...eventTemplate,
            pubkey: publicKey,
        });
        const unsignedEvent = {
            ...eventTemplate,
            pubkey: publicKey,
            id: eventHash,
        };

        const signedEvent = {
            ...unsignedEvent,
            sig: getSignature(unsignedEvent, secretKey),
        };
        return signedEvent;
    }

    async getPublicKey(): Promise<string> {
        const secretKey = await this.getSecretKey();
        if (!secretKey) {
            throw new Error(
                "Unable to derive public key: No secret key available!"
            );
        }
        return getPublicKey(secretKey);
    }

    register() {
        var globalObject = global;
        globalObject.window = globalObject.window || {};
        globalObject.window.nostr = {
            signEvent: this.signEvent.bind(this),
            getPublicKey: this.getPublicKey.bind(this),
        };
    }
}

export default Nip07Provider;
