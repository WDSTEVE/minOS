type colorFormat = [number] | [number, number, number] | [string];

export class Image {
    readonly width: number;
    readonly height: number;
    readonly bottom: number;
    data: Uint8Array[];
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.bottom = this.height - 1;
        this.data = Array.from(Array(this.height), () => new Uint8Array(3 * this.width));
    }
    serialize(headerSize = 0, reverse = false) {
        const serialData = new Uint8Array(3 * this.width * this.height + headerSize);
        const transform = reverse ?
            (i: number) => this.bottom - i :
            (i: number) => i;
        for (let i = 0; i < this.height; i++) {
            serialData.set(this.data[i], transform(i) * this.width * 3 + headerSize);
        }
        return serialData;
    }
    toArray(reverse = false) {
        const arr = [];
        if (reverse) {
            for (let i = this.bottom; i >= 0; i--) {
                arr.push(...this.data[i]);
            }
        } else {
            for (let i = 0; i < this.height; i++) {
                arr.push(...this.data[i]);
            }
        }
        return arr;
    }
}

export class Layer extends Image {
    private messageSystem;
    updated = false;
    private stateStack: [Color, Color | null][] = [];
    fill = new Color(255);
    stroke: Color | null = null;
    constructor(width: number, height: number, messageSystem: (cmd: string, args?: unknown[]) => void) {
        super(width, height);
        this.messageSystem = messageSystem;
    }
    update() {
        if (this.updated)
            return;
        this.updated = true;
        this.messageSystem("display", [this.toArray(true), this.width, this.height])
    }
    push() {
        this.stateStack.push([this.fill, this.stroke]);
    }
    pop() {
        const state = this.stateStack.pop();
        if (state === undefined)
            return;
        [this.fill, this.stroke] = state;
    }
    pixel(color: Color, x: number, y: number) {
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || x >= this.width || y < 0 || y >= this.height)
            return;
        this.updated = false;
        this.data[y][x * 3 + 2] = color.r;
        this.data[y][x * 3 + 1] = color.g;
        this.data[y][x * 3 + 0] = color.b;
    }
    line(x1: number, y1: number, x2: number, y2: number) {
        const dx = Math.abs(x1 - x2);
        const dy = Math.abs(y1 - y2);
    }
    rect(x: number, y: number, w: number, h: number) {
        for (let yOff = 0; yOff < h; yOff++) {
            if (yOff === 0 || yOff === h - 1) {
                for (let xOff = 0; xOff < w; xOff++) { // stroke top / bottome
                    this.pixel(this.getStroke(), x + xOff, y + yOff);
                }
            } else {
                this.pixel(this.getStroke(), x + 0, y + yOff); // stroke right
                for (let xOff = 1; xOff < w - 1; xOff++) {
                    this.pixel(this.fill, x + xOff, y + yOff);
                }
                this.pixel(this.getStroke(), x + w - 1, y + yOff); // stroke left
            }
        }
    }
    background(...args: colorFormat) {
        this.push();
        this.stroke = null;
        this.fill = new Color(...args);
        this.rect(0, 0, this.width, this.height);
        this.pop();
    }
    image(image: Image, x: number, y: number) { // uses the native Uint8Array.set method to draw lines fast, breaks when image goes off side of screen
        x = Math.floor(x);
        y = Math.floor(y);
        if (x < 0 || x + image.width > this.width) {
            this.slowImage(image, x, y);
            return;
        }
        this.updated = false;
        for (let yOff = 0; yOff < image.height; yOff++) {
            if (yOff + y < 0 || yOff + y >= this.height)
                continue;
            this.data[yOff + y].set(image.data[yOff], x * 3);
        }
    }
    slowImage(image: Image, x: number, y: number) { // slower but more flexable than .image
        this.updated = false;
        for (let yOff = 0; yOff < image.height; yOff++) {
            if (yOff + y < 0 || yOff + y >= this.height)
                continue;
            for (let xOff = 0; xOff < image.width; xOff++) {
                if (xOff + x < 0 || xOff + x >= this.width)
                    continue;
                this.data[yOff + y][(xOff + x) * 3 + 0] = image.data[yOff][xOff * 3 + 0]; // r
                this.data[yOff + y][(xOff + x) * 3 + 1] = image.data[yOff][xOff * 3 + 1]; // g
                this.data[yOff + y][(xOff + x) * 3 + 2] = image.data[yOff][xOff * 3 + 2]; // b
            }
        }
    }
    getStroke() {
        if (this.stroke === null)
            return this.fill;
        else
            return this.stroke;
    }
}

const colors: { [key: string]: number[] } = {
    "white": [255, 255, 255],
    "red": [255, 0, 0],
    "yellow": [255, 255, 0],
    "green": [0, 255, 0],
    "cyan": [0, 255, 255],
    "blue": [0, 0, 255],
    "purple": [255, 0, 255],
    "black": [0, 0, 0]
}

export class Color {
    r: number;
    g: number;
    b: number;
    constructor(...args: colorFormat) {
        if (args.length === 1) {
            if (typeof args[0] === "number") { // value
                this.r = args[0];
                this.g = args[0];
                this.b = args[0];
            } else {
                if (args[0][0] === "#") { // hex color
                    const color = parseInt(args[0].substring(1, 7), 16);
                    this.r = Math.floor(color / 65536) % 256;
                    this.g = Math.floor(color / 256) % 256;
                    this.b = color % 256;
                } else { // named color
                    const color = colors[<string>args[0].toLowerCase()] ?? [0, 0, 0];
                    this.r = color[0];
                    this.g = color[1];
                    this.b = color[2];
                }
            }
        } else { // rgb
            this.r = args[0];
            this.g = args[1];
            this.b = args[2];
        }
    }
}