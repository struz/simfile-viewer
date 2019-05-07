// tslint:disable: max-classes-per-file
import { TimingSegment, TimingSegmentType, SegmentEffectType, TimeSignatureSegment } from './TimingSegments';
import { NotImplementedError } from './Error';
import GAMESTATE from './GameState';
import { DEBUG_ASSERT, ASSERT } from './Debug';
import Helpers, { PassByRef } from './GameConstantsAndTypes';

const INVALID_INDEX: number = -1;

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
};

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

        // TODO: omg this is a complex function
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
        // TODO: probably not the best way to do this in js - Struz
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

    public getDetailedInfoForSecond(args: DetailedTimeInfo): void {
        // C++ code adds the hasted music rate * the global offset buffer here
        // We don't care...yet - Struz
        this.getDetailedInfoForSecondNoOffset(args);
    }

    public getDetailedInfoForSecondNoOffset(args: DetailedTimeInfo) {
        return;
        if (this.empty()) { return; }
        if (this.lineSegments.length > 0) {
            // IMPORTANT: we really need these lookups to work but for now fuck em
            // An offset of 0 should be okay til we see what we're dealing with.
            // Just use charts without stops or BPM changes.
        }
    }

    public getBeatFromElapsedTimeNoOffset(second: number): number {
        return 0;
        throw new NotImplementedError();
    }

    public getBeatFromElapsedTime(second: number): number {
        return 0;
        throw new NotImplementedError();
    }

    public getElapsedTimeFromBeatNoOffset(beat: number) {
        return 0;
        // IMPORTANT: we really need these lookups to work but for now fuck em
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
        return;

        if (searchMode === SearchMode.NONE) {
            this.lineSegments.length = bpms.length + stops.length + delays.length + warps.length;
        }
    }
}
export default TimingData;
