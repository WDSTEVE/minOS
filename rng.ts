// jshint esversion: 6
// author WD_STEVE
// version 1.0.3
// TS

class StaticRNG {
    protected state: number;
    constructor(seedState?: number) {
        if (seedState == null) {
            this.state = this.timeState();
        } else {
            this.state = seedState % Number.MAX_SAFE_INTEGER;
        }
        this.scramble();
    }
    advance() {
        this.state = (this.state * 740297295458207 + 835664921249671) %
            Number.MAX_SAFE_INTEGER;
        return this;
    }
    protected timeState() {
        return new Date().getTime() % Number.MAX_SAFE_INTEGER;
    }
    protected scramble() {
        this.advance();
        this.advance();
        this.advance();
        return this;
    }
    get() {
        this.advance();
        return this.state / Number.MAX_SAFE_INTEGER;
    }
    getBool(change = 0.5) {
        this.advance();
        return this.get() < change;
    }
    getInt(min = 0, max = Number.MAX_SAFE_INTEGER) {
        this.advance();
        return Math.floor((max - min + 1) * this.get() + min);
    }
    getFloat(min = 0, max = 1) {
        this.advance();
        return (max - min) * this.get() + min;
    }
}

class RNG extends StaticRNG {
    protected seedStack: number[] = [];
    seed(seedState: number) {
        this.state = seedState % Number.MAX_SAFE_INTEGER;
        this.scramble();
        return this;
    }
    push(seedState: number) {
        this.seedStack.push(this.state);
        this.state = seedState % Number.MAX_SAFE_INTEGER;
        this.scramble();
        return this;
    }
    pop() {
        this.state = this.seedStack.pop() ?? this.timeState();
        return this;
    }
}

export default { StaticRNG, RNG, g: new StaticRNG() };
