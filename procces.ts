import { assert, baceURL } from "./general.ts";

type ProcessMessageHandler = (process: Process, cmd: string, args: unknown[]) => void;

export interface ProcessPerms {
    readonly fileAccess: 0 | 1 | 2;
    readonly denoAccess: boolean;
    readonly fineTime: boolean;
}

export interface ProcessState {
    perms: ProcessPerms;
    display: {
        width: number,
        height: number,
        owned: boolean
    }
    diskName: string,
    fileName: string
}

export class Process {
    readonly diskName: string;
    readonly fileName: string;
    readonly path: string;
    readonly worker: Worker;
    readonly perms: ProcessPerms;
    messageHandler: ProcessMessageHandler;
    lastRespond = new Date().getTime();
    alive = true;
    constructor(disk: string, file: string, perms: ProcessPerms, messageHandler: ProcessMessageHandler) {
        this.diskName = disk;
        this.fileName = file;
        this.path = baceURL(`./disks/${disk}/${file}`);
        const rwPerms = [false, ["./disks/"], [""]]
        this.worker = new Worker(this.path, {
            type: "module",
            deno: {
                namespace: perms.denoAccess,
                permissions: {
                    env: false,
                    hrtime: perms.fineTime,
                    net: false,
                    plugin: false,
                    read: rwPerms[perms.fileAccess],
                    run: false,
                    write: rwPerms[perms.fileAccess]
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