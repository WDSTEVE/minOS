import * as Device from "../../device.ts";
import * as Draw from "../../draw.ts"
Device.setup(self).then(run);
Device.bindUpdate(update);

let dis;

async function run() {
    dis = Device.display;

    dis.background("white");
    const logo = await Device.loadImage("logo");
    dis.image(logo,
        dis.width / 2 - logo.width / 2,
        dis.height / 2 - logo.height / 2);
    dis.update();
}

function update() { }