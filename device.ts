import { loadBMP } from "./bmp.ts"
import { assert } from "./general.ts";
import { Layer } from "./draw.ts";
import { ProcessState } from "./procces.ts";

const pathParts = import.meta.url.split("/");

let updateFunc = () => { };
let processState: ProcessState | null = null;
let lastStateUpdate = 0;
let deviceSelf: Window & typeof globalThis;
let doneSetup = false;
export let display: Layer;

declare global {
    interface Window {
        onmessage: (e: MessageEvent) => void;
        postMessage: (message: unknown, transfer?: unknown[]) => void;
    }
}

function handleSystemMessage(cmd: string, args: unknown[]) {
    switch (cmd) {
        case "update":
            {
                if (doneSetup) {
                    try {
                        updateFunc();
                    } catch (e) {
                        messageSystem("error", e);
                    }
                }
                messageSystem("respond");
            }
            break;
        case "setState": {
            processState = <ProcessState>args[0];
        } break;
    }
}

function messageSystem(cmd: string, args: unknown[] = []) {
    deviceSelf.postMessage([cmd, args]);
}

function updateState() {
    const time = new Date().getTime();
    if (time - lastStateUpdate > 50) {
        messageSystem("getState");
        lastStateUpdate = time;
    }
}


function getDisplay() {
    return new Promise<Layer>((resolve, reject) => {
        if (display != null) {
            resolve(display);
            return;
        }
        updateState();
        const makeDisplayInterval = setInterval(() => {
            if (processState === null)
                return;
            clearInterval(makeDisplayInterval);
            if (!processState.display.owned)
                reject("process is not drawingProcess");
            resolve(new Layer(processState.display.width, processState.display.height, messageSystem));
        }, 10);
    });
}

export function setup(s: unknown) {
    deviceSelf = <Window & typeof globalThis>s;
    deviceSelf.onmessage = (e: MessageEvent) => {
        assert(typeof e.data[0] === "string");
        assert(typeof e.data[1] === "object" && Array.isArray(e.data[1]));
        handleSystemMessage(e.data[0], e.data[1]);
    }
    return new Promise<void>((resolve, reject) => {
        Promise.all([getDisplay()]).then((values) => {
            display = values[0];
            doneSetup = true;
            resolve();
        }, (reason) => reject(reason));
    })
}

export function bindUpdate(func: () => void) {
    updateFunc = func;
}

export function loadImage(fileName: string, diskName = processState?.diskName) {
    if (diskName === undefined)
        return Promise.reject("processState not set, run setup");
    return loadBMP(`./disks/${diskName}/${fileName}.bmp`);
}