import { assert, baceURL } from "./general.ts";
import { ensureDir } from "https://deno.land/std/fs/mod.ts";
import { Process, ProcessState } from "./procces.ts";

// load config

let configSelector;
try {
    configSelector = Deno.readTextFileSync("./config.txt");
} catch (e) {
    configSelector = pickConfigSelector();
}

// initialize with config

console.log(`initializing with (${configSelector}) config`)

const config = JSON.parse(Deno.readTextFileSync(
    `./configs/${configSelector}.json`));

const displayDriver = await import(`./${config.display.driver}/display.ts`);

if (config.linuxTmpDir)
    await ensureDir("/tmp/tmpfs/minOStmp");

// general initialize

console.log(`initializing general system`)

const processes: Process[] = [];
let drawingProcess: Process | null = null;

function handleProcessMessage(
    process: Process,
    cmd: string,
    args: unknown[],
) {
    switch (cmd) {
        case "respond":
            process.lastRespond = new Date().getTime();
            break;
        case "getState": {
            const state: ProcessState = {
                perms: process.perms,
                display: {
                    width: config.display.width,
                    height: config.display.height,
                    owned: Object.is(drawingProcess, process)
                }
            };
            process.message("setState", [state]);
        } break;
        case "display":
            assert(Array.isArray(args[0]));
            assert(typeof args[1] === "number");
            assert(typeof args[2] === "number");
            if (Object.is(drawingProcess, process))
                displayDriver.displaySerial(new Uint8Array(<number[]>args[0]), args[1], args[2])
    }
}

function update() {
    for (let i = 0; i < processes.length; i++) {
        if (!processes[i].alive) {
            processes.splice(i, 1);
            i--;
        } else {
            if (new Date().getTime() - processes[i].lastRespond > 2000) {
                console.warn(
                    `kill unresponsive process at path (${processes[i].path})`,
                );
                processes[i].end();
            } else {
                processes[i].message("update");
            }
        }
    }
    if (drawingProcess !== null)
        drawingProcess.message("draw");
}

function pickConfigSelector() {
    if (Deno.build.os === "linux") {
        return "raspLCD";
    } else {
        return "winBrowser";
    }
}

drawingProcess = new Process(baceURL("./disks/os/init.ts"), {
    fileAccess: 2,
}, handleProcessMessage);
processes.push(drawingProcess);
setInterval(update, 50);

console.log("initialized minOS");

export { };
