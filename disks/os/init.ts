import * as Device from "../../device.ts";
Device.setup(self).then(run);
Device.bindUpdate(update);

function run() {
    Device.display.update();
}

function update() {}