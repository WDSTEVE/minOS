import { assert } from "../general.ts";

export async function displaySerial(serial: Uint8Array, width: number, height: number) {
    assert(width === 160);
    assert(height === 128);
    assert(serial.byteLength === 3 * 160 * 128);
    await Deno.writeFile("/tmp/tmpfs/minOStmp/screen.bin", serial);
    Deno.run({ cmd: ["python3", "./st7735.py"] });
}