// tslint:disable: max-classes-per-file

import { TapNote, TapNoteSubType, TapNotes, MAX_NOTE_ROW } from './NoteTypes';
import TimingData from './TimingData';
import { TapNoteType } from './NoteTypes';
import { NotImplementedError } from './Error';
import { ASSERT, DEBUG_ASSERT } from './Debug';
import { PassByRef } from './GameConstantsAndTypes';

// NoteData is organized by:
//   track - corresponds to different columns of notes on the screen
//   row/index - corresponds to subdivisions of beats

// C++ code used this type, we need a better type since in C++ maps are sorted.
// Without sorting, iteration over tracks becomes a problem. - Struz
// type TrackMap = Map<number, TapNote>;

export class TrackMap {
    // Shut tslint up about functions that may not exist until .proxy() runs
    [x: string]: any;

    private static skipOverride = ['set', 'entries', 'values', 'keys', 'constructor'];
    private static sortNumbersAsc(a: [number, TapNote], b: [number, TapNote]) {
        return a[0] - b[0];
    }
    // TODO: write tests for me to ensure I stay ordered
    // TODO: iterators - forward and backwards, and specific ranges

    public size: number;
    private map: Map<number, TapNote>;        /** The map object backing this. */
    private mapReverse: Map<number, TapNote>; /** Required for backwards iteration. */
    private isSorted: boolean;


    constructor() {
        this.map = new Map();
        this.mapReverse = new Map();
        this.size = 0;
        this.isSorted = true;
        this.autoSort = true;
        this.proxy();
    }

    // Iterator wrappers
    /** Wrapper for map.entries() that ensures that entries are looped in ascending order. */
    public entries(startAt?: number, endAt?: number) {
        this.sort();
        return new TrackMapIterator(this.map, IteratorDirection.Forwards, startAt, endAt);
    }
    public keys() {
        this.sort();
        return this.map.keys();
    }
    public values() {
        this.sort();
        return this.map.values();
    }
    public [Symbol.iterator](): IterableIterator<[number, TapNote]> {
        this.sort();
        return this.map[Symbol.iterator]();
    }
    // Reverse iterators. The reason behind using a reversed map to do reverse
    // iteration is that ES6 maps use hashing and internal [[MapData]] slots.
    // If we were to implement the reverse iteration using arrays we would lose
    // some efficiency, so we take the hit in terms of memory to store a
    // second copy of the map.
    public reverseEntries(startAt?: number, endAt?: number) {
        this.sort();
        return new TrackMapIterator(this.reverseMap, IteratorDirection.Backwards, startAt, endAt);
    }
    public reverseKeys() {
        this.sort();
        return this.mapReverse.keys();
    }
    public reverseValues() {
        this.sort();
        return this.mapReverse.values();
    }

    /** Wrapper for map.set() that sets some extra state. */
    public set(key: number, value: TapNote) {
        this.map.set(key, value);
        this.isSorted = false;
        this.size = this.map.size;
        return this;
    }

    /**
     * Sort the map - relatively expensive operation as it must create a new map.
     * Ideally we won't be using this much as we shouldn't be inserting mid-gameplay.
     */
    private sort() {
        if (this.isSorted) { return; }

        const sortedEntriesAsc = [...this.map.entries()].sort(TrackMap.sortNumbersAsc);
        // shallow copy with .slice() then reverse it. Possibly not necessary.
        const sortedEntriesDesc = sortedEntriesAsc.slice().reverse();

        this.map = new Map(sortedEntriesAsc);
        this.reverseMap = new Map(sortedEntriesDesc);
        this.isSorted = true;
        this.proxy();
        // TODO: make sure that .proxy() is also adding things to the reversed array
    }

    /**
     * Proxy the inner map's functions to the outside of this class.
     * This is so we can use all the map's features with very little work.
     * Each time we change the inner map we need to re-proxy.
     */
    private proxy() {
        const mapProps = Object.getOwnPropertyNames(Object.getPrototypeOf(this.map));
        // For each property of map that's a function and that we don't
        // want to override ourselves, proxy that function directly via a bound function.
        mapProps.forEach((prop) => {
            if (TrackMap.skipOverride.indexOf(prop) !== -1 ||
                typeof (this.map as any)[prop] !== 'function') {
                return;
            }
            const mapFunc = (this.map as any)[prop].bind(this.map);
            const reverseMapFunc = (this.mapReverse as any)[prop].bind(this.mapReverse);
            // We have to wrap the func rather than assign it directly to
            // ensure our .size method works.
            const wrapFunc = (...args: any) => {
                const retVal = mapFunc(...args);
                reverseMapFunc(...args);
                this.size = this.map.size;  // stay in sync
                // We're primarily concerned with the ascending map, so we return that
                return retVal;
            };
            this[prop] = wrapFunc;
        });
    }
}

enum IteratorDirection {
    Forwards,
    Backwards,
}

/**
 * Iterator over a TrackMap that keeps state about where in the track it is.
 */
class TrackMapIterator implements IterableIterator<[number, TapNote]> {
    /* Depending on the direction we need different comparisons for using
     * startAt and endAt. */
    private static compare(value1: number, value2: number, direction: IteratorDirection) {
        if (direction === IteratorDirection.Forwards) {
            return value1 >= value2;
        }
        return value1 <= value2;
    }

    private it: Iterator<[number, TapNote]>;
    // We need to store the last next() result as we internally need next() to
    // set up the iterator.
    private lastNextResult: IteratorResult<[number, TapNote]> | undefined;
    private direction: IteratorDirection;
    private start: number | undefined;
    private end: number | undefined;

    // TODO: make the startAt version of this as performant as the possible implementations
    // at https://en.cppreference.com/w/cpp/algorithm/lower_bound
    constructor(map: Map<number, TapNote>, direction: IteratorDirection,
                startAt?: number, endAt?: number) {
        this.it = map.entries();
        this.direction = direction;
        this.start = startAt;
        this.end = endAt;
        if (this.start === undefined) { return; }

        // Set the iterator to start at the given index
        // We need to use this.it.next() rather than this.next() so that
        // we get fine grained control over how we store lastNextResult and don't
        // skip too far ahead with extra this.it.next() calls.
        let result = this.it.next();
        while (!result.done) {
            if (TrackMapIterator.compare(result.value[0], this.start, this.direction)) {
                this.lastNextResult = result;
                return;
            }
            result = this.it.next();
        }
    }

    public next(): IteratorResult<[number, TapNote]> {
        if (this.lastNextResult === undefined) {
            this.lastNextResult = this.it.next();
        }
        const ret = this.lastNextResult;

        // If we've been told to end at a certain point and we're at that point
        // then send a done IteratorResult and stop iterating.
        if (this.end !== undefined) {
            if (TrackMapIterator.compare(ret.value[0], this.end, this.direction)) {
                return {value: ret.value, done: true};
            }
        }

        // Otherwise keep iterating as usual
        this.lastNextResult = this.it.next();
        return ret;
    }

    public [Symbol.iterator](): IterableIterator<[number, TapNote]> {
        return this;
    }

    // /** Peek the iterator without going anywhere.
    //  * Useful for assessing whether we start at the end of a range already.
    //  */
    // public peek(): IteratorResult<[number, TapNote]> {
    //     if (this.lastNextResult === undefined) {
    //         this.lastNextResult = this.it.next();
    //     }
    //     return this.lastNextResult;
    // }

    public track(): number {
        throw new NotImplementedError();
    }

    public row(): number {
        throw new NotImplementedError();
    }

    public finished(): boolean {
        // We can't know if we're finished if we haven't gone anywhere
        if (this.lastNextResult === undefined) {
            return false;
        }
        return this.lastNextResult.done;
    }

    // TODO: fill this out when I understand more about the use cases
}

// Helper functions that were #defined in C++. Translated with the same format for clarity.
/** Act on each non empty row in the specific track. */
export function FOREACH_NONEMPTY_ROW_IN_TRACK(
    nd: NoteData, track: number, row: PassByRef<number>,
    fn: (row: PassByRef<number>) => void) {
        // Takes row in so that it can pass it back out again if necessary
        for (row.value = -1; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            fn(row);
        }
    }
/** Act on each non empty row in the specified track within the specified range. */

/** Act on each non empty row in the specified track within the specified range, going in reverse order. */
/** Act on each non empty row for all of the tracks. */
export function FOREACH_NONEMPTY_ROW_ALL_TRACKS(
    nd: NoteData, row: PassByRef<number>, fn: (row: PassByRef<number>) => void) {
        for (row.value = -1; nd.getNextTapNoteRowForAllTracks(row); row.value++) {
            fn(row);
        }
    }
/** Act on each non empty row for all of the tracks within the specified range. */
// I'm not sure why but this loop is 1-indexed while the array is 0-indexed, so it translates between.
// TODO: make it all 0 indexed since the users add 1 to their values just to get them subtracted again here.
export function FOREACH_NONEMPTY_ROW_ALL_TRACKS_RANGE(
    nd: NoteData, row: PassByRef<number>, start: number,
    last: number, fn: (row: PassByRef<number>) => void) {
        for (row.value = start - 1; nd.getNextTapNoteRowForAllTracks(row) && row.value < last;) {
            fn(row);
        }
    }

/** Holds data about the notes that the player is supposed to hit. */
export class NoteData {
    // IMPORTANT: this is one hell of a class.....needs doing asap!
    // We need all track iterators and shit, it's wild

    // There's no point in inserting empty notes into the map.
    // Any blank space in the map is defined to be empty.
    public tapNotes: TrackMap[] = []; // TODO: make this private once we have a standard way of iterating over it
    public loaded: boolean = false;

    public setOccurranceTimeForAllTaps(timingData: TimingData) { throw new NotImplementedError(); }
    public countNotesInColumn(
        timingData: TimingData,
        noteCounts: Array<Map<TapNoteType, number>>,
        holdDurations: Array<Map<TapNoteSubType, number>>) { throw new NotImplementedError(); }

    public getNumTracks() { return this.tapNotes.length; }
    public setNumTracks(newNumTracks: number) {
        this.tapNotes.length = newNumTracks;
        for (let i = 0; i < newNumTracks; i++) {
            // If we extended it then make sure we create the new maps)
            this.tapNotes[i] = (this.tapNotes[i] === undefined ? new TrackMap() : this.tapNotes[i]);
        }
    }
    public isComposite() { throw new NotImplementedError(); }
    public equals(other: NoteData) { return this.tapNotes === other.tapNotes; }

    public getTapNote(track: number, row: number): TapNote {
        // TODO: I think I can improve the original application's performance by not
        // doing ANOTHER .get() here, but instead just returning the TapNote()
        // out of the function. Or keeping a constant iterator which can straight return the value.
        // Optimise later, only if performance suffers.
        const trackMap = this.tapNotes[track];
        const noteRow = trackMap.get(row);
        // The distinction betwen this and findTapNote is that this returns an empty note
        // if the note doesn't explicitly exist.
        return (noteRow === undefined) ? TapNotes.newEmpty() : noteRow;
    }

    public findTapNote(track: number, row: number): TapNote | undefined { return this.tapNotes[track].get(row); }
    public removeTapNote(track: number, row: number) { this.tapNotes[track].delete(row); }

    // I wonder if we'll need this - Struz
    /**
     * Return an iterator range for [rowBegin,rowEnd).
     *
     * This can be used to efficiently iterate trackwise over a range of notes.
     * It's like FOREACH_NONEMPTY_ROW_IN_TRACK_RANGE, except it only requires
     * two map searches (iterating is constant time), but the iterators will
     * become invalid if the notes they represent disappear, so you need to
     * pay attention to how you modify the data.
     * @param iTrack the column to use.
     * @param iStartRow the starting point.
     * @param iEndRow the ending point.
     * @param begin the eventual beginning point of the range.
     * @param end the eventual end point of the range.
     */
    public getTapNoteRange(track: number, startRow: number, endRow: number,
                           iterator: undefined, constIterator: undefined) { throw new NotImplementedError(); }
    // Omitted overloaded getTapNoteRange()

    // Omitted all the iterator funcs - need to work out how I'll handle this

    public getTapNoteRangeInclusive() { throw new NotImplementedError(); }
    // Omitted overloaded getTapNoteRangeInclusive()

    public getTapNoteRangeExclusive() { throw new NotImplementedError(); }
    // Omitted overloaded getTapNoteRangeExclusive()

    /* Returns the row of the first TapNote on the track that has a row greater than rowInOut. */
    public getNextTapNoteRowForTrack(track: number, rowInAndOut: PassByRef<number>, ignoreAutoKeysounds = false) {
        const mapTrack = this.tapNotes[track];
        const iter = mapTrack.entries(rowInAndOut.value + 1); // "find the first note for which row+1 < key == false"
        let entry = iter.next();
        if (entry.done) { return false; }

        DEBUG_ASSERT(entry.value[0] > rowInAndOut.value);

        if (ignoreAutoKeysounds) {
            while (entry.value[1].type === TapNoteType.AutoKeysound) {
                entry = iter.next();
                if (entry.done) { return false; }
            }
        }
        rowInAndOut.value = entry.value[0];
        return true;
    }

    public getNextTapNoteRowForAllTracks(rowInAndOut: PassByRef<number>) {
        let closestNextRow = MAX_NOTE_ROW;
        let anyHaveNextNote = false;
        for (let t = 0; t < this.getNumTracks(); t++) {
            const newRowThisTrack = {value: rowInAndOut.value};
            if (this.getNextTapNoteRowForTrack(t, newRowThisTrack)) {
                anyHaveNextNote = true;
                ASSERT(newRowThisTrack.value < MAX_NOTE_ROW, 'Row should never exceed MAX_NOTE_ROW');
                closestNextRow = Math.min(closestNextRow, newRowThisTrack.value);
            }
        }

        if (anyHaveNextNote) {
            rowInAndOut.value = closestNextRow;
            return true;
        }
        return false;
    }

    public getPrevTapNoteRowForTrack(track: number, rowInAndOut: PassByRef<number>) {
        const mapTrack = this.tapNotes[track];

        // Find the first note >= rowInOut.
        const iter = mapTrack.reverseEntries(rowInAndOut.value);

        // If we're at the beginning, we can't move back any more.
        const entry = iter.next();
        if (entry.done) { return false; }

        // Move back by one
        DEBUG_ASSERT(entry.value[0] < rowInAndOut.value);
        rowInAndOut.value = entry.value[0];
        return true;
    }

    public getPrevTapNoteRowForAllTracks(rowInAndOut: PassByRef<number>) {
        let closestPrevRow = 0;
        let anyHavePrevNote = false;
        for (let t = 0; t < this.getNumTracks(); t++) {
            const newRowThisTrack = {value: rowInAndOut.value};
            if (this.getPrevTapNoteRowForTrack(t, newRowThisTrack)) {
                anyHavePrevNote = true;
                DEBUG_ASSERT(newRowThisTrack.value < MAX_NOTE_ROW);
                closestPrevRow = Math.max(closestPrevRow, newRowThisTrack.value);
            }
        }

        if (anyHavePrevNote) {
            rowInAndOut.value = closestPrevRow;
            return true;
        }
        return false;
    }

    public moveTapNoteTrack(dest: number, src: number) { throw new NotImplementedError(); }
    public setTapNote(track: number, row: number, tn: TapNote) {
        DEBUG_ASSERT(track >= 0 && track < this.getNumTracks());

        if (row < 0) {
            return;
        }
        // There's no point in inserting empty notes into the map.
        // Any blank space in the map is defined to be empty.
        // If we're trying to insert an empty at a spot where another note
        // already exists, then we're really deleting from the map.
        if (tn.equals(TapNotes.EMPTY)) {
            const trackMap = this.tapNotes[track];
            // remove the element at this position (if any).
            // This will return either true or false.
            trackMap.delete(row);
        } else {
            this.tapNotes[track].set(row, tn);
        }
    }
    /**
     * @brief Add a hold note, merging other overlapping holds and destroying
     * tap notes underneath.
     * @param iTrack the column to work with.
     * @param iStartRow the starting row.
     * @param iEndRow the ending row.
     * @param tn the tap note.
     */
    public addHoldNote(track: number, startRow: number, endRow: number, tn: TapNote) {
        throw new NotImplementedError();
    }

    public clearRangeForTrack(rowBegin: number, rowEnd: number, track: number) { return new NotImplementedError(); }
    public clearRange(rowBegin: number, rowEnd: number) { return new NotImplementedError(); }
    public clearAll() {
        for (const track of this.tapNotes) {
            track.clear();
        }
    }
    public copyRange() { return new NotImplementedError(); }
    public copyAll() { return new NotImplementedError(); }

    public isRowEmpty(row: number) { return new NotImplementedError(); }
    /* Determine if a hold note lies on the given spot. Return true if so.  If
     * pHeadRow is non-nullptr, return the row of the head. (Note that this returns
     * false if a hold head lies on iRow itself.) */
    public isHoldNoteAtRow(track: number, row: number, headRow: PassByRef<number>) {
        // headRow is really a pass-by-ref single number

        /* Starting at iRow, search upwards. If we find a TapNoteType_HoldHead, we're within
         * a hold. If we find a tap, mine or attack, we're not--those never lie
         * within hold notes. Ignore autoKeysound. */
        for (const rowPbr = {value: row}; this.getPrevTapNoteRowForTrack(track, rowPbr) && rowPbr.value >= 0;) {
            const tn = this.getTapNote(track, rowPbr.value);
            switch (tn.type) {
                case TapNoteType.HoldHead:
                    if (tn.duration + rowPbr.value < row) {
                        return false;
                    }
                    headRow.value = rowPbr.value;
                    return true;

                case TapNoteType.Tap:
                case TapNoteType.Mine:
                case TapNoteType.Attack:
                case TapNoteType.Lift:
                case TapNoteType.Fake:
                    return false;

                case TapNoteType.Empty:
                case TapNoteType.AutoKeysound:
                    // ignore
                    continue;
                default:
                    throw new Error(`Unknwon TapNoteType: ${tn.type}`);
            }
        }

        return false;
    }

    public isThereATapAtRow(row: number) {
        return this.getFirstTrackWithTap(row) !== -1;
    }

    public isThereATapOrHoldHeadAtRow(row: number) {
        return this.getFirstTrackWithTapOrHoldHead(row) !== -1;
    }

    /**
     * In the given row return the first track with a tap type.
     * Returns -1 if no track has a tap type note.
     */
    public getFirstTrackWithTap(row: number) {
        for (let t = 0; t < this.getNumTracks(); t++) {
            const tn = this.getTapNote(t, row);
            if (tn.type === TapNoteType.Tap || tn.type === TapNoteType.Lift) {
                return t;
            }
        }
        return -1;
    }

    /**
     * In the given row return the first track with a tap or hold-head type.
     * Returns -1 if no track has a tap or hold-head type.
     */
    public getFirstTrackWithTapOrHoldHead(row: number) {
        for (let t = 0; t < this.getNumTracks(); t++) {
            const tn = this.getTapNote(t, row);
            if (tn.type === TapNoteType.Tap ||
                tn.type === TapNoteType.Lift ||
                tn.type === TapNoteType.HoldHead) {
                return t;
            }
        }
        return -1;
    }
    // TODO: finish me off sometime from NoteData.h
}
export default NoteData;
