export function assert(
    condition: unknown,
    msg?: string,
): asserts condition is true {
    if (condition !== true) {
        throw new Error(msg);
    }
}

export function baceURL (url:string){
    return new URL(url, import.meta.url).href;
}