import { TimingSegment, TimingSegmentType, SegmentEffectType } from './TimingSegments';

const INVALID_INDEX: number = -1;

// Holds data for translating beats<->seconds.
export class TimingData {
    /** The initial offset of a song. */
    private beat0OffsetInSecs: number = 0;
    // All of the following vectors must be sorted before gameplay.
    private timingSegments: TimingSegment[][] = [];

    constructor() {
        // TimingSegments has one array per valid TimingSegmentType enum
        for (let i = 0; i < TimingSegmentType.NUM_TimingSegmentType; i++) {
            this.timingSegments.push([]);
        }
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

    public addSegment(seg: TimingSegment) {
        // TODO: add debug logging flag and put a debug log here
        const tst = seg.getType();

        // TODO: omg this is a complex function
        const segs = this.timingSegments[tst];

        // Optimisation: if this is our first segment, push and return
        if (segs.length === 0) {
            // TODO: make sure this shallow copy actually works for all delay types
            const copy = Object.assign(Object.create(Object.getPrototypeOf(seg)), seg);
            segs.push(copy);
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
                    let next: TimingSegment = segs[index + 1];
                    // IMPORTANT: TODO: implement .equals methods since this won't work
                    if (seg === next) {
                        // The segment after this new one is redundant
                        if (seg === prev) {
                            // This new segment is redundant.  Erase the next segment and
                            // ignore this new one.
                            segs.splice(index + 1, 1);
                            // NOTE: this is actual pointer math in StepMania, not object .equals
                            if (prev !== cur) {
                                segs.splice(index, 1);
                            }
                            return;
                        } else {
                            // Move the next segment's start back to this row.
                            next.setRow(seg.getRow());
                            // NOTE: this is actual pointer math in StepMania, not object .equals
                            if (prev !== cur) {
                                segs.splice(index, 1);
                            }
                            return;
                        }
                    } else {
                        // if true, this is redundant segment change
                        if (prev === seg) {
                            // NOTE: this is actual pointer math in StepMania, not object .equals
                            if (prev !== cur) {
                                segs.splice(index, 1);
                            }
                            return;
                        }
                    }
                } else {
                    // if true, this is redundant segment change
                    if (prev === seg) {
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
}
export default TimingData;
