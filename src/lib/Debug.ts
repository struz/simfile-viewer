// Debug helpers

// Ideally we find a way to completely compile this out in certain builds
export function DEBUG_ASSERT(cond: boolean) {
    if (!cond) {
// tslint:disable-next-line: no-debugger
        debugger;
        console.debug('Debug assert failed.');
        console.trace();
    }
}
