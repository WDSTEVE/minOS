export class Image {
    readonly width: number;
    readonly height: number;
    data: Uint8Array[];
    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.data = Array.from(Array(this.height), () => new Uint8Array(3 * this.width));
    }
    serialize(headerSize = 0) {
        const serialData = new Uint8Array(3 * this.width * this.height + headerSize);
        for (let i = 0; i < this.height; i++) {
            serialData.set(this.data[i], i * this.width * 3 + headerSize);
        }
        return serialData;
    }
    toArray() {
        const arr = [];
        for (let i = 0; i < this.height; i++) {
            arr.push(...this.data[i]);
        }
        return arr;
    }
}

export class Layer extends Image {
    private messageSystem;
    updated = false;
    constructor(width: number, height: number, messageSystem: (cmd: string, args?: unknown[]) => void) {
        super(width, height);
        this.messageSystem = messageSystem;
    }
    update() {
        this.updated = true;
        this.messageSystem("display", [this.toArray(), this.width, this.height])
    }
}