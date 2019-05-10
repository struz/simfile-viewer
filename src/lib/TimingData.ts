// tslint:disable: max-classes-per-file
import { TimingSegment, TimingSegmentType, SegmentEffectType,
    TimeSignatureSegment, BPMSegment, TickcountSegment,
    WarpSegment, StopSegment, DelaySegment } from './TimingSegments';
import { ASSERT } from './Debug';
import Helpers, { PassByRef } from './GameConstantsAndTypes';
import NoteHelpers from './NoteTypes';

const INVALID_INDEX: number = -1;

/* DummySegments: since our model relies on being able to get a segment at will,
 * whether one exists or not, we have a bunch of dummies to return if there is
 * no segment. It's kind of kludgy, but when we have functions making
 * indiscriminate calls to get segments at arbitrary rows, I think it's the
 * best solution we've got for now.
 *
 * Note that types whose SegmentEffectAreas are "Indefinite" are NULL here,
 * because they should never need to be used; we always have at least one such
 * segment in the TimingData, and if not, we'll crash anyway. -- vyhd */
const DummySegments: Array<TimingSegment | null> = [
    null, // BPMSegment
    new StopSegment(),
    new DelaySegment(),
    null, // TimeSignatureSegment
    new WarpSegment(),
    null, // LabelSegment
    null, // TickcountSegment
    null, // ComboSegment
    null, // SpeedSegment
    null, // ScrollSegment
    null, // Haven't implemented FakeSegment yet //new FakeSegment(),
];

enum Found {
    WARP,
    WARP_DESTINATION,
    BPM_CHANGE,
    STOP,
    DELAY,
    STOP_DELAY, // we have these two on the same row.
    MARKER,
    NOT_FOUND,
}

enum SearchMode {
    NONE,
    BEAT,
    SECOND,
}

/** Simple struct for finding events in timing data. */
class FindEventStatus {
    public bpm = 0;
    public warp = 0;
    public stop = 0;
    public delay = 0;
    public lastRow = 0;
    public lastTime = 0;
    public warpDestination = 0;
    public isWarping = false;
}

/** Struct for passing around timing info. */
export class DetailedTimeInfo {
    public second = 0;
    public beat = 0;
    public bpsOut = 0;
    public warpDestOut = 0;
    public warpBeginOut = -1; // int
    public freezeOut = false;
    public delayOut = false;
}

// Let's try a different method for optimizing GetBeatFromElapsedTime.
// Each timing segment is like a line segment.
// GetBeat/GetElapsedTime finds the segment at the given time, then
// linearly interpolates between its endpoints for the result.
// This should be faster than stepping forward from a known start point.
// RequestLookup should be called before gameplay starts, so that the lookup
// tables are populated.  ReleaseLookup should be called after gameplay
// finishes so that memory isn't wasted.
// RequestLookup actually tracks a requester count and only builds the
// lookup table if it hasn't already been requested.
// PrepareLookup is internal, for updating the lookup table directly.
// -Kyz
export class LineSegment {
    public startBeat: number = 0;
    public startSecond: number = 0;
    public endBeat: number = 0;
    public endSecond: number = 0;
    // The expand modifier needs the second in a special form that doesn't
    // increase during stops. -Kyz
    public startExpandSecond: number = 0;
    public endExpandSecond: number = 0;
    // bps needed for SongPosition.
    public bps: number = 0;
    public timeSegment: TimingSegment | null = null;

    public getTimeSegment(): TimingSegment {
        ASSERT(this.timeSegment !== null, 'Time segment must not be null');
        return this.timeSegment as TimingSegment;
    }

    public setForNext() {
        this.startBeat = this.endBeat;
        this.startSecond = this.endSecond;
        this.startExpandSecond = this.endExpandSecond;
        this.timeSegment = null;
    }
}

/** Holds data for translating beats<->seconds. */
export class TimingData {
    // Utility functions
    // -5.2-
    public static findLineSegment(sortedSegments: Map<number, LineSegment[]>, time: number) {
        ASSERT(sortedSegments.size > 0, 'findLineSegment called on empty sortedSegments');

        const it = sortedSegments.entries();
        let result = it.next();
        // Keep the last result so that if we are looking for 1.5 and we go from 1.0
        // to 2.0 we can return the data for 1.0 and interpolate.
        let resultLast = result;
        // We're guaranteed to get at least one resultLast since the assertion above says
        // the list is not empty.
        while (!result.done) {
            if (result.value[0] >= time) { break; }
            resultLast = result;
            result = it.next();
        }
        // If we reached the end, or went past `time`, go back one
        if (result.done || result.value[0] > time) {
            result = resultLast;
        }

        // Logically, if time is greater than seg_container->first, then we'll
        // be interpolating off of the last segment in seg_container.
        // Otherwise, they all have the same alt-time, so it doesn't matter which
        // we return.
        // -Kyz
        if (time > result.value[0]) {
            return result.value[1][result.value[1].length - 1];
        }
        return result.value[1][0];
    }

    public static findEvent(
        eventRow: PassByRef<number>, eventType: PassByRef<number>,
        status: FindEventStatus, beat: number, findMarker: boolean, bpms: TimingSegment[],
        warps: TimingSegment[], stops: TimingSegment[], delays: TimingSegment[]) {
            if (status.isWarping && NoteHelpers.beatToNoteRow(status.warpDestination) < eventRow.value) {
                eventRow.value = NoteHelpers.beatToNoteRow(status.warpDestination);
                eventType.value = Found.WARP_DESTINATION;
            }
            if (status.bpm < bpms.length && bpms[status.bpm].getRow() < eventRow.value) {
                eventRow.value = bpms[status.bpm].getRow();
                eventType.value = Found.BPM_CHANGE;
            }
            if (status.delay < delays.length && delays[status.delay].getRow() < eventRow.value) {
                eventRow.value = delays[status.delay].getRow();
                eventType.value = Found.DELAY;
            }
            if (findMarker && NoteHelpers.beatToNoteRow(beat) < eventRow.value) {
                eventRow.value = NoteHelpers.beatToNoteRow(beat);
                eventType.value = Found.MARKER;
            }
            if (status.stop < stops.length && stops[status.stop].getRow() < eventRow.value) {
                // Because of the way we PassByRef we need to assign a value like this to make it separate
                const tmpRow = {value: eventRow.value};
                eventRow.value = stops[status.stop].getRow();
                eventType.value = (tmpRow.value === eventRow.value) ? Found.STOP_DELAY : Found.STOP;
            }
            if (status.warp < warps.length && warps[status.warp].getRow() < eventRow.value) {
                eventRow.value = warps[status.warp].getRow();
                eventType.value = Found.WARP;
            }
        }

    /** The initial offset of a song. */
    private beat0OffsetInSecs: number = 0;
    // All of the following vectors must be sorted before gameplay.
    private timingSegments: TimingSegment[][] = [];

    private lineSegments: LineSegment[] = [];
    private segmentsByBeat: Map<number, LineSegment[]> = new Map();
    private segmentsBySecond: Map<number, LineSegment[]> = new Map();

    constructor() {
        // TimingSegments has one array per valid TimingSegmentType enum
        for (let i = 0; i < TimingSegmentType.NUM; i++) {
            this.timingSegments.push([]);
        }
    }

    public empty() {
        for (let tst = 0; tst < TimingSegmentType.NUM; tst++) {
            if (this.timingSegments[tst].length > 0) {
                return false;
            }
        }
        return true;
    }

    /**
     * Retrieve the TimingSegment at the specified row.
     * @param iNoteRow the row that has a TimingSegment.
     * @param tst the TimingSegmentType requested.
     * @return the segment in question.
     */
    public getSegmentAtRow(noteRow: number, tst: TimingSegmentType) {
        const segments = this.getTimingSegments(tst);

        if (segments.length === 0) {
            const retSegment = DummySegments[tst];
            if (retSegment === null) { throw new Error('FATAL: retSegment should never be null'); }
            return retSegment;
        }

        const index = this.getSegmentIndexAtRow(tst, noteRow);
        const seg = segments[index];

        switch (seg.getEffectType()) {
            case SegmentEffectType.Indefinite:
                // this segment is in effect at this row
                return seg;
            default:
                // if the returned segment isn't exactly on this row,
                // we don't want it, return a dummy instead
                if (seg.getRow() === noteRow) {
                    return seg;
                }
                const retSegment = DummySegments[tst];
                if (retSegment === null) { throw new Error('FATAL: retSegment should never be null'); }
                return retSegment;
        }
    }

    /* The following functions were all preprocessor defined so this is a giant block
       of code compared to what was in the C++. Unfortunate. Maybe we can clean this up
       one day -Struz */
    public getStopSegmentAtRow(noteRow: number) {
        const t = this.getSegmentAtRow(noteRow, TimingSegmentType.STOP);
        return (t as StopSegment);
    }
    public getDelaySegmentAtRow(noteRow: number) {
        const t = this.getSegmentAtRow(noteRow, TimingSegmentType.DELAY);
        return (t as DelaySegment);
    }

    /* convenience aliases (Set functions are deprecated) */
    public getStopAtRow(noteRow: number) { return this.getStopSegmentAtRow(noteRow).getPause(); }
    public getDelayAtRow(noteRow: number) { return this.getDelaySegmentAtRow(noteRow).getPause(); }

    public isWarpAtRow(noteRow: number) {
        const warps = this.getTimingSegments(TimingSegmentType.WARP);
        if (warps.length === 0) { return false; }

        const i = this.getSegmentIndexAtRow(TimingSegmentType.WARP, noteRow);
        if (i === -1) { return false; }

        const s = warps[i] as WarpSegment;
        const beatRow = NoteHelpers.noteRowToBeat(noteRow);
        if (s.getBeat() <= beatRow && beatRow < (s.getBeat() + s.getLength())) {
            // Allow stops inside warps to allow things like stop, warp, stop, warp, stop, and so on.
            if (this.getTimingSegments(TimingSegmentType.STOP).length === 0 &&
                this.getTimingSegments(TimingSegmentType.DELAY).length === 0) {
                    return true;
                }
            if (this.getStopAtRow(noteRow) !== 0 || this.getDelayAtRow(noteRow) !== 0) {
                return false;
            }
            return true;
        }
        return false;
    }
    public isWarpAtBeat(beat: number) { return this.isWarpAtRow(NoteHelpers.beatToNoteRow(beat)); }

    public isFakeAtRow(noteRow: number) {
        // We don't support fakes yet -Struz
        return false;
        // const fakes = this.getTimingSegments(TimingSegmentType.FAKE);
        // if (fakes.length === 0) { return false; }

        // const i = this.getSegmentIndexAtRow(TimingSegmentType.FAKE, noteRow);
        // if (i === -1) { return false; }

        // const s = fakes[i] as FakeSegment;
    }
    public isFakeAtBeat(beat: number) { return this.isFakeAtRow(NoteHelpers.beatToNoteRow(beat)); }

    public isJudgableAtRow(row: number) { return !this.isWarpAtRow(row) && !this.isFakeAtRow(row); }
    public isJudgableAtBeat(beat: number) { return this.isJudgableAtRow(NoteHelpers.beatToNoteRow(beat)); }

    public adjustOffset(amount: number) {
        this.setOffset(this.beat0OffsetInSecs + amount);
    }

    public setOffset(offset: number) {
        if (offset !== this.beat0OffsetInSecs) {
            this.beat0OffsetInSecs = offset;
            // TODO: it's changed, we probably need to recompute the data for anything using it
            // see: TimingData::set_offset in StepMania
        }
    }

    public getOffset() {
        return this.beat0OffsetInSecs;
    }

    public getTimingSegments(tst: TimingSegmentType) {
        return this.timingSegments[tst];
    }

    public addSegment(seg: TimingSegment) {
        // TODO: add debug logging flag and put a debug log here
        const tst = seg.getType();
        const segs = this.timingSegments[tst];

        // Optimisation: if this is our first segment, push and return
        if (segs.length === 0) {
            // TODO: make sure this shallow copy actually works for all delay types
            const cpy = Object.assign(Object.create(Object.getPrototypeOf(seg)), seg);
            segs.push(cpy);
        }

        const index = this.getSegmentIndexAtRow(tst, seg.getRow());
        if (index === INVALID_INDEX) {
            // TODO: make this error better
            throw new Error('ASSERTION FAILED: index should not be INVALID_INDEX');
        }
        const cur: TimingSegment = segs[index];
        const isNotable = seg.isNotable();
        const onSameRow = seg.getRow() === cur.getRow();

        // ignore changes that are zero and don't overwrite an existing segment
        if (!isNotable && !onSameRow) {
            return;
        }

        // TODO: all the splicing in here may have memory leaks if references remain - test this
        switch (seg.getEffectType()) {
            case SegmentEffectType.Row:
            case SegmentEffectType.Range:
                // if we're overwriting a change with a non-notable
                // one, take it to mean deleting the existing segment
                if (onSameRow && isNotable) {
                    // Removes the element in-place
                    segs.splice(index, 1);
                    return;
                }
                break;
            case SegmentEffectType.Indefinite:
                let prev: TimingSegment = cur;

                // get the segment before last; if we're on the same
                // row, get the segment in effect before 'cur'
                if (onSameRow && index > 0) {
                    prev = segs[index - 1];
                }
                // If there is another segment after this one, it might become
                // redundant when this one is inserted.
                // If the next segment is redundant, we want to move its starting row
                // to the row the new segment is being added at instead of erasing it
                // and adding the new segment.
                // If the new segment is also redundant, erase the next segment because
                // that effectively moves it back to the prev segment. -Kyz
                if (index < segs.length - 1) {
                    const next: TimingSegment = segs[index + 1];
                    if (seg.equals(next)) {
                        // The segment after this new one is redundant
                        if (seg.equals(prev)) {
                            // This new segment is redundant.  Erase the next segment and
                            // ignore this new one.
                            segs.splice(index + 1, 1);
                            // NOTE: this is actual pointer math in StepMania, not object .equals
                            // This seems to be shorthand for (onSameRow && index > 0) since that is the
                            // only way I can see prev being !== cur based on above code.
                            if (prev !== cur) {
                                segs.splice(index, 1);
                            }
                            return;
                        } else {
                            // Move the next segment's start back to this row.
                            next.setRow(seg.getRow());
                            // NOTE: this is actual pointer math in StepMania, not object .equals
                            // See earlier comment about the shorthand this is for.
                            if (prev !== cur) {
                                segs.splice(index, 1);
                            }
                            return;
                        }
                    } else {
                        // if true, this is redundant segment change
                        if (prev.equals(seg)) {
                            // NOTE: this is actual pointer math in StepMania, not object .equals
                            // See earlier comment about the shorthand this is for.
                            if (prev !== cur) {
                                segs.splice(index, 1);
                            }
                            return;
                        }
                    }
                } else {
                    // if true, this is redundant segment change
                    if (prev.equals(seg)) {
                        // NOTE: this is actual pointer math in StepMania, not object .equals
                        if (prev !== cur) {
                            segs.splice(index, 1);
                        }
                        return;
                    }
                }
                break;
            default:
                break;
        }

        // the segment at or before this row is equal to the new one; ignore it
        // NOTE: this is NOT pointer math - it's a .equals
        if (onSameRow && (cur === seg)) {
            return;
        }

        // Copy() the segment (which allocates a new segment), assign it
        // to the position of the old one, then delete the old pointer.
        // TODO: probably not the best way to do this in js -Struz
        const copy = Object.assign(Object.create(Object.getPrototypeOf(seg)), seg);
        if (onSameRow) {
            // TODO: check memory leaks
            segs[index] = copy;
        } else {
            // Find the first element that isn't comparatively less than `copy`
            let i = segs.findIndex((ts) => !ts.lessThan(copy));
            if (i === -1) {
                i = 0;
            }
            segs.splice(i, 0, copy);
        }
    }

    public noteRowToMeasureAndBeat(
        noteRow: number, measureIndexOut: PassByRef<number>,
        beatIndexOut: PassByRef<number>, rowsRemainder: PassByRef<number>) {
            // TODO: this function could have some weirdness given it was all with ints in
            // C++ and we're using number here. If anything goes wrong try more Math.truncs
            measureIndexOut.value = 0;
            const tSigs = this.getTimingSegments(TimingSegmentType.TIME_SIG);
            for (let i = 0; i < tSigs.length; i++) {
                const curSig = (tSigs[i] as TimeSignatureSegment);
                const segmentEndRow = (i + 1 === tSigs.length) ? Number.MAX_SAFE_INTEGER : curSig.getRow();

                const rowsPerMeasureThisSegment = curSig.getNoteRowsPerMeasure();
                // Usage of this variable fixes a bug from StepMania: https://github.com/stepmania/stepmania/issues/1080
                const rowsPerBeatThisSegment = curSig.getNoteRowsPerBeat();

                if (noteRow >= curSig.getRow()) {
                    // noteRow lands in this segment
                    const numRowsThisSegment = noteRow - curSig.getRow();
                    // don't round up (below)
                    const numMeasuresThisSegment = Math.trunc(numRowsThisSegment / rowsPerMeasureThisSegment);
                    measureIndexOut.value += numMeasuresThisSegment;
                    // These are all integers so we need to trunc for our callers benefit
                    beatIndexOut.value = Math.trunc(numRowsThisSegment / rowsPerBeatThisSegment);
                    rowsRemainder.value = numRowsThisSegment % rowsPerMeasureThisSegment;
                    return;
                } else {
                    // noteRow lands after this segment
                    const numRowsThisSegment = segmentEndRow - curSig.getRow();
                    const numMeasuresThisSegment = Math.trunc(
                        (numRowsThisSegment + rowsPerMeasureThisSegment - 1) / rowsPerMeasureThisSegment); // Round up
                    measureIndexOut.value += numMeasuresThisSegment;
                }
            }
            throw new Error('Failed to get measure and beat for note row');
        }

    public getSegmentIndexAtRow(tst: TimingSegmentType, row: number) {
        const segs = this.timingSegments[tst];
        if (segs.length === 0) {
            return INVALID_INDEX;
        }

        const min = 0;
        const max = segs.length - 1;
        let l = min;
        let r = max;
        // Do a binary search to find the row, if any
        while ( l <= r ) {
            const m = (l + r) / 2;
            if ( ( m === min || segs[m].getRow() <= row ) && ( m === max || row < segs[m + 1].getRow() ) ) {
                return m;
            } else if (segs[m].getRow() <= row) {
                l = m + 1;
            } else {
                r = m - 1;
            }
        }
        // row is before first segment of type tst
        return INVALID_INDEX;
    }

    // -5.2- introduced all of this stuff about detailed seconds?
    public getDetailedInfoForSecond(args: DetailedTimeInfo): void {
        // C++ code adds the hasted music rate * the global offset buffer here
        // We don't care...yet - Struz
        this.getDetailedInfoForSecondNoOffset(args);
    }

    public getDetailedInfoForSecondNoOffset(args: DetailedTimeInfo) {
        if (this.empty()) { return 0; }
        const segment = { value: new LineSegment() };
        if (this.lineSegments.length > 0) {
            segment.value = TimingData.findLineSegment(this.segmentsBySecond, args.second);
        } else {
            this.prepareLineLookup(SearchMode.SECOND, args.second, segment);
        }
        args.bpsOut = segment.value.bps;
        if (segment.value.timeSegment === null) { throw new Error('segment.timeSegment should never be null'); }
        switch (segment.value.timeSegment.getType()) {
            case TimingSegmentType.STOP:
                args.freezeOut = true;
                break;
            case TimingSegmentType.DELAY:
                args.delayOut = true;
                break;
            default:
                break;
        }
        if (segment.value.startSecond === segment.value.endSecond) {
            args.beat = segment.value.endBeat;
        } else {
            args.beat = Helpers.scale(args.second, segment.value.startSecond, segment.value.endSecond,
                segment.value.startBeat, segment.value.endBeat);
        }
    }

    public getBeatFromElapsedTime(second: number): number {
        if (this.empty()) { return 0; }
        const globOff = 0; // We don't support offset yet -Struz
        if (this.lineSegments.length > 0) {
            return this.getLineBeatFromSecond(second + globOff);
        } else {
            const segment = { value: new LineSegment() };
            this.prepareLineLookup(SearchMode.SECOND, second + globOff, segment);
            if (segment.value.startSecond === segment.value.endSecond) {
                return segment.value.endBeat;
            }
            return Helpers.scale(second, segment.value.startSecond, segment.value.endSecond,
                segment.value.startBeat, segment.value.endBeat);
        }
    }

    public getBeatFromElapsedTimeNoOffset(second: number): number {
        // We don't support offset yet so this function does the same. Pass through. -Struz
        return this.getBeatFromElapsedTime(second);
    }

    public getElapsedTimeFromBeatNoOffset(beat: number) {
        if (this.empty()) { return 0; }
        if (this.lineSegments.length > 0) {
            return this.getLineSecondFromBeat(beat);
        } else {
            const segment: PassByRef<LineSegment> = { value: new LineSegment() };
            this.prepareLineLookup(SearchMode.BEAT, beat, segment);
            if (segment.value.startBeat === segment.value.endBeat) {
                if (segment.value.timeSegment === null) { throw new Error('timeSegment should never be null'); }
                if (segment.value.timeSegment.getType() === TimingSegmentType.DELAY) {
                    return segment.value.endSecond;
                }
                return segment.value.startSecond;
            }
            return Helpers.scale(beat, segment.value.startBeat, segment.value.endBeat,
                segment.value.startSecond, segment.value.endSecond);
        }
    }

    public getElapsedTimeFromBeat(beat: number) {
        return this.getElapsedTimeFromBeatNoOffset(beat);
        // The C++ code handles hasted music rate here but we don't implement that - Struz
    }

    // Return the end time if the input dist is 0 sometimes:
    //   A: Calculating beat from second
    //      1. Segment is a warp.  Warp is instant, so return the end beat.
    //      2. Segment is a delay or stop.  Start and end beat are the same.
    //   B: Calculating second from beat
    //      1. Segment is a warp.  Start and end second are the same.
    //      2. Segment is a delay.  Delay happens before the beat, so return the
    //         end second.
    //      3. Segment is a stop.  Stop happens after the beat, so return the
    //         start second.
    //   A bpm segment does not have zero distance in either direction.

    public getLineBeatFromSecond(from: number) {
        const segment = TimingData.findLineSegment(this.segmentsBySecond, from);
        if (segment.startSecond === segment.endSecond) {
            return segment.endBeat;
        }
        return Helpers.scale(from, segment.startSecond, segment.endSecond,
            segment.startBeat, segment.endBeat);
    }

    public getLineSecondFromBeat(from: number) {
        const segment = TimingData.findLineSegment(this.segmentsByBeat, from);
        if (segment.startBeat === segment.endBeat) {
            if (segment.getTimeSegment().getType() === TimingSegmentType.DELAY) {
                return segment.endSecond;
            }
            return segment.startSecond;
        }
        return Helpers.scale(from, segment.startBeat, segment.endBeat,
            segment.startSecond, segment.endSecond);
    }

    /** Prepare the lookup tables. Call this before gameplay. */
    public prepareLineLookup(searchMode: SearchMode, searchTime: number, searchRet: PassByRef<LineSegment>) {
        const bpms = this.getTimingSegments(TimingSegmentType.BPM);
        const stops = this.getTimingSegments(TimingSegmentType.STOP);
        const delays = this.getTimingSegments(TimingSegmentType.DELAY);
        const warps = this.getTimingSegments(TimingSegmentType.WARP);

        // IMPORTANT: finish this later

        if (searchMode === SearchMode.NONE) {
            this.lineSegments.length = bpms.length + stops.length + delays.length + warps.length;
        }
        const status = new FindEventStatus();

        // Place an initial bpm segment in negative time before the song begins.
        // Without this, if there is a stop at beat 0, arrows will not move until
        // after beat 0 passes. -Kyz
        const firstBps = (bpms[0] as BPMSegment).getBps();
        const nextLine = new LineSegment();
        nextLine.startBeat = -firstBps;
        nextLine.startSecond = -this.beat0OffsetInSecs - 1;
        nextLine.endBeat = 0;
        nextLine.endSecond = -this.beat0OffsetInSecs;
        nextLine.startExpandSecond = -this.beat0OffsetInSecs - 1;
        nextLine.endExpandSecond = -this.beat0OffsetInSecs;
        nextLine.bps = firstBps;
        nextLine.timeSegment = bpms[0];

        switch (searchMode) {
            case SearchMode.NONE: this.lineSegments.push(nextLine); break;
            case SearchMode.BEAT:
                if (nextLine.endBeat > searchTime) {
                    searchRet.value = nextLine;
                    return;
                }
                break;
            case SearchMode.SECOND:
                if (nextLine.endSecond > searchTime) {
                    searchRet.value = nextLine;
                    return;
                }
                break;
            default:
                break;
        }
        nextLine.setForNext();

        let secsPerBeat = 1 / nextLine.bps;
        let finished = false;
        // Placement order:
        //   warp
        //   delay
        //   stop
        //   bpm
        // Stop and delay segments can be placed as complete lines.
        // A warp needs to be broken into parts at every stop or delay that occurs
        // inside it.
        // When a warp occurs inside a warp, whichever has the greater destination
        // is used.
        // A bpm segment is placed when between two other segments.
        // -Kyz
        const maxTime = 16777216;
        let curBpmSegment = bpms[0];
        const curWapSegment: TimingSegment | null = null;
        while (!finished) {
            // TODO: find event, for now just assume we find a BPM change once
            const eventRow: PassByRef<number> = { value: Number.MAX_SAFE_INTEGER };
            const eventType: PassByRef<number> = { value: Found.NOT_FOUND };
            TimingData.findEvent(eventRow, eventType, status, maxTime, false,
                bpms, warps, stops, delays);
            // TODO: handle other types of events too
            if (eventType.value === Found.NOT_FOUND) {
                nextLine.endBeat = nextLine.startBeat + 1;
                const secondsChange = nextLine.startSecond + secsPerBeat;
                nextLine.endSecond = secondsChange;
                nextLine.endExpandSecond = nextLine.startExpandSecond + secondsChange;
                nextLine.bps = (curBpmSegment as BPMSegment).getBps();
                // Extend the current BPM segment into the nextLine
                nextLine.timeSegment = curBpmSegment;
                switch (searchMode) {
                    case SearchMode.NONE: this.lineSegments.push(nextLine); break;
                    case SearchMode.BEAT:
                    case SearchMode.SECOND:
                        searchRet.value = nextLine;
                        return;
                    default:
                        break;
                }
                finished = true;
                break;
            }
            // IMPORTANT: warp stuff omitted, put it in later
            switch (eventType.value) {
                // TODO: put in the other cases
                case Found.BPM_CHANGE:
                    curBpmSegment = bpms[status.bpm];
                    nextLine.bps = (curBpmSegment as BPMSegment).getBps();
                    secsPerBeat = 1 / nextLine.bps; // This doesn't seem used, but it was in the code - Struz
                    status.bpm++;
                    break;
                default:
                    break;
            }
            status.lastRow = eventRow.value;
        }
        // ASSERT_M(search_mode == SEARCH_NONE, "PrepareLineLookup made it to the end while not in search_mode none.");
        // m_segments_by_beat and m_segments_by_second cannot be built in the
        // traversal above that builds m_line_segments because the vector
        // reallocates as it grows. -Kyz
          // I don't think this holds true for JS -Struz
        let curSegmentsByBeat = this.segmentsByBeat.get(0);
        if (curSegmentsByBeat === undefined) { throw new Error('curSegmentsByBeat should never be undefined'); }
        let curSegmentsBySecond = this.segmentsBySecond.get(-this.beat0OffsetInSecs);
        if (curSegmentsBySecond === undefined) { throw new Error('curSegmentsBySecond should never be undefined'); }
        let curBeat = 0;
        let curSecond = 0;
        // Push into segmentsByBeat and segmentsBySecond the lineSegments that were made above
        for (const seg of this.lineSegments) {
            // ADD_SEG(beat)
            if (seg.startBeat > curBeat) {
                curSegmentsByBeat = this.segmentsByBeat.get(seg.startBeat);
                if (curSegmentsByBeat === undefined) {
                    throw new Error('curSegmentsByBeat should never be undefined');
                }
                curBeat = seg.startBeat;
            }
            curSegmentsByBeat.push(seg);
            // ADD_SEG(sec)
            if (seg.startSecond > curSecond) {
                curSegmentsBySecond = this.segmentsBySecond.get(seg.startSecond);
                if (curSegmentsBySecond === undefined) {
                    throw new Error('curSegmentsBySecond should never be undefined');
                }
                curSecond = seg.startSecond;
            }
            curSegmentsBySecond.push(seg);
        }
    }

    public tidyUpData(allowEmpty: boolean) {
        if (allowEmpty && this.empty()) {
            return;  // Steps with empty timing data revert to song timing
        }

        // If there are no BPM segments, provide a default.
        if (this.timingSegments[TimingSegmentType.BPM].length === 0) {
            console.warn('Song has no BPM segments, default 60 provided.');
            this.addSegment(new BPMSegment(0, 60));
        }

        // Make sure the first BPM segment starts at beat 0.
        if (this.timingSegments[TimingSegmentType.BPM][0].getRow() !== 0) {
            this.timingSegments[TimingSegmentType.BPM][0].setRow(0);
        }

        // If no time signature specified, assume default time for the whole song.
        if (this.timingSegments[TimingSegmentType.TIME_SIG].length === 0) {
            this.addSegment(new TimeSignatureSegment(0));
        }

        // Likewise, if no tickcount signature is specified, assume 4 ticks
        // per beat for the entire song. The default of 4 is chosen more
        // for compatibility with the main Pump series than anything else.
        // (TickcountSegment's constructor handles that now. -- vyhd)
        if (this.timingSegments[TimingSegmentType.TICKCOUNT].length === 0) {
            this.addSegment(new TickcountSegment(0));
        }

        // Have a default combo segment of one just in case.
        // if (this.timingSegments[TimingSegmentType.COMBO].length === 0) {
        //     this.addSegment(new ComboSegment(0));
        // }
        // TODO: uncomment when we implement combo segments

        // Have a default label segment just in case.
        // if (this.timingSegments[TimingSegmentType.LABEL].length === 0) {
        //     this.addSegment(new LabelSegment(0));
        // }
        // TODO: uncomment when we implement label segments

        // Always be sure there is a starting speed.
        // if (this.timingSegments[TimingSegmentType.SPEED].length === 0) {
        //     this.addSegment(new SpeedSegment(0));
        // }
        // IMPORTANT: uncomment when we implement speed segments

        // Always be sure there is a starting scrolling factor.
        // if (this.timingSegments[TimingSegmentType.SCROLL].length === 0) {
        //     this.addSegment(new ScrollSegment(0));
        // }
        // IMPORTANT: uncomment when we implement speed segments
    }
}
export default TimingData;
