import { Image } from "./image.ts";

export function serialToBMP(data: Uint8Array, width: number, height: number) {
    const fileData = new Uint8Array(3 * width * height + 54);
    fileData.set(data, 54);
    injectBMPheader(fileData, width, height);
    return fileData;
}

export function loadBMP(url: string | URL) {
    return new Promise<Image>((resolve, reject) => {
        Deno.readFile(url).then(data => {
            const file = new DataView(data.buffer);
            const width = file.getInt32(18, true);
            const height = file.getInt32(22, true);
            const image = new Image(width, height);
            for (let i = 0; i < height; i++) {
                image.data[i] = data.slice(54 + 3 * width * i, 54 + 3 * width * (i + 1));
            }
            resolve(image);
        }, reject)
    });
}

function injectBMPheader(data: Uint8Array, width: number, height: number) {
    const file = new DataView(data.buffer);

    // file header
    file.setUint8(0, 0x42); // B
    file.setUint8(1, 0x4D); // M
    file.setUint32(2, file.byteLength, true);
    file.setUint16(6, 0, true);
    file.setUint16(8, 0, true);
    file.setUint32(10, 54, true);

    // dib header (Windows BITMAPINFOHEADER)
    file.setUint32(14, 40, true);
    file.setInt32(18, width, true);
    file.setInt32(22, height, true);
    file.setUint16(26, 1, true);
    file.setUint16(28, 24, true);
    file.setUint32(30, 0, true);
    file.setUint32(34, 0, true);
    file.setInt32(38, 2000, true);
    file.setInt32(42, 2000, true);
    file.setInt32(46, 0, true);
    file.setInt32(50, 0, true);
}