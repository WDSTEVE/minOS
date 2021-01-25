import { assert } from "./general.ts";

type ProcessMessageHandler = (process: Process, cmd: string, args: unknown[]) => void;

export interface ProcessPerms {
    readonly fileAccess: 0 | 1 | 2;
}

export interface ProcessState {
    perms: ProcessPerms;
    display: {
        width: number,
        height: number,
        owned: boolean
    }
}

export class Process {
    readonly path: string;
    readonly worker: Worker;
    readonly perms: ProcessPerms;
    messageHandler : ProcessMessageHandler;
    lastRespond = new Date().getTime();
    alive = true;
    constructor(path: string, perms: ProcessPerms, messageHandler: ProcessMessageHandler) {
        this.path = path;
        this.worker = new Worker(path, {
            type: "module",
            deno: {
                namespace: false,
                permissions: {
                    env: false,
                    hrtime: false,
                    net: false,
                    plugin: false,
                    read: false,
                    run: false,
                    write: false,
                },
            },
        });
        this.worker.onmessage = (e) => {
            assert(typeof e.data[0] === "string");
            assert(typeof e.data[1] === "object" && Array.isArray(e.data[1]));
            this.messageHandler(this, e.data[0], e.data[1])
        };
        this.perms = perms;
        Object.freeze(this.perms);
        this.messageHandler = messageHandler;
    }
    message(cmd: string, args: unknown[] = []) {
        this.worker.postMessage([cmd, args]);
    }
    end() {
        this.worker.terminate();
        this.alive = false;
    }
}