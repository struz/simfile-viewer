// tslint:disable: max-classes-per-file
import { TimingSegment, TimingSegmentType, SegmentEffectType,
    TimeSignatureSegment, BPMSegment, TickcountSegment,
    WarpSegment, StopSegment, DelaySegment } from './TimingSegments';
import { PassByRef } from './GameConstantsAndTypes';
import NoteHelpers from './NoteTypes';
import { NotImplementedError } from './Error';

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

enum FoundEventType {
    WARP,
    WARP_DESTINATION,
    BPM_CHANGE,
    STOP,
    DELAY,
    STOP_DELAY, // we have these two on the same row.
    MARKER,
    NOT_FOUND,
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

// GetBeatArgs, GetBeatStarts, m_beat_start_lookup, m_time_start_lookup,
// PrepareLookup, and ReleaseLookup form a system for speeding up finding
// the current beat and bps from the time, or finding the time from the
// current beat.
// The lookup tables contain indices for the beat and time finding
// functions to start at so they don't have to walk through all the timing
// segments.
// PrepareLookup should be called before gameplay starts, so that the lookup
// tables are populated.  ReleaseLookup should be called after gameplay
// finishes so that memory isn't wasted.
// -Kyz
/** Struct for passing around timing info. */
export class GetBeatArgs {
    public elapsedTime = 0;
    public beat = 0;
    public bpsOut = 0;
    public warpDestOut = 0;
    public warpBeginOut = -1; // int
    public freezeOut = false;
    public delayOut = false;
}
export class GetBeatStarts {
    public bpm = 0;     // int
    public warp = 0;    // int
    public stop = 0;    // int
    public delay = 0;   // int
    public lastRow = 0; // int
    public lastTime = 0;
    public warpDestination = 0;
    public isWarping = false;
}
/** A pair representing <beat or second, GetBeatStarts> */
type LookupItem = [number, GetBeatStarts];
type BeatStartLookup = Array<LookupItem | undefined>;

/** Holds data for translating beats<->seconds. */
export class TimingData {
    // Utility functions
    public static findEntryInLookup(lookup: BeatStartLookup, entry: number): LookupItem | undefined {
        if (lookup.length === 0) { return undefined; }
        let lower = 0;
        let upper = lookup.length - 1;

        // If the entry we're looking for is outside the bounds of the array
        // then fail fast
        let lookupItem = lookup[lower];
        if (lookupItem === undefined) { throw new Error('lookup[lower] must be defined'); }
        if (lookupItem[0] > entry) {
            return undefined;
        }
        lookupItem = lookup[upper];
        if (lookupItem === undefined) { throw new Error('lookup[upper] must be defined'); }
        if (lookupItem[0] < entry) {
            // See explanation at the end of this function. -Kyz
            return lookup[upper - 1];
        }

        // Otherwise use a binary search to find it
        while (upper - lower > 1) {
            const next = Math.trunc((upper + lower) / 2); // int
            lookupItem = lookup[next];
            if (lookupItem === undefined) { throw new Error('lookup[next] must be defined'); }
            if (lookupItem[0] > entry) {
                upper = next;
            } else if (lookupItem[0] < entry) {
                lower = next;
            } else {
                // We found the element
                lower = next;
                break;
            }
        }
        // If the time or beat being looked up is close enough to the starting
        // point that is returned, such as putting the time inside a stop or delay,
        // then it can make arrows unhittable.  So always return the entry before
        // the closest one to prevent that. -Kyz
        if (lower === 0) { return undefined; }
        return lookup[lower - 1];
    }

    public static findEvent(
        eventRow: PassByRef<number>, eventType: PassByRef<number>,
        status: FindEventStatus, beat: number, findMarker: boolean, bpms: TimingSegment[],
        warps: TimingSegment[], stops: TimingSegment[], delays: TimingSegment[]) {
            if (status.isWarping && NoteHelpers.beatToNoteRow(status.warpDestination) < eventRow.value) {
                eventRow.value = NoteHelpers.beatToNoteRow(status.warpDestination);
                eventType.value = FoundEventType.WARP_DESTINATION;
            }
            if (status.bpm < bpms.length && bpms[status.bpm].getRow() < eventRow.value) {
                eventRow.value = bpms[status.bpm].getRow();
                eventType.value = FoundEventType.BPM_CHANGE;
            }
            if (status.delay < delays.length && delays[status.delay].getRow() < eventRow.value) {
                eventRow.value = delays[status.delay].getRow();
                eventType.value = FoundEventType.DELAY;
            }
            if (findMarker && NoteHelpers.beatToNoteRow(beat) < eventRow.value) {
                eventRow.value = NoteHelpers.beatToNoteRow(beat);
                eventType.value = FoundEventType.MARKER;
            }
            if (status.stop < stops.length && stops[status.stop].getRow() < eventRow.value) {
                // Because of the way we PassByRef we need to assign a value like this to make it separate
                const tmpRow = {value: eventRow.value};
                eventRow.value = stops[status.stop].getRow();
                eventType.value = (tmpRow.value === eventRow.value) ? FoundEventType.STOP_DELAY : FoundEventType.STOP;
            }
            if (status.warp < warps.length && warps[status.warp].getRow() < eventRow.value) {
                eventRow.value = warps[status.warp].getRow();
                eventType.value = FoundEventType.WARP;
            }
        }

    // Beat<->Second translation structures
    public beatStartLookup: BeatStartLookup = [];
    public timeStartLookup: BeatStartLookup = [];

    /** The initial offset of a song. */
    private beat0OffsetInSecs: number = 0;
    // All of the following vectors must be sorted before gameplay.
    private timingSegments: TimingSegment[][] = [];

    constructor() {
        // TimingSegments has one array per valid TimingSegmentType enum
        for (let i = 0; i < TimingSegmentType.NUM; i++) {
            this.timingSegments.push([]);
        }
    }

    public getBeatInternal(start: GetBeatStarts, args: GetBeatArgs, maxSegment: number) {
        const segs = this.timingSegments;
        const bpms = segs[TimingSegmentType.BPM];
        const warps = segs[TimingSegmentType.WARP];
        const stops = segs[TimingSegmentType.STOP];
        const delays = segs[TimingSegmentType.DELAY];
        let curSegment = start.bpm + start.warp + start.stop + start.delay;

        let bps = this.getBpmAtRow(start.lastRow) / 60;

        while (curSegment < maxSegment) {
            const eventRow = { value: Number.MAX_SAFE_INTEGER };
            const eventType = { value: FoundEventType.NOT_FOUND };
            TimingData.findEvent(eventRow, eventType, start, 0, false, bpms, warps, stops, delays);
            if (eventType.value === FoundEventType.NOT_FOUND) { break; }
            let timeToNextEvent = start.isWarping ? 0 :
                NoteHelpers.noteRowToBeat(eventRow.value - start.lastRow) / bps;
            let nextEventTime = start.lastTime + timeToNextEvent;
            if (args.elapsedTime < nextEventTime) { break; }
            start.lastTime = nextEventTime;

            switch (eventType.value) {
                case FoundEventType.WARP_DESTINATION:
                    start.isWarping = false;
                    break;
                case FoundEventType.BPM_CHANGE:
                    bps = (bpms[start.bpm] as BPMSegment).getBps();
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.bpm++;
                    break;
                case FoundEventType.DELAY:
                case FoundEventType.STOP_DELAY:
                    const delaySeg = (delays[start.delay] as DelaySegment);
                    timeToNextEvent = delaySeg.getPause();
                    nextEventTime = start.lastTime + timeToNextEvent;
                    if (args.elapsedTime < nextEventTime) {
                        args.freezeOut = false;
                        args.delayOut = true;
                        args.beat = delaySeg.getBeat();
                        args.bpsOut = bps;
                        return;
                    }
                    start.lastTime = nextEventTime;
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.delay++;
                    if (eventType.value === FoundEventType.DELAY) { break; }
                case FoundEventType.STOP:
                    const stopSeg = (stops[start.stop] as StopSegment);
                    timeToNextEvent = stopSeg.getPause();
                    nextEventTime = start.lastTime + timeToNextEvent;
                    if (args.elapsedTime < nextEventTime) {
                        args.freezeOut = true;
                        args.delayOut = false;
                        args.beat = stopSeg.getBeat();
                        args.bpsOut = bps;
                        return;
                    }
                    start.lastTime = nextEventTime;
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.stop++;
                    break;
                case FoundEventType.WARP:
                    start.isWarping = true;
                    const warpSeg = (warps[start.warp] as WarpSegment);
                    const warpSum = warpSeg.getLength() + warpSeg.getBeat();
                    if (warpSum > start.warpDestination) {
                        start.warpDestination = warpSum;
                    }
                    args.warpBeginOut = eventRow.value;
                    args.warpDestOut = start.warpDestination;
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.warp++;
                    break;
                default:
                    break;
            }
            start.lastRow = eventRow.value;
        }

        if (args.elapsedTime === Number.MAX_VALUE) {
            args.elapsedTime = start.lastTime;
        }
        args.beat = NoteHelpers.noteRowToBeat(start.lastRow) + (args.elapsedTime - start.lastTime) * bps;
        args.bpsOut = bps;
    }

    public getElapsedTimeInternal(start: GetBeatStarts, beat: number, maxSegment: number) {
        const segs = this.timingSegments;
        const bpms = segs[TimingSegmentType.BPM];
        const warps = segs[TimingSegmentType.WARP];
        const stops = segs[TimingSegmentType.STOP];
        const delays = segs[TimingSegmentType.DELAY];
        let curSegment = start.bpm + start.warp + start.stop + start.delay;

        let bps = this.getBpmAtRow(start.lastRow) / 60;
        const findMarker = beat < Number.MAX_VALUE;

        while (curSegment < maxSegment) {
            const eventRow = { value: Number.MAX_SAFE_INTEGER };
            const eventType = { value: FoundEventType.NOT_FOUND };
            TimingData.findEvent(eventRow, eventType, start, beat, findMarker, bpms, warps, stops, delays);
            let timeToNextEvent = start.isWarping ? 0 :
                NoteHelpers.noteRowToBeat(eventRow.value - start.lastRow) / bps;
            let nextEventTime = start.lastTime + timeToNextEvent;
            start.lastTime = nextEventTime;

            switch (eventType.value) {
                case FoundEventType.WARP_DESTINATION:
                    start.isWarping = false;
                    break;
                case FoundEventType.BPM_CHANGE:
                    bps = (bpms[start.bpm] as BPMSegment).getBps();
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.bpm++;
                    break;
                case FoundEventType.STOP:
                case FoundEventType.STOP_DELAY:
                    const stopSeg = (stops[start.stop] as StopSegment);
                    timeToNextEvent = stopSeg.getPause();
                    nextEventTime = start.lastTime + timeToNextEvent;
                    start.lastTime = nextEventTime;
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.stop++;
                    break;
                case FoundEventType.DELAY:
                    timeToNextEvent = (delays[start.delay] as DelaySegment).getPause();
                    nextEventTime = start.lastTime + timeToNextEvent;
                    start.lastTime = nextEventTime;
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.delay++;
                    break;
                case FoundEventType.MARKER:
                    return start.lastTime;
                case FoundEventType.WARP:
                    start.isWarping = true;
                    const warpSeg = (warps[start.warp] as WarpSegment);
                    const warpSum = warpSeg.getLength() + warpSeg.getBeat();
                    if (warpSum > start.warpDestination) {
                        start.warpDestination = warpSum;
                    }
                    // INC_INDEX next 2 lines
                    curSegment++;
                    start.warp++;
                    break;
                default:
                    break;
            }
            start.lastRow = eventRow.value;
        }
        return start.lastTime;
    }

    public prepareLookup() {
        // If multiple players have the same timing data, then adding to the
        // lookups would probably cause FindEntryInLookup to return the wrong
        // thing.  So release the lookups. -Kyz
        this.releaseLookup();
        const segmentsPerLookup = 16;
        const segs = this.timingSegments;
        const bpms = segs[TimingSegmentType.BPM];
        const warps = segs[TimingSegmentType.WARP];
        const stops = segs[TimingSegmentType.STOP];
        const delays = segs[TimingSegmentType.DELAY];

        const totalSegments = bpms.length + warps.length + stops.length + delays.length;
        const lookupEntries = Math.trunc(totalSegments / segmentsPerLookup); // int
        // extend the arrays with 'undefined' entries
        this.beatStartLookup.length = lookupEntries;
        this.timeStartLookup.length = lookupEntries;
        for (let curSegment = segmentsPerLookup; curSegment < totalSegments; curSegment += segmentsPerLookup) {
            const beatStart = new GetBeatStarts();
            beatStart.lastTime = -this.beat0OffsetInSecs;
            const args = new GetBeatArgs();
            args.elapsedTime = Number.MAX_VALUE;
            this.getBeatInternal(beatStart, args, curSegment);
            this.beatStartLookup.push([args.elapsedTime, beatStart]);

            const timeStart = new GetBeatStarts();
            timeStart.lastTime = -this.beat0OffsetInSecs;
            this.getElapsedTimeInternal(timeStart, Number.MAX_VALUE, curSegment);
            this.timeStartLookup.push([NoteHelpers.noteRowToBeat(timeStart.lastRow), timeStart]);
        }
        // If there are less than two entries, then FindEntryInLookup in lookup
        // will always decide there's no appropriate entry.  So clear the table.
        // -Kyz
        if (this.beatStartLookup.length < 2) { this.releaseLookup(); }
    }

    public releaseLookup() {
        this.beatStartLookup = [];
        this.timeStartLookup = [];
    }

    public segInfoStr(segs: TimingSegment[], index: number, name: string) {
        if (index < segs.length) {
            return `${name}: ${index} at ${segs[index].getRow()}`;
        }
        return `${name}: ${index} at end`;
    }

    public dumpOneLookupTable(lookup: BeatStartLookup, name: string) {
        const segs = this.timingSegments;
        const bpms = segs[TimingSegmentType.BPM];
        const warps = segs[TimingSegmentType.WARP];
        const stops = segs[TimingSegmentType.STOP];
        const delays = segs[TimingSegmentType.DELAY];
        console.debug(`${name} lookup table:`);
        for (let lit = 0; lit < lookup.length; lit++) {
            const item = lookup[lit];
            if (item === undefined) { throw new Error('item should never be undefined'); }
            const starts = item[1];
            console.debug(`${lit}: ${item[0]}`);

            const bpmInfo = this.segInfoStr(bpms, starts.bpm, 'bpm');
            const warpInfo = this.segInfoStr(warps, starts.warp, 'warp');
            const stopInfo = this.segInfoStr(stops, starts.stop, 'stop');
            const delayInfo = this.segInfoStr(delays, starts.delay, 'delay');
            const str = `  ${bpmInfo}, ${warpInfo}, ${stopInfo}, ${delayInfo},\n` +
                        `  lastRow: ${starts.lastRow}, lastTime: ${starts.lastTime},\n` +
                        `  warpDestination: ${starts.warpDestination}, isWarping: ${starts.isWarping}`;
            console.debug(str);
        }
    }

    public dumpLookupTables() {
        console.debug('Dumping timing data lookup tables');
        this.dumpOneLookupTable(this.beatStartLookup, 'beatStartLookup');
        this.dumpOneLookupTable(this.timeStartLookup, 'timeStartLookup');
        console.debug('Finished dumping lookup tables');
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
    public getBpmSegmentAtRow(noteRow: number) {
        const t = this.getSegmentAtRow(noteRow, TimingSegmentType.BPM);
        return (t as BPMSegment);
    }
    public getStopSegmentAtRow(noteRow: number) {
        const t = this.getSegmentAtRow(noteRow, TimingSegmentType.STOP);
        return (t as StopSegment);
    }
    public getDelaySegmentAtRow(noteRow: number) {
        const t = this.getSegmentAtRow(noteRow, TimingSegmentType.DELAY);
        return (t as DelaySegment);
    }

    /* convenience aliases (Set functions are deprecated) */
    public getBpmAtRow(noteRow: number) { return this.getBpmSegmentAtRow(noteRow).getBpm(); }
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
        if (onSameRow && (cur.equals(seg))) {
            return;
        }

        // Copy() the segment (which allocates a new segment), assign it
        // to the position of the old one, then delete the old pointer.
        // TODO: probably not the best way to do this in js -Struz
        const copy = Object.assign(Object.create(Object.getPrototypeOf(seg)), seg);
        if (onSameRow) {
            // TODO: check memory leaks
            // delete the existing segment and replace it
            segs[index] = copy;
        } else {
            // Find the first element that isn't comparatively less than `copy`
            let i = segs.findIndex((ts) => !ts.lessThan(copy));
            if (i === -1) {
                // No element is < copy, insert at end to maintain ordering
                i = segs.length;
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

        // TODO: this not working? Not finding correct segment
        // BECAUSE ITS ORDERED IN REVERSE

        const min = 0;
        const max = segs.length - 1;
        let l = min;
        let r = max;
        // Do a binary search to find the row, if any
        while ( l <= r ) {
            const m = Math.trunc((l + r) / 2); // int
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
    public getSegmentIndexAtBeat(tst: TimingSegmentType, beat: number) {
        return this.getSegmentIndexAtRow(tst, NoteHelpers.beatToNoteRow(beat));
    }

    public getNextSegmentBeatAtRow(tst: TimingSegmentType, row: number) {
        const segs = this.getTimingSegments(tst);
        for (const seg of segs) {
            if (seg.getRow() <= row) { continue; }
            return seg.getBeat();
        }
        return NoteHelpers.noteRowToBeat(row);
    }
    public getNextSegmentBeatAtBeat(tst: TimingSegmentType, beat: number) {
        return this.getNextSegmentBeatAtRow(tst, NoteHelpers.beatToNoteRow(beat));
    }

    public getPreviousSegmentBeatAtRow(tst: TimingSegmentType, row: number) {
        let backup = -1;
        const segs = this.getTimingSegments(tst);
        for (const seg of segs) {
            if (seg.getRow() >= row) { break; }
            backup = seg.getBeat();
        }
        return (backup > -1) ? backup : NoteHelpers.noteRowToBeat(row);
    }
    public getPreviousSegmentBeatAtBeat(tst: TimingSegmentType, beat: number) {
        return this.getPreviousSegmentBeatAtRow(tst, NoteHelpers.beatToNoteRow(beat));
    }

    public getBeatFromElapsedTime(elapsedTime: number): number {
        const args = new GetBeatArgs();
        args.elapsedTime = elapsedTime;
        this.getBeatAndBpsFromElapsedTime(args);
        return args.beat;
    }

    public getBeatFromElapsedTimeNoOffset(second: number): number {
        // We don't support offset yet so this function does the same. Pass through. -Struz
        return this.getBeatFromElapsedTime(second);
    }

    public getElapsedTimeFromBeatNoOffset(beat: number): number {
        let start = new GetBeatStarts();
        start.lastTime = -this.beat0OffsetInSecs;
        const lookedUpStart = TimingData.findEntryInLookup(this.timeStartLookup, beat);
        if (lookedUpStart !== undefined) {
            start = lookedUpStart[1];
        }
        this.getElapsedTimeInternal(start, beat, Number.MAX_SAFE_INTEGER);
        return start.lastTime;
    }

    public getElapsedTimeFromBeat(beat: number): number {
        return this.getElapsedTimeFromBeatNoOffset(beat);
        // The C++ code handles hasted music rate here but we don't implement that -Struz
    }

    public getBeatAndBpsFromElapsedTime(args: GetBeatArgs) {
        // The C++ code handles hasted music rate here but we don't implement that -Struz
        this.getBeatAndBpsFromElapsedTimeNoOffset(args);
    }

    public getBeatAndBpsFromElapsedTimeNoOffset(args: GetBeatArgs): void {
        let start = new GetBeatStarts();
        start.lastTime = -this.beat0OffsetInSecs;
        const lookedUpStart = TimingData.findEntryInLookup(this.beatStartLookup, args.elapsedTime);
        if (lookedUpStart !== undefined) {
            start = lookedUpStart[1];
        }
        this.getBeatInternal(start, args, Number.MAX_SAFE_INTEGER);
    }

    public getDisplayedSpeedPercent(songBeat: number, musicSeconds: number) {
        const speeds = this.getTimingSegments(TimingSegmentType.SPEED);
        if (speeds.length === 0) { return 1; }
        return 1;

        // TODO: finish me when we implement SpeedSegment

        // const index = this.getSegmentIndexAtBeat(TimingSegmentType.SPEED, songBeat);

        // const seg = (speeds[index] as SpeedSegment);
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
