import { serialToBMP } from "../bmp.ts";
import { open } from "https://deno.land/x/opener/mod.ts";
import { serve, Server } from 'https://deno.land/std/http/server.ts';

let server: Server;
let bmp = serialToBMP(new Uint8Array(), 0, 0);

export async function displaySerial(serial: Uint8Array, width: number, height: number) {
    bmp = serialToBMP(serial, width, height);
    if (server == null) {
        startServer();
        await open("http://localhost:8080/");
    }
}

async function startServer() {
    server = serve({ hostname: '0.0.0.0', port: 8080 });
    for await (const req of server) {
        const url = req.url === "/" ? "/index.html" : req.url;
        const filePath = "./winBrowserDriver/browserPage" + url;
        try {
            if (url === "/screen.bmp") {
                req.respond({ body: bmp });
            } else {
                const data = await Deno.readFile(filePath);
                req.respond({ body: data });
            }
        } catch (error) {
            if (error.name === Deno.errors.NotFound.name) {
                console.log(`File (${filePath}) not found`);
                req.respond({ status: 404, body: '404: File not found' });
            } else {
                req.respond({ status: 500, body: '500: Internal Server Error' });
            }
        }
    }
}